// Throw — write a short letter and throw it along the route to a friend.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useStore } from '@/state/store';
import { anim, E, loop, skBob, skCardBack, skPop, skPulse, skRingP, skShake, skThrowCard, skUp, skWiggle } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { MarchPath } from '@/ui/kit';
import { A, Icon, ICON, Plane, Press, Stage, T, useY } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';

const BROWN = '#2B231C';
const CLAY = '#C9714F';

// [first, initials, bg, route, distance, city]
const F_LIST: [string, string, string, string, string, string][] = [
  ['You', '+', '#fff', '', '', ''],
  ['Aarav', 'AK', C.coral, 'Pune → Koramangala', '523 mi', 'KORAMANGALA'],
  ['Priya', 'PS', C.lime, 'Pune → Bengaluru', '520 mi', 'BENGALURU'],
  ['Meera', 'MI', C.ice, 'Pune → Mumbai', '92 mi', 'MUMBAI'],
  ['Rohan', 'RD', C.lime, 'Pune → Delhi', '870 mi', 'DELHI'],
];

// Route curve: M10 110 C 80 10, 190 10, 260 60 (inside a 270×120 box at 60,150).
const P0 = [10, 110];
const P1 = [80, 10];
const P2 = [190, 10];
const P3 = [260, 60];

function FlyingPlane() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1100, easing: Easing.bezier(0.45, 0.05, 0.4, 1) });
  }, [t]);
  const st = useAnimatedStyle(() => {
    const u = t.value;
    const m = 1 - u;
    const x = m * m * m * P0[0] + 3 * m * m * u * P1[0] + 3 * m * u * u * P2[0] + u * u * u * P3[0];
    const y = m * m * m * P0[1] + 3 * m * m * u * P1[1] + 3 * m * u * u * P2[1] + u * u * u * P3[1];
    const dx = 3 * m * m * (P1[0] - P0[0]) + 6 * m * u * (P2[0] - P1[0]) + 3 * u * u * (P3[0] - P2[0]);
    const dy = 3 * m * m * (P1[1] - P0[1]) + 6 * m * u * (P2[1] - P1[1]) + 3 * u * u * (P3[1] - P2[1]);
    const a = (Math.atan2(dy, dx) * 180) / Math.PI;
    return {
      opacity: u < 0.9 ? 1 : 1 - (u - 0.9) / 0.1,
      transform: [{ translateX: x - 14 }, { translateY: y - 14 }, { rotate: `${a + 45}deg` }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, st]}>
      <Plane size={28} fill="#fff" wing={CLAY} stroke={C.deep} />
    </Animated.View>
  );
}

const glass = { backgroundColor: 'rgba(255,255,255,.78)', borderWidth: 1, borderColor: 'rgba(195,234,79,.45)' } as const;

