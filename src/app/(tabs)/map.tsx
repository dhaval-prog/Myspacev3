// 10 Map — everyone who shares their location on a real map (Mapbox on web, Apple/Google Maps on
// device): friends plus anyone who shows themselves to everyone, so people can add friends they
// find nearby. Without a Mapbox token on web it falls back to the sticker map, where direction is
// true bearing and distance is log-scaled around you.
//
// "Naked" design: at rest it's only the map, people's faces and your dot. Tap the map for the
// search pill, filters, the row of faces and the menu bar; tap someone to glide to them; hold your
// own dot to choose who can see you.
import { router } from 'expo-router';

import { toTab } from '@/ui/nav';
import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { firstOf } from '@/state/store';
import { anim, E, skPop, skPulse, skUp } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { Person } from '@/ui/Person';
import { A, Icon, ICON, IS_WEB, Press, Stage, T, useY } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';
// eslint-disable-next-line import/no-unresolved -- resolved per platform (.web.tsx / .native.tsx)
import { FriendsMapCanvas } from '@/v2/components/friends/map/FriendsMapCanvas';
import type { FriendsMapCameraCommand, FriendsMapCanvasPin } from '@/v2/components/friends/map/friendsMapCanvasTypes';
import { FriendsMapPinAnchor } from '@/v2/components/friends/map/FriendsMapPinAnchor';
import { useFriends } from '@/v2/context/FriendsContext';
import { ThrowProvider, useThrow } from '@/v2/context/ThrowContext';
import { MAPBOX_TOKEN } from '@/v2/lib/mapbox';
import { supabase } from '@/v2/lib/supabase';
import type { LocationVisibility } from '@/v2/types/throw';
import {
  clusterPins,
  distanceKm,
  fitViewport,
  focusCamera,
  formatDistanceKm,
  isLive,
  latFromV,
  mercatorV,
  NEARBY_KM,
  worldWidth,
  type ClusterGroup,
} from '@/v2/utils/friendsMapMath';
import { timeAgo } from '@/v2/utils/relativeTime';

/** Real map everywhere except web builds without a Mapbox token (those keep the sticker map). */
const REAL_MAP = Platform.OS !== 'web' || !!MAPBOX_TOKEN;
const DEFAULT_CAMERA = { zoom: 4, center: { latitude: 21.5, longitude: 79.5 } };

type LL = { latitude: number; longitude: number };
/** Camera that fits `points` on screen (the map is the whole screen now, so no offset). */
function fitAbove(points: LL[], maxZoom = 12): { center: LL; zoom: number } | null {
  if (points.length === 1) return { center: focusCamera(points[0], 11).center, zoom: 11 };
  const fit = fitViewport(points);
  if (!fit) return null;
  const zoom = Math.min(fit.zoom, maxZoom);
  return { zoom, center: { latitude: latFromV(mercatorV(fit.center.latitude)), longitude: fit.center.longitude } };
}

