// 10 Map — friends' real shared locations (Throw profiles) plus people who share with everyone,
// drawn on the sticker map around you: direction is true bearing, distance is log-scaled so
// next-door and across-the-country friends both fit.
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { firstOf } from '@/state/store';
import { anim, E, skBlink, skPin, skPop, skPulse, skSheet, skSlideIn, skUp } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { Person } from '@/ui/Person';
import { A, Icon, ICON, Plane, Press, pushed, Stage, T, useY } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';
import { useFriends } from '@/v2/context/FriendsContext';
import { ThrowProvider, useThrow } from '@/v2/context/ThrowContext';
import { supabase } from '@/v2/lib/supabase';
import { distanceKm, formatDistanceKm, isLive, NEARBY_KM } from '@/v2/utils/friendsMapMath';
import { timeAgo } from '@/v2/utils/relativeTime';

const I = C.deep;
const Lm = C.lime;
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
  x: number;
  y: number;
};

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

function Pin({ c, on, delay, onPress }: { c: Contact; on: boolean; delay: number; onPress: () => void }) {
  const size = useSharedValue(on ? 56 : 42);
  useEffect(() => {
    size.value = withTiming(on ? 56 : 42, { duration: 300, easing: Easing.bezier(0.2, 0.8, 0.3, 1.4) });
  }, [on, size]);
  const sz = useAnimatedStyle(() => ({ width: size.value, height: size.value, borderRadius: size.value / 2, borderBottomLeftRadius: 4 }));
  return (
    <View style={{ position: 'absolute', left: c.x - 60, top: c.y - 120, width: 120, height: 120, justifyContent: 'flex-end', alignItems: 'center', zIndex: on ? 3 : 1 }} pointerEvents="box-none">
      <A style={[{ alignItems: 'center', gap: 4 }, anim(skPin(), 0.6, delay, E.out)]}>
        <Press onPress={onPress} accessibilityLabel={c.name} style={{ alignItems: 'center', gap: 4 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.ink, borderWidth: 2, borderColor: C.ink, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 }}>
            {c.live ? <A style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: Lm }, anim(skBlink(), 1.2, 0, 'linear', 'infinite')]} /> : null}
            <T f={F.m7} s={9.5} ls={0.6} c={c.live ? Lm : '#fff'}>
              {c.ago}
            </T>
          </View>
        </Press>
      </A>
    </View>
  );
}