export default function Throw() {
  const s = useStore();
  const y = useY();
  const sel = s.thSel;
  const f = F_LIST[sel];
  const [draft, setDraft] = useState('');
  const [phase, setPhase] = useState<'idle' | 'fly' | 'done'>('idle');
  // Card animation: entrance, fly away, shake (empty letter), or come back.
  const [card, setCard] = useState<{ a: 'enter' | 'fly' | 'shake' | 'back'; n: number }>({ a: 'enter', n: 0 });
  const play = (a: 'enter' | 'fly' | 'shake' | 'back') => setCard((c) => ({ a, n: c.n + 1 }));
  const [to, setTo] = useState(f[0]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const doThrow = () => {
    if (phase === 'fly') return;
    if (!draft.trim()) {
      play('shake');
      return;
    }
    timers.current.forEach(clearTimeout);
    setPhase('fly');
    play('fly');
    timers.current = [
      setTimeout(() => {
        setPhase('done');
        setDraft('');
        play('back');
        setTo(f[0]);
        s.set((x) => ({ thStreak: x.thStreak + 1 }));
      }, 1150),
      setTimeout(() => setPhase('idle'), 3600),
    ];
  };

  const cardAnim = {
    enter: anim(skUp(), 0.5, 0.3),
    fly: anim(skThrowCard(), 0.75, 0, E.throwCard),
    shake: anim(skShake(10), 0.4),
    back: anim(skCardBack(), 0.45, 0, E.out),
  }[card.a];

  return (
    <Screen bar={BROWN} style={{ backgroundColor: C.mapBg }}>
      <View
        pointerEvents="none"
        style={
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(180deg, rgba(185,217,154,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(185,217,154,.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          } as ViewStyle
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined} style={{ flex: 1 }}>
        <Stage>
          <View style={{ position: 'absolute', left: -60, top: y(240), width: 540, height: 14, backgroundColor: '#fff', opacity: 0.65, borderRadius: 7, transform: [{ rotate: '-14deg' }] }} />
          <View
            style={{
              position: 'absolute',
              left: 40,
              top: y(120),
              width: 140,
              height: 100,
              backgroundColor: C.park,
              opacity: 0.5,
              borderTopLeftRadius: 50,
              borderTopRightRadius: 70,
              borderBottomRightRadius: 40,
              borderBottomLeftRadius: 60,
            }}
          />
          <View style={{ position: 'absolute', left: 60, top: y(150), width: 270, height: 120 }} pointerEvents="none">
            <Svg width={270} height={120} viewBox="0 0 270 120">
              <MarchPath d="M10 110 C 80 10, 190 10, 260 60" stroke={CLAY} strokeWidth={2.4} strokeDasharray="2 7" strokeLinecap="round" fill="none" period={18} />
            </Svg>
            {phase === 'fly' ? <FlyingPlane /> : null}
          </View>
          <View style={{ position: 'absolute', left: 58, top: y(250), width: 16, height: 16, borderRadius: 8, backgroundColor: BROWN, borderWidth: 3, borderColor: '#fff' }} />
          <View style={{ position: 'absolute', left: 312, top: y(200), width: 16, height: 16 }}>
            <A style={[{ position: 'absolute', left: 0, top: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(201,113,79,.45)' }, anim(skPulse(), 1.8, 0, 'ease-out', 'infinite')]} />
            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: CLAY, borderWidth: 3, borderColor: '#fff' }} />
          </View>

          {/* top bar */}
          <A style={[{ position: 'absolute', left: 20, right: 20, top: y(56), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, anim(skUp(), 0.4)]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, ...glass }}>
              <Icon d={ICON.pin} size={14} color={BROWN} sw={2} />
              <T f={F.b6} s={13} c={BROWN}>
                {f[3]}
              </T>
              <T f={F.dm4} s={11} c="#A85A3C">
                {f[4]}
              </T>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', ...glass }}>
                <A style={loop(skWiggle(), 2.4, 1)}>
                  <Icon d={ICON.bell} size={18} color={BROWN} sw={1.8} />
                </A>
                <View style={{ position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' }}>
                  <T f={F.b8} s={10.5} c="#fff">
                    2
                  </T>
                </View>
              </View>
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', ...glass }}>
                <Icon d={ICON.sun} size={18} color={BROWN} sw={1.8} />
              </View>
            </View>
          </A>

          {phase === 'done' ? (
            <View style={{ position: 'absolute', left: 0, right: 0, top: y(112), alignItems: 'center', zIndex: 4 }}>
              <A
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: 'rgba(255,255,255,.92)',
                    borderWidth: 1,
                    borderColor: 'rgba(80,64,40,.1)',
                    borderRadius: 999,
                    boxShadow: '0 8px 18px rgba(80,64,42,.16)',
                    paddingVertical: 9,
                    paddingHorizontal: 16,
                  },
                  anim(skUp(), 0.35, 0, E.out),
                ]}>
                <Plane size={16} fill={CLAY} />
                <T f={F.b7} s={13.5} c={C.deep}>
                  Thrown to {to} · lands in ~2h
                </T>
              </A>
            </View>
          ) : null}

          {/* friend rail */}
          <View style={{ position: 'absolute', left: 0, right: 0, top: y(298), alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end', paddingHorizontal: 20 }}>
              {F_LIST.map((r, i) => {
                const on = i === sel;
                const w = on ? 72 : 54;
                const ring = on ? '#3D7BFF' : i === 1 || i === 2 ? '#34C759' : i === 0 ? 'rgba(80,64,40,.35)' : 'rgba(255,255,255,.9)';
                const bw = on ? 3 : i === 1 || i === 2 ? 2.5 : i === 0 ? 1.5 : 2;
                return (
                  <A key={r[0]} style={anim(skPop(), 0.4, 0.1 + i * 0.06, E.s14)}>
                    <Press
                      onPress={() => (i === 0 ? router.push('/friends') : s.set({ thSel: i }))}
                      accessibilityLabel={i === 0 ? 'Add a friend' : `Throw to ${r[0]}`}
                      style={{ alignItems: 'center', gap: 6, width: w }}>
                      <View style={{ width: w, height: w }}>
                        {on ? (
                          <A
                            style={[
                              { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: w / 2, borderWidth: 3, borderColor: '#3D7BFF' },
                              anim(skRingP(), 1.6, 0, 'ease-out', 'infinite'),
                            ]}
                          />
                        ) : null}
                        <View style={{ flex: 1, borderRadius: w / 2, borderWidth: bw, borderStyle: i === 0 ? 'dashed' : 'solid', borderColor: ring, padding: 3 }}>
                          <View style={{ flex: 1, borderRadius: w, backgroundColor: r[2], alignItems: 'center', justifyContent: 'center' }}>
                            <T f={F.b7} s={on ? 20 : 15} c={C.deep}>
                              {r[1]}
                            </T>
                          </View>
                        </View>
                      </View>
                      <T f={on ? F.b7 : F.b5} s={11.5} c={BROWN}>
                        {r[0]}
                      </T>
                    </Press>
                  </A>
                );
              })}
            </View>
          </View>

          {/* letter card */}
          <A key={`card-${card.n}`} style={[{ position: 'absolute', left: 20, right: 20, top: y(420), height: 230 }, cardAnim]}>
            <View
              style={{
                flex: 1,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(80,64,40,.08)',
                boxShadow: '0 8px 18px rgba(80,64,42,.16)',
                backgroundColor: '#FBF6EC',
                overflow: 'hidden',
                padding: 18,
              }}>
              <Image source={require('../../assets/brand/paper-texture.jpg')} contentFit="cover" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T f={F.dm4} s={10} ls={1} c="rgba(43,35,28,.5)">
                  TO {f[0].toUpperCase()} · {f[5]}
                </T>
                <T f={F.dm4} s={10} ls={1} c="rgba(43,35,28,.5)">
                  OCT 19
                </T>
              </View>
              <View style={{ flex: 1, marginTop: 8 }}>
                <View
                  pointerEvents="none"
                  style={
                    {
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 29px, rgba(80,64,40,.1) 29px)',
                      backgroundSize: '100% 30px',
                    } as ViewStyle
                  }
                />
                <TextInput
                  value={draft}
                  onChangeText={(v) => {
                    setDraft(v.slice(0, 280));
                  }}
                  placeholder="Write something for your loved one"
                  placeholderTextColor="rgba(43,35,28,.4)"
                  multiline
                  maxLength={280}
                  textAlignVertical="top"
                  style={{ flex: 1, fontFamily: F.cav5, fontSize: 22, lineHeight: 30, color: BROWN, padding: 0, outlineStyle: 'none' } as any}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <A style={loop(skBob(-10), 1.4)}>
                    <Svg width={14} height={14} viewBox="0 0 24 24">
                      <Path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill={CLAY} />
                    </Svg>
                  </A>
                  <T f={F.b7} s={12.5} c="#A85A3C">
                    {s.thStreak}-day streak with {f[0]}
                  </T>
                </View>
                <T f={F.dm4} s={10} c="rgba(43,35,28,.45)">
                  {draft.length ? `${draft.length} / 280` : ''}
                </T>
              </View>
            </View>
          </A>

          {/* tools + throw */}
          <A style={[{ position: 'absolute', left: 20, right: 20, top: y(670), flexDirection: 'row', alignItems: 'center', gap: 10 }, anim(skUp(), 0.45, 0.45)]}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                height: 56,
                borderRadius: 999,
                backgroundColor: 'rgba(61,123,255,.16)',
                borderWidth: 1,
                borderColor: 'rgba(61,123,255,.28)',
              }}>
              <Icon d={ICON.image} size={20} color={BROWN} sw={1.8} />
              <Icon d={ICON.mic} size={20} color={BROWN} sw={1.8} />
              <Icon d={ICON.clock} size={20} color={BROWN} sw={1.8} />
              <View>
                <Icon d={ICON.mail} size={20} color={BROWN} sw={1.8} />
                <View style={{ position: 'absolute', top: -8, right: -10, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: CLAY, alignItems: 'center', justifyContent: 'center' }}>
                  <T f={F.b7} s={10.5} c="#fff">
                    3
                  </T>
                </View>
              </View>
            </View>
            <Press
              onPress={doThrow}
              accessibilityRole="button"
              accessibilityLabel={`Throw letter to ${f[0]}`}
              pressed={{ transform: [{ scale: 0.97 }] }}
              style={
                {
                  height: 56,
                  paddingHorizontal: 24,
                  borderRadius: 999,
                  backgroundImage: 'linear-gradient(135deg, #D9885F, #C9714F)',
                  boxShadow: '0 8px 18px rgba(80,64,42,.18)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                } as ViewStyle
              }>
              <T f={F.b7} s={16} ls={1.2} c="#fff">
                {phase === 'fly' ? '…' : 'THROW'}
              </T>
            </Press>
          </A>
        </Stage>
      </KeyboardAvoidingView>
      <TabBar active="throw" delay={0.2} />
    </Screen>
  );
}