const I = C.deep;
/** The map's one accent colour: you, live people and the selected person. */
const Lm = '#324AF5';
/** White halo so plain text stays readable straight on the map (no boxes behind it). */
const HALO: TextStyle = { textShadowColor: 'rgba(255,255,255,.95)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 };
const HINT_KEY = 'myspace.mapNakedHint.v1';
// "You" sits here on the 790×1244 map canvas — mid-way between the search bar and the sheet.
const ME_X = 393;
const ME_Y = 565;
/** Pixels from "you" for a real distance: log-scaled so 1 km and 2,000 km both fit on screen. */
const radiusFor = (km: number) => Math.min(150, 30 + 40 * Math.log10(1 + km));

type Contact = {
  userId: string;
  connectionId: string | null;
  name: string;
  avatarUrl: string | null;
  city: string;
  live: boolean;
  ago: string;
  /** Hours since their location last updated (Infinity when unknown). */
  ageH: number;
  km: number;
  bearing: number;
  isFriend: boolean;
  lat: number;
  lon: number;
  x: number;
  y: number;
};

type Cluster = ClusterGroup<Contact & { id: string }>;

type MapRow = {
  user_id: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  updated_at: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_friend: boolean;
};

type Filter = 'all' | 'live' | 'near';

/** Hours since an ISO time (Infinity when unknown) — how stale someone's location is. */
function hoursSince(iso: string | null | undefined) {
  return iso ? (Date.now() - Date.parse(iso)) / 3_600_000 : Infinity;
}

function bearingDeg(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const r = Math.PI / 180;
  const y = Math.sin((b.longitude - a.longitude) * r) * Math.cos(b.latitude * r);
  const x = Math.cos(a.latitude * r) * Math.sin(b.latitude * r) - Math.sin(a.latitude * r) * Math.cos(b.latitude * r) * Math.cos((b.longitude - a.longitude) * r);
  return Math.atan2(y, x) / r;
}

/** Map a real distance/bearing to canvas coordinates around "you". */
function place(km: number, bearing: number) {
  const radius = radiusFor(km);
  const t = (bearing * Math.PI) / 180;
  return { x: ME_X + radius * Math.sin(t), y: ME_Y - radius * Math.cos(t) };
}

/** A person on the map: just their face in a white ring. Live people breathe a soft blue glow;
 * people who haven't updated in a day fade and shrink. Names appear when selected or zoomed in. */
function AvatarGlyph({ c, on, showName }: { c: Contact; on: boolean; showName: boolean }) {
  const stale = !c.live && c.ageH > 24;
  const size = on ? 54 : stale ? 32 : 42;
  return (
    <A style={[{ alignItems: 'center' }, anim(skPop(), 0.35, 0, E.s14)]}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {c.live || on ? (
          <A
            pointerEvents="none"
            style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(50,74,245,.35)' }, anim(skPulse(), 2.4, 0, 'ease-out', 'infinite')]}
          />
        ) : null}
        <View
          style={
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: on ? 3 : 2.5,
              borderColor: on ? Lm : '#fff',
              borderStyle: c.isFriend || on ? 'solid' : 'dashed',
              overflow: 'hidden',
              backgroundColor: '#fff',
              opacity: stale && !on ? 0.55 : 1,
              boxShadow: '0 4px 12px rgba(20,24,40,.22)',
            } as ViewStyle
          }>
          <Person id={c.userId} name={c.name} avatarUrl={c.avatarUrl} size={size - (on ? 6 : 5)} font={on ? 16 : 13} ink={C.ink} />
        </View>
      </View>
      {showName ? (
        <T f={on ? F.b8 : F.b6} s={on ? 13 : 11.5} c={C.ink} style={[{ marginTop: 3 }, HALO]} lines={1}>
          {firstOf(c.name)}
        </T>
      ) : null}
    </A>
  );
}

/** Sticker-map (no Mapbox token) pin: positioned on the canvas around "you". */
function Pin({ c, on, onPress }: { c: Contact; on: boolean; onPress: () => void }) {
  return (
    <View style={{ position: 'absolute', left: c.x - 40, top: c.y - 30, width: 80, height: 80, alignItems: 'center', zIndex: on ? 3 : 1 }} pointerEvents="box-none">
      <Press onPress={onPress} accessibilityLabel={c.name}>
        <AvatarGlyph c={c} on={on} showName={on} />
      </Press>
    </View>
  );
}

