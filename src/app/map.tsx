// 10 Map — pins drop in, filter + zoom, tap a pin or card, throw from the map.
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useStore } from '@/state/store';
import { anim, E, skBlink, skPin, skPop, skPulse, skSheet, skSlideIn, skUp } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { A, Icon, ICON, Plane, Press, pushed, Stage, T, useY } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';

const I = C.deep;
const Lm = C.lime;

type Person = {
  name: string;
  ini: string;
  bg: string;
  city: string;
  dist: string;
  ago: string;
  live: boolean;
  near: boolean;
  x: number;
  y: number;
  /** index into the Throw rail, -1 if not there */
  ri: number;
};

const P: Person[] = [
  { name: 'Priya Sharma', ini: 'PS', bg: C.lime, city: 'Indiranagar, Bengaluru', dist: '3.2 km', ago: 'LIVE', live: true, near: true, x: 450, y: 500, ri: 2 },
  { name: 'Aarav Kapoor', ini: 'AK', bg: C.coral, city: 'Koramangala, Bengaluru', dist: '5.8 km', ago: 'LIVE', live: true, near: true, x: 310, y: 480, ri: 1 },
  { name: 'Meera Iyer', ini: 'MI', bg: C.ice, city: 'Mumbai, India', dist: '842 km', ago: '2h ago', live: false, near: false, x: 280, y: 670, ri: 3 },
  { name: 'Rohan Das', ini: 'RD', bg: C.lime, city: 'Delhi, India', dist: '1,740 km', ago: 'LIVE', live: true, near: false, x: 500, y: 720, ri: 4 },
  { name: 'Ananya Rao', ini: 'AR', bg: C.coral, city: 'Hyderabad, India', dist: '560 km', ago: '1d ago', live: false, near: false, x: 520, y: 450, ri: -1 },
];

type Filter = 'all' | 'live' | 'near';

function Pin({ p, on, delay, onPress }: { p: Person; on: boolean; delay: number; onPress: () => void }) {
  const size = useSharedValue(on ? 56 : 42);
  useEffect(() => {
    size.value = withTiming(on ? 56 : 42, { duration: 300, easing: Easing.bezier(0.2, 0.8, 0.3, 1.4) });
  }, [on, size]);
  const sz = useAnimatedStyle(() => ({ width: size.value, height: size.value, borderRadius: size.value / 2, borderBottomLeftRadius: 4 }));
  // Anchor: bottom-centre of the pin + tag sits on (x, y).
  return (
    <View style={{ position: 'absolute', left: p.x - 60, top: p.y - 120, width: 120, height: 120, justifyContent: 'flex-end', alignItems: 'center', zIndex: on ? 3 : 1 }} pointerEvents="box-none">
      <A style={[{ alignItems: 'center', gap: 4 }, anim(skPin(), 0.6, delay, E.out)]}>
        <Press onPress={onPress} accessibilityLabel={p.name} style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View
            style={[
              {
                transform: [{ rotate: '-45deg' }],
                backgroundColor: '#fff',
                padding: 3,
                borderWidth: 2,
                borderColor: C.ink,
                boxShadow: on ? '4px 4px 0 #111' : '2px 2px 0 #111',
              } as ViewStyle,
              sz,
            ]}>
            <View style={{ flex: 1, borderRadius: 999, backgroundColor: p.bg, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' }}>
              <T f={F.b7} s={13}>
                {p.ini}
              </T>
            </View>
          </Animated.View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.ink, borderWidth: 2, borderColor: C.ink, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 }}>
            {p.live ? <A style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: Lm }, anim(skBlink(), 1.2, 0, 'linear', 'infinite')]} /> : null}
            <T f={F.m7} s={9.5} ls={0.6} c={p.live ? Lm : '#fff'}>
              {p.ago}
            </T>
          </View>
        </Press>
      </A>
    </View>
  );
}

