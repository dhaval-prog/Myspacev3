// 10 Map — everyone who shares their location on a real map (Mapbox on web, Apple/Google Maps on
// device): friends plus anyone who shows themselves to everyone, so people can add friends they
// find nearby. Without a Mapbox token on web it falls back to the sticker map, where direction is
// true bearing and distance is log-scaled around you.
import { router } from 'expo-router';

import { toTab } from '@/ui/nav';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { firstOf } from '@/state/store';
import { anim, E, skBlink, skPin, skPop, skPulse, skSheet, skSlideIn, skUp } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { Person } from '@/ui/Person';
import { A, Icon, ICON, IS_WEB, Plane, Press, pushed, Stage, T, useY } from '@/ui/primitives';
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
  clampZoom,
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
/** Camera that fits `points` into the strip between the search bar and the bottom sheet
 * (the map centre sits behind the sheet, so shift the view ~120px up). */
function fitAbove(points: LL[], maxZoom = 12): { center: LL; zoom: number } | null {
  if (points.length === 1) return { center: focusCamera(points[0], 11).center, zoom: 11 };
  const fit = fitViewport(points);
  if (!fit) return null;
  const zoom = Math.min(fit.zoom, maxZoom);
  return { zoom, center: { latitude: latFromV(mercatorV(fit.center.latitude) + 120 / worldWidth(zoom)), longitude: fit.center.longitude } };
}

const I = C.deep;
/** Map's accent — blue instead of the app's lime (also the people sheet's colour). */
const Lm = '#324AF5';
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

/** The sticker pin: teardrop avatar (dashed for people who aren't friends yet) over a time tag. */
function PinGlyph({ c, on, delay }: { c: Contact; on: boolean; delay: number }) {
  const size = useSharedValue(on ? 56 : 42);
  useEffect(() => {
    size.value = withTiming(on ? 56 : 42, { duration: 300, easing: Easing.bezier(0.2, 0.8, 0.3, 1.4) });
  }, [on, size]);
  const sz = useAnimatedStyle(() => ({ width: size.value, height: size.value, borderRadius: size.value / 2, borderBottomLeftRadius: 4 }));
  return (
    <A style={[{ alignItems: 'center', gap: 4 }, anim(skPin(), 0.6, delay, E.out)]}>
      <Animated.View
        style={[
          {
            transform: [{ rotate: '-45deg' }],
            backgroundColor: c.isFriend ? '#fff' : C.paper,
            padding: 3,
            borderWidth: 2,
            borderColor: C.ink,
            borderStyle: c.isFriend ? 'solid' : 'dashed',
            boxShadow: on ? '4px 4px 0 #111' : '2px 2px 0 #111',
          } as ViewStyle,
          sz,
        ]}>
        <View style={{ flex: 1, borderRadius: 999, overflow: 'hidden', transform: [{ rotate: '45deg' }] }}>
          <Person id={c.userId} name={c.name} avatarUrl={c.avatarUrl} size={on ? 46 : 32} font={13} ink={C.ink} />
        </View>
      </Animated.View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.isFriend ? C.ink : '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 }}>
        {c.live ? <A style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.isFriend ? '#fff' : Lm }, anim(skBlink(), 1.2, 0, 'linear', 'infinite')]} /> : null}
        <T f={F.m7} s={9.5} ls={0.6} c={c.isFriend ? '#fff' : C.ink}>
          {c.isFriend ? c.ago : c.live ? 'LIVE' : firstOf(c.name).toUpperCase()}
        </T>
      </View>
    </A>
  );
}

/** Sticker-map pin: positioned on the canvas around "you". */
function Pin({ c, on, delay, onPress }: { c: Contact; on: boolean; delay: number; onPress: () => void }) {
  return (
    <View style={{ position: 'absolute', left: c.x - 60, top: c.y - 120, width: 120, height: 120, justifyContent: 'flex-end', alignItems: 'center', zIndex: on ? 3 : 1 }} pointerEvents="box-none">
      <Press onPress={onPress} accessibilityLabel={c.name}>
        <PinGlyph c={c} on={on} delay={delay} />
      </Press>
    </View>
  );
}