/** Several people too close to tell apart at this zoom: overlapping faces and a count. */
function ClusterGlyph({ group }: { group: Cluster }) {
  const shown = group.items.slice(0, 3);
  return (
    <A style={[{ alignItems: 'center' }, anim(skPop(), 0.35)]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {shown.map((c, k) => (
          <View key={c.userId} style={{ marginLeft: k ? -14 : 0, borderRadius: 999, borderWidth: 2.5, borderColor: '#fff', boxShadow: '0 4px 12px rgba(20,24,40,.2)' } as ViewStyle}>
            <Person id={c.userId} name={c.name} avatarUrl={c.avatarUrl} size={34} font={11} ink={C.ink} />
          </View>
        ))}
        <View style={{ marginLeft: -8, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: C.ink, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <T f={F.m7} s={10.5} c="#fff">
            {group.items.length}
          </T>
        </View>
      </View>
    </A>
  );
}

/** "You": a pulsing dot. Hold it to choose who can see you. The web canvas anchors at its top-left. */
function MeDot({ onLongPress }: { onLongPress?: () => void }) {
  return (
    <View style={[{ width: 22, height: 22 }, IS_WEB ? { position: 'absolute', left: -11, top: -11 } : null]}>
      <A pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(50,74,245,.4)' }, anim(skPulse(), 2, 0, 'ease-out', 'infinite')]} />
      <Pressable onLongPress={onLongPress} delayLongPress={400} hitSlop={14} accessibilityRole="button" accessibilityLabel="You — hold to choose who can see you">
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: Lm, borderWidth: 4, borderColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.2)' } as ViewStyle} />
      </Pressable>
    </View>
  );
}

const VIS_OPTIONS: [LocationVisibility, string][] = [
  ['all', 'Everyone'],
  ['friends', 'Friends'],
  ['ghost', 'Hidden'],
];

/** A plain text action on the map (no button box). */
function TextAction({ label, onPress, color = Lm, a11y }: { label: string; onPress: () => void; color?: string; a11y?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={a11y ?? label} style={({ pressed }) => pressed && { opacity: 0.6 }}>
      <T f={F.b8} s={15} c={color} style={HALO}>
        {label}
      </T>
    </Pressable>
  );
}

function MapInner() {
  const y = useY();
  const { myLocation, friends: throwFriends, loading, locationVisibility, setLocationVisibility } = useThrow();
  const { friends, openChat, sendRequestToUser } = useFriends();
  const [extra, setExtra] = useState<MapRow[] | null>(null);
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [command, setCommand] = useState<FriendsMapCameraCommand | null>(null);
  const tokenRef = useRef(0);
  // What this screen last saved; a Throw reload already in flight can briefly report the old value.
  const [chosen, setChosen] = useState<LocationVisibility | null>(null);
  const shownAs = chosen ?? locationVisibility;
  const [mf, setMf] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [addState, setAddState] = useState<Record<string, 'sending' | 'sent'>>({});
  const z = useSharedValue(1);
  useEffect(() => {
    z.value = withTiming(zoom, { duration: 450, easing: Easing.bezier(0.2, 0.8, 0.3, 1) });
  }, [zoom, z]);
  const mapSt = useAnimatedStyle(() => ({ transform: [{ scale: z.value }] }));

  const chooseVisibility = (v: LocationVisibility) => {
    if (v === shownAs) return;
    setLocationVisibility(v);
    setChosen(v);
    supabase.auth.updateUser({ data: { map_choice: 'user' } }).catch(() => {});
  };

  // Everyone else on the map who isn't a friend (they show themselves to everyone).
  useEffect(() => {
    let live = true;
    supabase.rpc('get_map_locations').then(({ data, error }) => {
      if (!live) return;
      if (error) return console.warn('[map] get_map_locations failed:', error.message);
      setExtra(((data as MapRow[] | null) ?? []).filter((r) => !r.is_friend));
    });
    return () => {
      live = false;
    };
  }, []);

  const all = useMemo<Contact[]>(() => {
    if (!myLocation) return [];
    const me = { latitude: myLocation.latitude, longitude: myLocation.longitude };
    const mk = (
      userId: string,
      name: string,
      avatarUrl: string | null,
      lat: number,
      lon: number,
      city: string,
      updatedAt: string | null | undefined,
      isFriend: boolean,
    ): Contact => {
      const p = { latitude: lat, longitude: lon };
      const km = distanceKm(me, p);
      const bearing = bearingDeg(me, p);
      const live = isLive(updatedAt);
      const ageH = hoursSince(updatedAt);
      return {
        userId,
        connectionId: friends.find((x) => x.userId === userId)?.connectionId ?? null,
        name,
        avatarUrl,
        city,
        live,
        ago: live ? 'live now' : updatedAt ? `${timeAgo(updatedAt)} ago` : 'location unknown',
        ageH,
        km,
        bearing,
        isFriend,
        lat,
        lon,
        ...place(km, bearing),
      };
    };
    return [
      ...throwFriends
        .filter((f) => f.location)
        .map((f) => mk(f.userId, f.name, f.avatarUrl, f.location!.latitude, f.location!.longitude, `${f.location!.city}, ${f.location!.country}`, f.location!.updatedAt, true)),
      ...(extra ?? []).map((r) => mk(r.user_id, r.full_name?.trim() || 'Someone', r.avatar_url, r.latitude, r.longitude, `${r.city}, ${r.country}`, r.updated_at, false)),
    ].sort((a, b) => a.km - b.km);
  }, [myLocation, throwFriends, extra, friends]);

  const mq = q.trim().toLowerCase();
  const vis = all.filter(
    (p) => (mf === 'all' || (mf === 'live' && p.live) || (mf === 'near' && p.km <= NEARBY_KM)) && (!mq || p.name.toLowerCase().includes(mq) || p.city.toLowerCase().includes(mq)),
  );
  const chips: [Filter, string, number, boolean][] = [
    ['all', 'All', all.length, false],
    ['live', 'Live', all.filter((p) => p.live).length, true],
    ['near', 'Nearby', all.filter((p) => p.km <= NEARBY_KM).length, false],
  ];
  // Nobody is selected until you tap someone (the naked map starts empty of cards).
  const selected = sel;

  // --- real map camera -------------------------------------------------------------------------
  const send = (c: { center: LL; zoom: number } | null, animate = false) => {
    if (!c) return;
    tokenRef.current += 1;
    setCommand({ token: tokenRef.current, kind: 'jump', ...c, animate });
  };
  const me = myLocation ? { latitude: myLocation.latitude, longitude: myLocation.longitude } : null;
  // First view: you plus the closest few people, once everything has loaded.
  const ready = !loading && extra !== null;
  const initial = useMemo(() => {
    if (!ready) return null;
    const near = all.slice(0, 6).map((c) => ({ latitude: c.lat, longitude: c.lon }));
    return fitAbove(me ? [me, ...near] : all.map((c) => ({ latitude: c.lat, longitude: c.lon })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  const cameraCommand: FriendsMapCameraCommand | null = command ?? (initial ? { token: 0, kind: 'jump', ...initial } : null);

  const groups = useMemo(
    () => clusterPins(vis.map((c) => ({ ...c, id: c.userId })), { zoom: camera.zoom, selectedId: selected }),
    [vis, camera.zoom, selected],
  );
  const groupById = new Map<string, Cluster>();
  const pins: FriendsMapCanvasPin[] = groups.map((g) => {
    const id = g.items.length === 1 ? g.items[0].userId : `cluster:${g.items.map((i) => i.userId).join(',')}`;
    groupById.set(id, g);
    return { id, latitude: g.lat, longitude: g.lon, zIndex: g.items.some((i) => i.userId === selected) ? 10 : g.items.length > 1 ? 2 : 1 };
  });


  // --- naked chrome: hidden at rest, a tap on the map brings it in -----------------------------
  const [chrome, setChrome] = useState(false);
  const [visOpen, setVisOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const chromeV = useSharedValue(0);
  useEffect(() => {
    chromeV.set(withTiming(chrome ? 1 : 0, { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.3, 1) }));
  }, [chrome, chromeV]);
  const topSt = useAnimatedStyle(() => ({ opacity: chromeV.get(), transform: [{ translateY: (1 - chromeV.get()) * -24 }] }));
  const bottomSt = useAnimatedStyle(() => ({ opacity: chromeV.get(), transform: [{ translateY: (1 - chromeV.get()) * 40 }] }));
  // First visit: say how the hidden controls work, once.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(HINT_KEY)
      .then((seen) => {
        if (seen) return;
        setHint(true);
        AsyncStorage.setItem(HINT_KEY, '1').catch(() => {});
        t = setTimeout(() => setHint(false), 9000);
      })
      .catch(() => {});
    return () => clearTimeout(t);
  }, []);

  const select = (c: Contact) => {
    setSel(c.userId);
    setVisOpen(false);
    setMapsMenu(false);
    if (REAL_MAP) send(focusCamera({ latitude: c.lat, longitude: c.lon }, Math.max(camera.zoom, 11)), true);
  };
  const onMapPress = () => {
    setHint(false);
    setMapsMenu(false);
    if (visOpen) return setVisOpen(false);
    if (sel) return setSel(null);
    setChrome((v) => !v);
  };

  // The locate arrow only appears once you've moved the map away from yourself.
  const meOffscreen = (() => {
    if (!me || !REAL_MAP) return false;
    const w = worldWidth(camera.zoom);
    const dx = ((me.longitude - camera.center.longitude) / 360) * w;
    const dy = (mercatorV(me.latitude) - mercatorV(camera.center.latitude)) * w;
    return Math.hypot(dx, dy) > 160;
  })();

  // The locate arrow: tap flies you home; hold to open Apple Maps / Google Maps (directions to the
  // selected person, or your own spot when nobody is selected).
  const [mapsMenu, setMapsMenu] = useState(false);
  const mapsTarget = () => {
    const c = sel ? all.find((p) => p.userId === sel) : null;
    if (c) return { lat: c.lat, lon: c.lon, label: c.name, directions: true };
    if (me) return { lat: me.latitude, lon: me.longitude, label: 'My location', directions: false };
    return { lat: camera.center.latitude, lon: camera.center.longitude, label: 'Map', directions: false };
  };
  const openInMaps = (app: 'apple' | 'google') => {
    setMapsMenu(false);
    const t = mapsTarget();
    const ll = `${t.lat},${t.lon}`;
    const lq = encodeURIComponent(t.label);
    const url =
      app === 'apple'
        ? t.directions
          ? `https://maps.apple.com/?daddr=${ll}&q=${lq}`
          : `https://maps.apple.com/?ll=${ll}&q=${lq}`
        : t.directions
          ? `https://www.google.com/maps/dir/?api=1&destination=${ll}`
          : `https://www.google.com/maps/search/?api=1&query=${ll}`;
    Linking.openURL(url).catch(() => {});
  };
  const isApplePlatform =
    Platform.OS === 'ios' || (Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent));
  const onNavigate = () => {
    if (!isApplePlatform) openInMaps('google');
    else setMapsMenu((v) => !v);
  };
  const recenter = () => {
    setSel(null);
    if (!REAL_MAP) return setZoom(1);
    send(me ? fitAbove([me]) : initial, true);
  };

  const renderPin = (pin: FriendsMapCanvasPin) => {
    const g = groupById.get(pin.id);
    if (!g) return null;
    if (g.items.length > 1) {
      return (
        <FriendsMapPinAnchor width={130} tipOffset={17} onPress={() => send(fitAbove(g.items.map((i) => ({ latitude: i.lat, longitude: i.lon })), 14), true)}>
          <ClusterGlyph group={g} />
        </FriendsMapPinAnchor>
      );
    }
    const c = g.items[0];
    const on = c.userId === selected;
    const half = (on ? 54 : !c.live && c.ageH > 24 ? 32 : 42) / 2;
    return (
      <FriendsMapPinAnchor width={120} tipOffset={half} onPress={() => select(c)}>
        <AvatarGlyph c={c} on={on} showName={on || camera.zoom >= 12} />
      </FriendsMapPinAnchor>
    );
  };

  const addFriend = async (c: Contact) => {
    setAddState((s) => ({ ...s, [c.userId]: 'sending' }));
    const { error } = await sendRequestToUser(c.userId);
    setAddState((s) => {
      const n = { ...s };
      if (error) delete n[c.userId];
      else n[c.userId] = 'sent';
      return n;
    });
  };

  const selC = sel ? all.find((p) => p.userId === sel) ?? null : null;
  // Bottom stack: the menu bar (92) + the row of faces (~70) when the chrome is showing.
  const infoBottom = chrome ? 92 + 84 : 34;

  return (
    <>
      {REAL_MAP ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0 }}>
          <FriendsMapCanvas
            me={me}
            pins={pins}
            renderPin={renderPin}
            renderMe={() => <MeDot onLongPress={() => setVisOpen(true)} />}
            cameraCommand={cameraCommand}
            onCameraChange={setCamera}
            onMapPress={onMapPress}
          />
        </View>
      ) : (
        <Stage>
          <Pressable style={StyleSheet.absoluteFill} onPress={onMapPress} accessibilityLabel="Map" />
          <Animated.View
            pointerEvents="box-none"
            style={[
              {
                position: 'absolute',
                left: -200,
                top: y(-200),
                width: 790,
                height: 1244,
                transformOrigin: `${ME_X}px ${ME_Y}px`,
              } as ViewStyle,
              mapSt,
            ]}>
            {myLocation ? (
              <View style={{ position: 'absolute', left: ME_X - 11, top: ME_Y - 11, width: 22, height: 22 }}>
                <MeDot onLongPress={() => setVisOpen(true)} />
              </View>
            ) : null}
            {vis.map((c) => (
              <Pin key={c.userId} c={c} on={c.userId === selected} onPress={() => select(c)} />
            ))}
          </Animated.View>
        </Stage>
      )}

      {/* top: one search pill + plain-text filters (only while the chrome is showing) */}
      <Animated.View pointerEvents={chrome ? 'box-none' : 'none'} style={[{ position: 'absolute', left: 16, right: 16, top: y(54) }, topSt]}>
        <View style={{ height: 46, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.94)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 6, boxShadow: '0 8px 24px rgba(20,24,40,.14)' } as ViewStyle}>
          <Icon d={ICON.search} size={17} color="rgba(22,33,12,.55)" sw={2} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search people or places"
            placeholderTextColor="rgba(17,17,17,.35)"
            autoCorrect={false}
            accessibilityLabel="Search people or places"
            style={{ flex: 1, minWidth: 0, fontFamily: F.b5, fontSize: 14.5, color: I, outlineStyle: 'none' } as unknown as TextStyle}
          />
          <Pressable onPress={() => router.push('/friends')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Add a friend" style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.addFriend} size={20} color={Lm} sw={2.1} />
          </Pressable>
        </View>
        <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 22 }}>
          {chips.map(([id, label, n]) => {
            const on = mf === id;
            return (
              <Pressable key={id} onPress={() => setMf(id)} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: on }} style={{ alignItems: 'center' }}>
                <T f={on ? F.b8 : F.b6} s={13.5} c={on ? C.ink : 'rgba(22,33,12,.5)'} style={HALO}>
                  {label} {n}
                </T>
                <View style={{ marginTop: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: on ? Lm : 'transparent' }} />
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* the row of faces, nearest first (only while the chrome is showing) */}
      <Animated.View pointerEvents={chrome ? 'box-none' : 'none'} style={[{ position: 'absolute', left: 0, right: 0, bottom: 92 + 10 }, bottomSt]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
          {vis.map((c) => {
            const on = c.userId === selected;
            return (
              <Pressable key={c.userId} onPress={() => select(c)} accessibilityRole="button" accessibilityLabel={c.name} style={({ pressed }) => [{ alignItems: 'center' }, pressed && { transform: [{ scale: 0.92 }] }]}>
                <View style={{ borderRadius: 999, borderWidth: 2.5, borderColor: on ? Lm : '#fff', boxShadow: '0 4px 12px rgba(20,24,40,.2)', opacity: !c.live && c.ageH > 24 && !on ? 0.6 : 1 } as ViewStyle}>
                  <Person id={c.userId} name={c.name} avatarUrl={c.avatarUrl} size={44} font={14} ink={C.ink} />
                </View>
                {c.live ? <View style={{ position: 'absolute', right: 0, top: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Lm, borderWidth: 2, borderColor: '#fff' }} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* the selected person: one line, and plain-text actions */}
      {selC ? (
        <A key={selC.userId} style={[{ position: 'absolute', left: 20, right: 20, bottom: infoBottom, alignItems: 'center', gap: 6 }, anim(skUp(), 0.35, 0, E.out)]}>
          <T f={F.b8} s={18} c={C.ink} style={HALO} lines={1}>
            {selC.name}
          </T>
          <T f={F.b5} s={13} c="rgba(22,33,12,.65)" style={HALO} lines={1}>
            {[selC.city.split(',')[0], selC.ago, formatDistanceKm(selC.km)].join(' · ')}
          </T>
          <View style={{ flexDirection: 'row', gap: 26, marginTop: 4 }}>
            {selC.isFriend ? (
              <>
                <TextAction label="Throw" a11y={`Throw a letter to ${selC.name}`} onPress={() => toTab({ pathname: '/throw', params: { focus: selC.userId } })} />
                {selC.connectionId ? (
                  <TextAction
                    label="Chat"
                    a11y={`Chat with ${firstOf(selC.name)}`}
                    color={C.ink}
                    onPress={() => {
                      openChat(selC.connectionId!);
                      router.push('/thread');
                    }}
                  />
                ) : null}
              </>
            ) : (
              <TextAction
                label={addState[selC.userId] === 'sent' ? 'Requested ✓' : addState[selC.userId] === 'sending' ? '…' : 'Add friend'}
                onPress={() => !addState[selC.userId] && addFriend(selC)}
              />
            )}
          </View>
        </A>
      ) : null}

      {/* hold your dot: who can see you */}
      {visOpen ? (
        <A style={[{ position: 'absolute', left: 20, right: 20, bottom: infoBottom, alignItems: 'center', gap: 8 }, anim(skUp(), 0.3, 0, E.out)]}>
          <T f={F.m7} s={10.5} ls={1.4} c="rgba(22,33,12,.6)" style={HALO}>
            WHO CAN SEE YOU
          </T>
          <View style={{ flexDirection: 'row', gap: 24 }} accessibilityRole="radiogroup" accessibilityLabel="Who can see you on the map">
            {VIS_OPTIONS.map(([v, label]) => {
              const on = shownAs === v;
              return (
                <Pressable key={v} onPress={() => chooseVisibility(v)} hitSlop={8} accessibilityRole="radio" accessibilityState={{ checked: on }} style={{ alignItems: 'center' }}>
                  <T f={on ? F.b8 : F.b6} s={15} c={on ? C.ink : 'rgba(22,33,12,.5)'} style={HALO}>
                    {label}
                  </T>
                  <View style={{ marginTop: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: on ? Lm : 'transparent' }} />
                </Pressable>
              );
            })}
          </View>
        </A>
      ) : null}

      {/* no location yet */}
      {!loading && !myLocation ? (
        <View style={{ position: 'absolute', left: 20, right: 20, top: '42%', alignItems: 'center', gap: 6 }}>
          <T f={F.b7} s={15} c={C.ink} style={HALO} center>
            Set your location to see people nearby
          </T>
          <TextAction label="Open Throw" onPress={() => toTab('/throw')} />
        </View>
      ) : loading && !all.length ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: '45%', alignItems: 'center' }}>
          <ActivityIndicator color={Lm} />
        </View>
      ) : null}

      {/* locate arrow, only once you've panned away from yourself */}
      {meOffscreen ? (
        <A style={[{ position: 'absolute', right: 16, bottom: chrome ? 92 + 84 : 34 }, anim(skPop(), 0.3, 0, E.s14)]}>
          {mapsMenu ? (
            <View style={{ position: 'absolute', right: 0, bottom: 56, width: 150, gap: 10, alignItems: 'flex-end' }}>
              <TextAction label="Apple Maps" color={C.ink} onPress={() => openInMaps('apple')} a11y="Open in Apple Maps" />
              <TextAction label="Google Maps" color={C.ink} onPress={() => openInMaps('google')} a11y="Open in Google Maps" />
            </View>
          ) : null}
          <Pressable
            onPress={recenter}
            onLongPress={onNavigate}
            accessibilityRole="button"
            accessibilityLabel="Back to me — hold to open in Maps"
            style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.94)', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(20,24,40,.18)' } as ViewStyle, pressed && { transform: [{ scale: 0.92 }] }]}>
            <Icon d={ICON.locate} size={17} color={Lm} sw={2.4} />
          </Pressable>
        </A>
      ) : null}

      {/* first visit only */}
      {hint ? (
        <A pointerEvents="none" style={[{ position: 'absolute', left: 24, right: 24, bottom: 40, alignItems: 'center' }, anim(skUp(), 0.4, 0.6, E.out)]}>
          <T f={F.b6} s={13} c="rgba(22,33,12,.7)" style={HALO} center>
            Tap the map for menu · Hold your dot to choose who sees you
          </T>
        </A>
      ) : null}

      {/* the menu bar comes and goes with the rest of the chrome */}
      <Animated.View pointerEvents={chrome ? 'box-none' : 'none'} style={[StyleSheet.absoluteFill, bottomSt]}>
        <TabBar active="map" />
      </Animated.View>
    </>
  );
}

export default function MapScreen() {
  return (
    <Screen bar={I} style={{ backgroundColor: '#F6F5F1' }}>
      <ThrowProvider>
        <MapInner />
      </ThrowProvider>
    </Screen>
  );
}