export default function MapScreen() {
  const s = useStore();
  const y = useY();
  const [mf, setMf] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>('Priya Sharma');
  const [zoom, setZoom] = useState(1);
  const z = useSharedValue(1);
  useEffect(() => {
    z.value = withTiming(zoom, { duration: 450, easing: Easing.bezier(0.2, 0.8, 0.3, 1) });
  }, [zoom, z]);
  const mapSt = useAnimatedStyle(() => ({ transform: [{ scale: z.value }] }));

  const mq = q.trim().toLowerCase();
  const vis = P.filter(
    (p) => (mf === 'all' || (mf === 'live' && p.live) || (mf === 'near' && p.near)) && (!mq || p.name.toLowerCase().includes(mq) || p.city.toLowerCase().includes(mq)),
  );
  const chips: [Filter, string, number, boolean][] = [
    ['all', 'All', P.length, false],
    ['live', 'Live', P.filter((p) => p.live).length, true],
    ['near', 'Nearby', P.filter((p) => p.near).length, false],
  ];
  const throwTo = (p: Person) => {
    if (p.ri > 0) s.set({ thSel: p.ri });
    router.replace('/throw');
  };

  return (
    <Screen bar={I} style={{ backgroundColor: C.mapBg }}>
      <Stage>
        {/* map surface: 790×1244 canvas offset by -200, scaled around the user's dot */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -200,
              top: y(-200),
              width: 790,
              height: 1244,
              transformOrigin: '393px 601px',
              backgroundImage: 'linear-gradient(180deg, rgba(185,217,154,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(185,217,154,.35) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            } as ViewStyle,
            mapSt,
          ]}>
          <View style={{ position: 'absolute', left: 160, top: 500, width: 520, height: 14, backgroundColor: '#fff', opacity: 0.7, borderRadius: 7, transform: [{ rotate: '-18deg' }] }} />
          <View style={{ position: 'absolute', left: 350, top: 280, width: 12, height: 520, backgroundColor: '#fff', opacity: 0.6, borderRadius: 6, transform: [{ rotate: '12deg' }] }} />
          <View
            style={{
              position: 'absolute',
              left: 430,
              top: 360,
              width: 120,
              height: 90,
              backgroundColor: C.park,
              opacity: 0.55,
              borderTopLeftRadius: 40,
              borderTopRightRadius: 60,
              borderBottomRightRadius: 30,
              borderBottomLeftRadius: 50,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 220,
              top: 640,
              width: 90,
              height: 70,
              backgroundColor: C.park,
              opacity: 0.45,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 50,
              borderBottomRightRadius: 40,
              borderBottomLeftRadius: 30,
            }}
          />
          <View style={{ position: 'absolute', left: 382, top: 590, width: 22, height: 22 }}>
            <A style={[{ position: 'absolute', left: 0, top: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(47,107,255,.35)' }, anim(skPulse(), 2, 0, 'ease-out', 'infinite')]} />
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.locate, borderWidth: 4, borderColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.2)' }} />
          </View>
          {vis.map((p, k) => (
            <Pin key={p.name} p={p} on={p.name === sel} delay={0.15 + k * 0.08} onPress={() => setSel(p.name)} />
          ))}
        </Animated.View>
      </Stage>

      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: y(190), backgroundImage: 'linear-gradient(180deg, rgba(221,237,223,.95), rgba(221,237,223,0))' } as ViewStyle}
      />

      {/* search + filters */}
      <A style={[{ position: 'absolute', left: 16, right: 16, top: y(54) }, anim(skUp(), 0.4)]}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              height: 50,
              borderRadius: 999,
              backgroundColor: '#fff',
              borderWidth: 2,
              borderColor: C.ink,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 18,
              ...hard(3),
            }}>
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
          <Press
            onPress={() => setZoom((v) => Math.min(1.6, +(v + 0.2).toFixed(2)))}
            accessibilityLabel="Zoom in"
            pressed={{ backgroundColor: '#EDF2EA' }}
            style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <T f={F.b5} s={22}>
              +
            </T>
          </Press>
          <View style={{ height: 1, backgroundColor: 'rgba(22,33,12,.12)', marginHorizontal: 10 }} />
          <Press
            onPress={() => setZoom((v) => Math.max(0.7, +(v - 0.2).toFixed(2)))}
            accessibilityLabel="Zoom out"
            pressed={{ backgroundColor: '#EDF2EA' }}
            style={{ height: 46, alignItems: 'center', justifyContent: 'center' }}>
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
              {vis.length} friends · {vis.filter((p) => p.live).length} live
            </T>
            <View style={{ backgroundColor: C.ink, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 }}>
              <T f={F.m7} s={10} ls={1} c={C.sun}>
                NEAREST FIRST
              </T>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 5, paddingHorizontal: 20, paddingBottom: 8 }}>
            {vis.map((p, k) => {
              const on = p.name === sel;
              return (
                <A key={p.name} style={anim(skSlideIn(), 0.4, 0.3 + k * 0.06, E.out)}>
                  <Press
                    onPress={() => setSel(p.name)}
                    accessibilityLabel={p.name}
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
                      <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: C.ink, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
                        <T f={F.b7} s={13}>
                          {p.ini}
                        </T>
                      </View>
                      {p.live ? (
                        <View style={{ position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: Lm, borderWidth: 2, borderColor: C.ink }} />
                      ) : null}
                    </View>
                    <View>
                      <T f={F.b6} s={14} lines={1}>
                        {p.name}
                      </T>
                      <T s={12} c="rgba(22,33,12,.6)" lines={1}>
                        {p.city}
                      </T>
                    </View>
                    {on ? (
                      <A style={anim(skPop(), 0.3)}>
                        <Press
                          onPress={() => throwTo(p)}
                          accessibilityRole="button"
                          accessibilityLabel={`Throw a letter to ${p.name}`}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            borderRadius: 999,
                            backgroundColor: C.tomato,
                            borderWidth: 2,
                            borderColor: C.ink,
                            paddingVertical: 6,
                          }}>
                          <Plane size={12} fill="#fff" />
                          <T f={F.b8} s={12} c="#fff">
                            Throw a letter
                          </T>
                        </Press>
                      </A>
                    ) : (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <T f={F.m7} s={11}>
                          {p.dist}
                        </T>
                        <T f={F.m4} s={10} c={p.live ? '#4E6B1C' : 'rgba(22,33,12,.5)'}>
                          {p.ago}
                        </T>
                      </View>
                    )}
                  </Press>
                </A>
              );
            })}
            {vis.length === 0 ? (
              <View style={{ width: 350, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: C.ink, padding: 26 }}>
                <T f={F.b6} s={13} center>
                  No friends match.
                </T>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </A>
      <TabBar active="map" delay={0.2} />
    </Screen>
  );
}