function MapInner() {
  const y = useY();
  const { myLocation, friends: throwFriends, loading } = useThrow();
  const { friends, openChat, sendRequestToUser } = useFriends();
  const [extra, setExtra] = useState<MapRow[]>([]);
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

  // People outside my friends who share their location with everyone.
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
        ...place(km, bearing),
      };
    };
    return [
      ...throwFriends
        .filter((f) => f.location)
        .map((f) => mk(f.userId, f.name, f.avatarUrl, f.location!.latitude, f.location!.longitude, `${f.location!.city}, ${f.location!.country}`, f.location!.updatedAt, true)),
      ...extra.map((r) => mk(r.user_id, r.full_name?.trim() || 'Someone', r.avatar_url, r.latitude, r.longitude, `${r.city}, ${r.country}`, r.updated_at, false)),
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
              <A style={[{ position: 'absolute', left: 0, top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(47,107,255,.35)' }, anim(skPulse(), 2, 0, 'ease-out', 'infinite')]} />
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.locate, borderWidth: 4, borderColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />
            </View>
          ) : null}
          {vis.map((c, k) => (
            <Pin key={c.userId} c={c} on={c.userId === selected} delay={0.15 + k * 0.08} onPress={() => setSel(c.userId)} />
          ))}
        </Animated.View>
      </Stage>

      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: y(190), backgroundImage: 'linear-gradient(180deg, rgba(221,237,223,.95), rgba(221,237,223,0))' } as ViewStyle} />

      {/* search + filters */}
      <A style={[{ position: 'absolute', left: 16, right: 16, top: y(54) }, anim(skUp(), 0.4)]}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, height: 50, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, ...hard(3) }}>
            <Icon d={ICON.search} size={17} color="rgba(22,33,12,.6)" sw={2} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search friends or places"
              placeholderTextColor="rgba(17,17,17,.35)"
              autoCorrect={false}
              accessibilityLabel="Search friends or places"
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
                  <T f={F.dm4} s={11} c={on ? Lm : 'rgba(22,33,12,.5)'}>
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
          <Press onPress={() => setZoom((v) => Math.min(1.6, +(v + 0.2).toFixed(2)))} accessibilityLabel="Zoom in" pressed={{ backgroundColor: '#EDF2EA' }} style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <T f={F.b5} s={22}>
              +
            </T>
          </Press>
          <View style={{ height: 1, backgroundColor: 'rgba(22,33,12,.12)', marginHorizontal: 10 }} />
          <Press onPress={() => setZoom((v) => Math.max(0.7, +(v - 0.2).toFixed(2)))} accessibilityLabel="Zoom out" pressed={{ backgroundColor: '#EDF2EA' }} style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <T f={F.b5} s={22}>
              −
            </T>
          </Press>
        </View>
        <Press
          onPress={() => {
            setZoom(1);
            setSel(null);
          }}
          accessibilityLabel="Recenter"
          pressed={pushed(2, 1, I)}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(3) }}>
          <Icon d={ICON.locate} size={18} color={C.cobalt} sw={2.4} />
        </Press>
      </A>

      {/* glass sheet */}
      <A
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 92,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            borderWidth: 1.5,
            borderBottomWidth: 0,
            borderColor: 'rgba(255,255,255,.75)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), 0 -10px 30px rgba(22,33,12,.12)',
            overflow: 'hidden',
          } as ViewStyle,
          anim(skSheet(260), 0.5, 0.2, E.sheet),
        ]}>
        <BlurView intensity={40} tint="light" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,.42)' }} />
        <View style={{ paddingTop: 10, paddingBottom: 14 }}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: C.ink, alignSelf: 'center', marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 }}>
            <T f={F.d8} s={20} ls={-0.5}>
              {vis.length} {vis.length === 1 ? 'friend' : 'friends'} · {vis.filter((p) => p.live).length} live
            </T>
            <View style={{ backgroundColor: C.ink, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 }}>
              <T f={F.m7} s={10} ls={1} c={C.sun}>
                NEAREST FIRST
              </T>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 5, paddingHorizontal: 20, paddingBottom: 8 }}>
            {vis.map((c, k) => {
              const on = c.userId === selected;
              const st = addState[c.userId];
              return (
                <A key={c.userId} style={anim(skSlideIn(), 0.4, 0.3 + k * 0.06, E.out)}>
                  <Press
                    onPress={() => setSel(c.userId)}
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
                      <T s={12} c="rgba(22,33,12,.6)" lines={1}>
                        {c.city}
                      </T>
                    </View>
                    {on ? (
                      <A style={[{ gap: 6 }, anim(skPop(), 0.3)]}>
                        {c.isFriend ? (
                          <>
                            <Press
                              onPress={() => router.replace({ pathname: '/throw', params: { focus: c.userId } })}
                              accessibilityRole="button"
                              accessibilityLabel={`Throw a letter to ${c.name}`}
                              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 999, backgroundColor: C.tomato, borderWidth: 2, borderColor: C.ink, paddingVertical: 6 }}>
                              <Plane size={12} fill="#fff" />
                              <T f={F.b8} s={12} c="#fff">
                                Throw a letter
                              </T>
                            </Press>
                            {c.connectionId ? (
                              <Press
                                onPress={() => {
                                  openChat(c.connectionId!);
                                  router.push('/thread');
                                }}
                                accessibilityRole="button"
                                style={{ alignItems: 'center', borderRadius: 999, borderWidth: 2, borderColor: C.ink, paddingVertical: 5 }}>
                                <T f={F.b7} s={12}>
                                  Chat with {firstOf(c.name)}
                                </T>
                              </Press>
                            ) : null}
                          </>
                        ) : (
                          <Press
                            onPress={() => !st && addFriend(c)}
                            accessibilityRole="button"
                            style={{ alignItems: 'center', borderRadius: 999, backgroundColor: st === 'sent' ? '#fff' : Lm, borderWidth: 2, borderColor: C.ink, paddingVertical: 6 }}>
                            <T f={F.b8} s={12}>
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
                <ActivityIndicator color={I} />
              </View>
            ) : !myLocation ? (
              <Press
                onPress={() => router.replace('/throw')}
                accessibilityRole="button"
                style={{ width: 350, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: C.ink, padding: 20, gap: 4 }}>
                <T f={F.b7} s={14} center>
                  Set your location to see friends nearby
                </T>
                <T s={12.5} c="rgba(22,33,12,.6)" center>
                  Open Throw and share your city →
                </T>
              </Press>
            ) : vis.length === 0 ? (
              <View style={{ width: 350, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: C.ink, padding: 26 }}>
                <T f={F.b6} s={13} center>
                  {all.length ? 'No friends match.' : 'No friends are sharing a location yet.'}
                </T>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </A>
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