/** Several people too close to tell apart at this zoom: stacked avatars + a count. */
function ClusterGlyph({ group }: { group: Cluster }) {
  const shown = group.items.slice(0, 3);
  return (
    <A style={[{ alignItems: 'center' }, anim(skPop(), 0.35)]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 999, padding: 3, paddingRight: 9, boxShadow: '3px 3px 0 #111' } as ViewStyle}>
        {shown.map((c, k) => (
          <View key={c.userId} style={{ marginLeft: k ? -12 : 0, borderRadius: 999, borderWidth: 2, borderColor: '#fff' }}>
            <Person id={c.userId} name={c.name} avatarUrl={c.avatarUrl} size={30} font={11} ink={C.ink} />
          </View>
        ))}
        <T f={F.m7} s={12} style={{ marginLeft: 6 }}>
          {group.items.length}
        </T>
      </View>
    </A>
  );
}

/** "You": the blue locate dot with a pulse. The web canvas anchors at the dot's top-left. */
function MeDot() {
  return (
    <View style={[{ width: 22, height: 22 }, IS_WEB ? { position: 'absolute', left: -11, top: -11 } : null]}>
      <A style={[{ position: 'absolute', left: 0, top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(47,107,255,.35)' }, anim(skPulse(), 2, 0, 'ease-out', 'infinite')]} />
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.locate, borderWidth: 4, borderColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />
    </View>
  );
}

const VIS_OPTIONS: [LocationVisibility, string][] = [
  ['all', 'Everyone'],
  ['friends', 'Friends'],
  ['ghost', 'Hidden'],
];

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
      return {
        userId,
        connectionId: friends.find((x) => x.userId === userId)?.connectionId ?? null,
        name,
        avatarUrl,
        city,
        live,
        ago: live ? 'LIVE' : updatedAt ? `${timeAgo(updatedAt)} ago` : 'OFFLINE',
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
  const selected = sel ?? vis[0]?.userId ?? null;

  // --- people sheet shutter ----------------------------------------------------------------------
  const [sheetOpen, setSheetOpen] = useState(true);
  const sheetH = useSharedValue(300);
  const sheetY = useSharedValue(0);
  const sheetSt = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.get() }] }));
  const openSheet = () => {
    setSheetOpen(true);
    sheetY.set(withTiming(0, { duration: 420, easing: Easing.bezier(0.2, 0.9, 0.3, 1.15) }));
  };
  // Vertical drags only (sideways ones scroll the cards). Down past a little, or a quick flick, tucks it away.
  const sheetPan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-14, 14])
    .onUpdate((e) => {
      sheetY.set(e.translationY > 0 ? e.translationY : e.translationY / 6);
    })
    .onEnd((e) => {
      if (e.translationY > 70 || e.velocityY > 650) {
        sheetY.set(withTiming(sheetH.get() + 120, { duration: 260, easing: Easing.in(Easing.quad) }, () => scheduleOnRN(setSheetOpen, false)));
      } else {
        sheetY.set(withTiming(0, { duration: 260, easing: Easing.bezier(0.2, 0.9, 0.3, 1.15) }));
      }
    });

  // --- real map camera -------------------------------------------------------------------------
  const send = (c: { center: LL; zoom: number } | null) => {
    if (!c) return;
    tokenRef.current += 1;
    setCommand({ token: tokenRef.current, kind: 'jump', ...c });
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

  const select = (c: Contact) => {
    setSel(c.userId);
    if (REAL_MAP) send(focusCamera({ latitude: c.lat, longitude: c.lon }, camera.zoom));
  };
  const zoomBy = (d: number) => {
    if (REAL_MAP) send({ center: camera.center, zoom: clampZoom(Math.round(camera.zoom) + d) });
    else setZoom((v) => (d > 0 ? Math.min(1.6, +(v + 0.2).toFixed(2)) : Math.max(0.7, +(v - 0.2).toFixed(2))));
  };
  const recenter = () => {
    setSel(null);
    if (!REAL_MAP) return setZoom(1);
    send(me ? fitAbove([me]) : initial);
  };

  const renderPin = (pin: FriendsMapCanvasPin) => {
    const g = groupById.get(pin.id);
    if (!g) return null;
    if (g.items.length > 1) {
      return (
        <FriendsMapPinAnchor width={130} tipOffset={20} onPress={() => send(fitAbove(g.items.map((i) => ({ latitude: i.lat, longitude: i.lon })), 14))}>
          <ClusterGlyph group={g} />
        </FriendsMapPinAnchor>
      );
    }
    const c = g.items[0];
    const on = c.userId === selected;
    return (
      <FriendsMapPinAnchor width={120} tipOffset={on ? 80 : 66} onPress={() => select(c)}>
        <PinGlyph c={c} on={on} delay={0} />
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

  return (
    <>
      {REAL_MAP ? (
        // Own stacking layer so pins never paint over the search bar or the sheet.
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 0 }}>
          <FriendsMapCanvas me={me} pins={pins} renderPin={renderPin} renderMe={() => <MeDot />} cameraCommand={cameraCommand} onCameraChange={setCamera} />
        </View>
      ) : (
      <Stage>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -200,
              top: y(-200),
              width: 790,
              height: 1244,
              transformOrigin: `${ME_X}px ${ME_Y}px`,
              backgroundImage: 'linear-gradient(180deg, rgba(185,217,154,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(185,217,154,.35) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            } as ViewStyle,
            mapSt,
          ]}>
          <View style={{ position: 'absolute', left: 160, top: 500, width: 520, height: 14, backgroundColor: '#fff', opacity: 0.7, borderRadius: 7, transform: [{ rotate: '-18deg' }] }} />
          <View style={{ position: 'absolute', left: 350, top: 280, width: 12, height: 520, backgroundColor: '#fff', opacity: 0.6, borderRadius: 6, transform: [{ rotate: '12deg' }] }} />
          <View
            style={{ position: 'absolute', left: 430, top: 360, width: 120, height: 90, backgroundColor: C.park, opacity: 0.55, borderTopLeftRadius: 40, borderTopRightRadius: 60, borderBottomRightRadius: 30, borderBottomLeftRadius: 50 }}
          />
          <View
            style={{ position: 'absolute', left: 220, top: 640, width: 90, height: 70, backgroundColor: C.park, opacity: 0.45, borderTopLeftRadius: 30, borderTopRightRadius: 50, borderBottomRightRadius: 40, borderBottomLeftRadius: 30 }}
          />
          {/* distance rings */}
          {[10, 100, 1000].map((km) => {
            const r = radiusFor(km);
            return (
              <View
                key={km}
                pointerEvents="none"
                style={{ position: 'absolute', left: ME_X - r, top: ME_Y - r, width: r * 2, height: r * 2, borderRadius: r, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(22,33,12,.12)' }}
              />
            );
          })}
          {myLocation ? (
            <View style={{ position: 'absolute', left: ME_X - 11, top: ME_Y - 11, width: 22, height: 22 }}>
              <MeDot />
            </View>
          ) : null}
          {vis.map((c, k) => (
            <Pin key={c.userId} c={c} on={c.userId === selected} delay={0.15 + k * 0.08} onPress={() => setSel(c.userId)} />
          ))}
        </Animated.View>
      </Stage>
      )}

      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: y(REAL_MAP ? 150 : 190), backgroundImage: 'linear-gradient(180deg, rgba(221,237,223,.95), rgba(221,237,223,0))' } as ViewStyle} />

      {/* search + filters */}
      <A style={[{ position: 'absolute', left: 16, right: 16, top: y(54) }, anim(skUp(), 0.4)]}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, height: 50, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, ...hard(3) }}>
            <Icon d={ICON.search} size={17} color="rgba(22,33,12,.6)" sw={2} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search people or places"
              placeholderTextColor="rgba(17,17,17,.35)"
              autoCorrect={false}
              accessibilityLabel="Search people or places"
              style={{ flex: 1, minWidth: 0, fontFamily: F.b5, fontSize: 14.5, color: I, outlineStyle: 'none' } as any}
            />
          </View>
          <Press
            onPress={() => router.push('/friends')}
            accessibilityLabel="Add a friend"
            pressed={pushed(2, 1)}
            style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: C.tomato, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(3) }}>
            <Icon d={ICON.addFriend} size={20} color="#fff" sw={2.2} />
          </Press>
        </View>
        <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
          {chips.map(([id, label, n, dot], k) => {
            const on = mf === id;
            return (
              <A key={id} style={anim(skPop(), 0.35, 0.1 + k * 0.05)}>
                <Press
                  onPress={() => setMf(id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={{
                    height: 34,
                    paddingHorizontal: 14,
                    borderRadius: 17,
                    backgroundColor: on ? I : '#fff',
                    borderWidth: 1.5,
                    borderColor: on ? I : 'rgba(22,33,12,.12)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: on ? `2px 2px 0 ${Lm}` : '0 4px 12px rgba(22,33,12,.06)',
                  }}>
                  {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#8FB52E' }} /> : null}
                  <T f={F.b6} s={13} c={on ? '#fff' : I}>
                    {label}
                  </T>
                  <T f={F.dm4} s={11} c={on ? '#fff' : 'rgba(22,33,12,.5)'}>
                    {n}
                  </T>
                </Press>
              </A>
            );
          })}
        </View>
      </A>

      {/* zoom + locate */}
      <A style={[{ position: 'absolute', right: 16, top: y(330), gap: 8 }, anim(skSlideIn(), 0.4, 0.3)]}>
        <View style={{ width: 48, borderRadius: 24, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, overflow: 'hidden', ...hard(3) }}>
          <Press onPress={() => zoomBy(1)} accessibilityLabel="Zoom in" pressed={{ backgroundColor: '#EDF2EA' }} style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <T f={F.b5} s={22}>
              +
            </T>
          </Press>
          <View style={{ height: 1, backgroundColor: 'rgba(22,33,12,.12)', marginHorizontal: 10 }} />
          <Press onPress={() => zoomBy(-1)} accessibilityLabel="Zoom out" pressed={{ backgroundColor: '#EDF2EA' }} style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <T f={F.b5} s={22}>
              −
            </T>
          </Press>
        </View>
        <Press
          onPress={recenter}
          accessibilityLabel="Recenter"
          pressed={pushed(2, 1, I)}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(3) }}>
          <Icon d={ICON.locate} size={18} color={C.cobalt} sw={2.4} />
        </Press>
      </A>

      {/* glass sheet — a shutter: flick it down to tuck it away, tap the people button to bring it back */}
      <GestureDetector gesture={sheetPan}>
      <Animated.View
        pointerEvents={sheetOpen ? 'auto' : 'none'}
        onLayout={(e) => {
          sheetH.set(e.nativeEvent.layout.height);
        }}
        style={[{ position: 'absolute', left: 0, right: 0, bottom: 92 }, sheetSt]}>
      <A
        style={[
          {
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            borderWidth: 2,
            borderBottomWidth: 0,
            borderColor: C.ink,
            backgroundColor: Lm,
            boxShadow: '0 -10px 30px rgba(22,33,12,.18)',
            overflow: 'hidden',
          } as ViewStyle,
          anim(skSheet(260), 0.5, 0.2, E.sheet),
        ]}>
        <View style={{ paddingTop: 10, paddingBottom: 14 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.85)', alignSelf: 'center', marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 }}>
            <T f={F.d8} s={20} ls={-0.5} c="#fff">
              {vis.length} {vis.length === 1 ? 'person' : 'people'} · {vis.filter((p) => p.live).length} live
            </T>
            <View style={{ backgroundColor: C.ink, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 }}>
              <T f={F.m7} s={10} ls={1} c={C.sun}>
                NEAREST FIRST
              </T>
            </View>
          </View>
          {myLocation ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 10 }}>
              <T f={F.m7} s={10} ls={0.8} c="rgba(255,255,255,.8)">
                SHOW ME TO
              </T>
              <View style={{ flexDirection: 'row', backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 999, padding: 2 }} accessibilityRole="radiogroup" accessibilityLabel="Who can see you on the map">
                {VIS_OPTIONS.map(([v, label]) => {
                  const on = shownAs === v;
                  return (
                    <Press
                      key={v}
                      onPress={() => chooseVisibility(v)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      style={{ paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, backgroundColor: on ? (v === 'ghost' ? C.ink : Lm) : 'transparent' }}>
                      <T f={F.b7} s={12} c={on ? '#fff' : C.ink}>
                        {label}
                      </T>
                    </Press>
                  );
                })}
              </View>
            </View>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 5, paddingHorizontal: 20, paddingBottom: 8 }}>
            {vis.map((c, k) => {
              const on = c.userId === selected;
              const st = addState[c.userId];
              return (
                <A key={c.userId} style={anim(skSlideIn(), 0.4, 0.3 + k * 0.06, E.out)}>
                  <Press
                    onPress={() => select(c)}
                    accessibilityLabel={c.name}
                    style={{
                      width: 138,
                      borderRadius: 22,
                      backgroundColor: '#fff',
                      borderWidth: 2,
                      borderColor: C.ink,
                      boxShadow: on ? '5px 5px 0 #111' : '2px 2px 0 #111',
                      padding: 12,
                      gap: 8,
                      transform: [{ translateY: on ? -3 : 0 }],
                    }}>
                    <View style={{ width: 40, height: 40 }}>
                      <Person id={c.userId} name={c.name} avatarUrl={c.avatarUrl} size={40} font={13} ink={C.ink} style={{ borderWidth: 2, borderColor: C.ink }} />
                      {c.live ? <View style={{ position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Lm, borderWidth: 2, borderColor: C.ink }} /> : null}
                    </View>
                    <View>
                      <T f={F.b6} s={14} lines={1}>
                        {c.name}
                      </T>
                      {c.isFriend ? null : (
                        <T f={F.m7} s={9} ls={0.6} c="#4E6B1C">
                          NOT FRIENDS YET
                        </T>
                      )}
                      <T s={12} c="rgba(22,33,12,.6)" lines={1}>
                        {c.city}
                      </T>
                    </View>
                    {on ? (
                      <A style={[{ gap: 6 }, anim(skPop(), 0.3)]}>
                        {c.isFriend ? (
                          <>
                            <Press
                              onPress={() => toTab({ pathname: '/throw', params: { focus: c.userId } })}
                              accessibilityRole="button"
                              accessibilityLabel={`Throw a letter to ${c.name}`}
                              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 999, backgroundColor: C.tomato, borderWidth: 2, borderColor: C.ink, paddingVertical: 6 }}>
                              <Plane size={12} fill="#fff" />
                              <T f={F.b8} s={12} c="#fff">
                                Throw
                              </T>
                            </Press>
                            {c.connectionId ? (
                              <Press
                                onPress={() => {
                                  openChat(c.connectionId!);
                                  router.push('/thread');
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={`Chat with ${firstOf(c.name)}`}
                                style={{ alignItems: 'center', borderRadius: 999, borderWidth: 2, borderColor: C.ink, paddingVertical: 5 }}>
                                <T f={F.b7} s={12}>
                                  Chat
                                </T>
                              </Press>
                            ) : null}
                          </>
                        ) : (
                          <Press
                            onPress={() => !st && addFriend(c)}
                            accessibilityRole="button"
                            style={{ alignItems: 'center', borderRadius: 999, backgroundColor: st === 'sent' ? '#fff' : Lm, borderWidth: 2, borderColor: C.ink, paddingVertical: 6 }}>
                            <T f={F.b8} s={12} c={st === 'sent' ? C.ink : '#fff'}>
                              {st === 'sent' ? 'Requested ✓' : st === 'sending' ? '…' : 'Add friend'}
                            </T>
                          </Press>
                        )}
                      </A>
                    ) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <T f={F.m7} s={11}>
                          {formatDistanceKm(c.km)}
                        </T>
                        <T f={F.m4} s={10} c={c.live ? '#4E6B1C' : 'rgba(22,33,12,.5)'}>
                          {c.live ? 'LIVE' : c.ago.replace(' ago', '')}
                        </T>
                      </View>
                    )}
                  </Press>
                </A>
              );
            })}
            {loading && !all.length ? (
              <View style={{ width: 350, padding: 26, alignItems: 'center' }}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : !myLocation ? (
              <Press
                onPress={() => toTab('/throw')}
                accessibilityRole="button"
                style={{ width: 350, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: '#fff', padding: 20, gap: 4 }}>
                <T f={F.b7} s={14} c="#fff" center>
                  Set your location to see people nearby
                </T>
                <T s={12.5} c="rgba(255,255,255,.8)" center>
                  Open Throw and share your city →
                </T>
              </Press>
            ) : vis.length === 0 ? (
              <View style={{ width: 350, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: '#fff', padding: 26 }}>
                <T f={F.b6} s={13} c="#fff" center>
                  {all.length ? 'No one matches.' : 'No one nearby is sharing a location yet.'}
                </T>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </A>
      </Animated.View>
      </GestureDetector>

      {/* the tucked-away sheet's stand-in */}
      {!sheetOpen ? (
        <A style={[{ position: 'absolute', left: 16, bottom: 92 + 18 }, anim(skPop(), 0.4, 0, E.s14)]}>
          <Press
            onPress={openSheet}
            accessibilityRole="button"
            accessibilityLabel={`Show people (${vis.length})`}
            pressed={pushed(2, 1)}
            style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: Lm, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(3) }}>
            <Icon d={ICON.groups} size={24} color="#fff" sw={2} />
            {vis.length ? (
              <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: C.ink, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <T f={F.m7} s={10} c="#fff">
                  {vis.length}
                </T>
              </View>
            ) : null}
          </Press>
        </A>
      ) : null}
    </>
  );
}

export default function MapScreen() {
  return (
    <Screen bar={I} style={{ backgroundColor: C.mapBg }}>
      <ThrowProvider>
        <MapInner />
      </ThrowProvider>
      <TabBar active="map" />
    </Screen>
  );
}
