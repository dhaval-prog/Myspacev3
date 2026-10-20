// 02 Welcome — camcorder clip "FRIENDS.MOV", ticker, slide-to-start knob.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';

import {
  anim,
  E,
  loop,
  skBlink,
  skCloud,
  skDot,
  skMarquee,
  skNudge,
  skPin,
  skPlane,
  skPop,
  skPulse,
  skScan,
  skStamp,
  skTwinkle,
  skUp,
} from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { A, Icon, ICON, Press, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

const TICKER = 'CHAT ✦ THROW LETTERS ✦ PLAY NPAT ✦ TRIVIA NIGHTS ✦ POCKET BUDGETS ✦ FIND FRIENDS ON THE MAP ✦';
const BUILDINGS: [number, string][] = [
  [70, C.tomato],
  [104, C.sun],
  [58, '#fff'],
  [122, C.cobalt],
  [84, C.bubblegum],
  [96, C.ink],
  [64, C.mint],
];
const REEL_CAP = ['', 'group chats', 'throw letters', 'find your people'];

const fill = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

function Bubble({ me, text, ini, avBg, delay }: { me?: boolean; text: string; ini: string; avBg: string; delay: number }) {
  const av = (
    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: avBg, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
      <T f={F.d8} s={11}>
        {ini}
      </T>
    </View>
  );
  return (
    <A
      style={[
        { flexDirection: 'row', alignItems: 'flex-end', gap: 7, justifyContent: me ? 'flex-end' : 'flex-start', transformOrigin: me ? '100% 100%' : '0% 100%' } as ViewStyle,
        anim(skPop(), 0.4, delay, E.s13),
      ]}>
      {!me && av}
      <View
        style={{
          backgroundColor: me ? C.cobalt : '#fff',
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 14,
          borderBottomLeftRadius: me ? 14 : 4,
          borderBottomRightRadius: me ? 4 : 14,
          paddingVertical: 6,
          paddingHorizontal: 11,
          boxShadow: '2px 2px 0 #111, 0 6px 10px rgba(0,0,0,.12)',
        }}>
        <T f={F.b7} s={13} c={me ? '#fff' : C.ink}>
          {text}
        </T>
      </View>
      {me && av}
    </A>
  );
}

function Reel1() {
  return (
    <View style={[fill, { backgroundImage: 'linear-gradient(180deg, #FFB98A 0%, #FF9DB0 55%, #B7A8FF 100%)' } as ViewStyle]}>
      <View
        style={
          {
            position: 'absolute',
            left: 148 - 120,
            top: 103 - 120,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundImage: 'radial-gradient(circle, rgba(255,244,210,.95) 0%, rgba(255,244,210,.95) 14%, rgba(255,220,160,.4) 38%, rgba(255,220,160,0) 70%)',
          } as ViewStyle
        }
      />
      <View style={{ position: 'absolute', left: 18, right: 18, top: 40, gap: 9 }}>
        <Bubble text="dinner at 8?" ini="PS" avBg={C.sun} delay={0.3} />
        <Bubble me text="i'm in!" ini="AK" avBg={C.bubblegum} delay={1.3} />
        <Bubble text="save me a seat" ini="RJ" avBg={C.mint} delay={2.3} />
        <A style={[{ flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 35, transformOrigin: '100% 100%' } as ViewStyle, anim(skPop(), 0.3, 3.2)]}>
          <View
            style={{
              flexDirection: 'row',
              gap: 4,
              backgroundColor: C.cobalt,
              borderWidth: 2,
              borderColor: C.ink,
              borderRadius: 14,
              borderBottomRightRadius: 4,
              paddingVertical: 9,
              paddingHorizontal: 12,
            }}>
            {[0, 0.15, 0.3].map((d) => (
              <A key={d} style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }, loop(skDot(), 0.9, d)]} />
            ))}
          </View>
        </A>
      </View>
    </View>
  );
}

function Reel2() {
  return (
    <View style={[fill, { overflow: 'hidden', backgroundImage: 'linear-gradient(180deg, #7FA0FF 0%, #B9C8FF 50%, #FFE2B8 100%)' } as ViewStyle]}>
      <View
        style={
          {
            position: 'absolute',
            right: 34,
            top: 26,
            width: 50,
            height: 50,
            borderRadius: 25,
            borderWidth: 2,
            borderColor: C.ink,
            backgroundImage: 'radial-gradient(circle at 38% 36%, #FFF6CF, #FFD23F 55%, #FFA91F)',
            boxShadow: '0 0 40px 16px rgba(255,214,90,.55)',
          } as ViewStyle
        }
      />
      <A style={[{ position: 'absolute', left: 0, top: 44 }, anim(skCloud(), 9, 0, 'linear', 'infinite')]}>
        <View style={{ width: 74, height: 24, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, boxShadow: 'inset 0 -5px 0 rgba(158,179,255,.5)' }} />
      </A>
      <A style={[{ position: 'absolute', left: 0, top: 90 }, anim(skCloud(), 12, -6, 'linear', 'infinite')]}>
        <View style={{ width: 54, height: 20, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, boxShadow: 'inset 0 -4px 0 rgba(158,179,255,.5)' }} />
      </A>
      <A style={[{ position: 'absolute', left: 0, top: 0, zIndex: 2 }, anim(skPlane(), 4.6, 0, 'linear', 'infinite')]}>
        <Svg width={42} height={42} viewBox="0 0 64 64">
          <Path d="M4 30 L60 8 L38 58 L30 36 Z" fill="#fff" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M30 36 L60 8 L22 40 Z" fill={C.sun} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
        </Svg>
      </A>
      <View style={{ position: 'absolute', left: -4, right: -4, bottom: -2, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
        {BUILDINGS.map(([h, bg], i) => (
          <View
            key={i}
            style={
              {
                flex: 1,
                height: h,
                backgroundColor: bg,
                borderWidth: 2,
                borderColor: C.ink,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                overflow: 'hidden',
              } as ViewStyle
            }>
            <View
              style={
                {
                  ...fill,
                  backgroundImage: 'radial-gradient(circle, rgba(255,240,190,.9) 2px, rgba(0,0,0,0) 2.6px)',
                  backgroundSize: '11px 14px',
                } as ViewStyle
              }
            />
            <View style={{ ...fill, backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0) 70%, rgba(0,0,0,.14))' } as ViewStyle} />
          </View>
        ))}
      </View>
    </View>
  );
}

const PINS = [
  { x: 150, y: 60, bg: C.sun, t: 'PS', d: 0.3 },
  { x: 60, y: 130, bg: C.tomato, t: 'AK', d: 1 },
  { x: 240, y: 150, bg: '#fff', t: 'RJ', d: 1.7 },
];

function Reel3() {
  return (
    <View style={[fill, { backgroundColor: '#EDE6D3', overflow: 'hidden' }]}>
      <Svg width="100%" height="100%" viewBox="0 0 296 228" preserveAspectRatio="xMidYMid slice" style={fill}>
        <Path d="M196 0 c-20 60 30 110 10 228" fill="none" stroke={C.ink} strokeWidth={26} />
        <Path d="M196 0 c-20 60 30 110 10 228" fill="none" stroke={C.sky} strokeWidth={21} />
        <Path d="M40 150 q30 -40 80 -30 q30 20 0 50 q-50 30 -80 -20z" fill={C.mint} stroke={C.ink} strokeWidth={2.5} />
        <Path d="M0 92 H296 M92 0 V228 M0 190 C100 170 200 200 296 160" fill="none" stroke={C.ink} strokeWidth={14} />
        <Path d="M0 92 H296 M92 0 V228 M0 190 C100 170 200 200 296 160" fill="none" stroke="#fff" strokeWidth={10} />
        <Path d="M0 92 H296 M92 0 V228" fill="none" stroke={C.sun} strokeWidth={1.5} strokeDasharray="6 6" />
      </Svg>
      {PINS.map((p) => (
        <View key={p.t} style={{ position: 'absolute', left: p.x, top: p.y, width: 0, height: 0 }}>
          <A
            style={[
              {
                position: 'absolute',
                left: -18,
                top: -6,
                width: 36,
                height: 14,
                borderRadius: 18,
                backgroundImage: `radial-gradient(ellipse, ${p.bg}, rgba(0,0,0,0) 70%)`,
              } as ViewStyle,
              anim(skPulse(), 1.8, p.d, 'ease-out', 'infinite'),
            ]}
          />
          <A style={[{ position: 'absolute', left: -17, top: -40 }, anim(skPin(), 0.7, p.d, E.out)]}>
            <View
              style={{
                width: 34,
                height: 34,
                borderTopLeftRadius: 17,
                borderTopRightRadius: 17,
                borderBottomRightRadius: 17,
                borderBottomLeftRadius: 0,
                transform: [{ rotate: '-45deg' }],
                backgroundColor: p.bg,
                borderWidth: 2,
                borderColor: C.ink,
                boxShadow: '2px 2px 0 #111, 0 6px 8px rgba(0,0,0,.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <T f={F.d8} s={11} style={{ transform: [{ rotate: '45deg' }] }}>
                {p.t}
              </T>
            </View>
          </A>
        </View>
      ))}
    </View>
  );
}

function Camcorder() {
  const [secs, setSecs] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s + 1) % 60), 1000);
    return () => clearInterval(t);
  }, []);
  const reel = (Math.floor(secs / 5) % 3) + 1;
  return (
    <A
      style={[
        {
          marginTop: 24,
          alignSelf: 'center',
          width: 322,
          backgroundImage: 'linear-gradient(165deg, #4a4d55 0%, #202226 45%, #141518 70%, #2c2e33 100%)',
          borderWidth: 3,
          borderColor: C.ink,
          borderRadius: 26,
          boxShadow: '7px 7px 0 #111, 0 26px 40px rgba(17,17,17,.28)',
          paddingTop: 11,
          paddingHorizontal: 11,
          paddingBottom: 10,
        } as ViewStyle,
        anim(skStamp(-2), 0.6, 0, E.out),
      ]}>
      {/* lens */}
      <View
        style={
          {
            position: 'absolute',
            right: -16,
            top: -20,
            width: 66,
            height: 66,
            borderRadius: 33,
            borderWidth: 3,
            borderColor: C.ink,
            boxShadow: '3px 3px 0 #111, 0 8px 14px rgba(0,0,0,.35)',
            backgroundImage:
              'radial-gradient(circle at 34% 30%, rgba(255,255,255,.9) 0%, rgba(255,255,255,.9) 7%, rgba(255,255,255,0) 9%), radial-gradient(circle at 62% 66%, rgba(158,179,255,.55) 0%, rgba(158,179,255,.55) 6%, rgba(158,179,255,0) 10%), radial-gradient(circle, #2B4BFF 0%, #2B4BFF 16%, #0a0c1c 34%, #1d1f24 56%, #5a5d66 60%, #1b1c20 68%)',
            zIndex: 3,
          } as ViewStyle
        }
      />
      <View style={{ height: 272, borderRadius: 15, overflow: 'hidden', backgroundColor: '#2a2b30', borderWidth: 2, borderColor: C.ink }}>
        {reel === 1 && <Reel1 />}
        {reel === 2 && <Reel2 />}
        {reel === 3 && <Reel3 />}
        {/* scanlines + vignette */}
        <View
          pointerEvents="none"
          style={{ ...fill, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,.13) 1px, rgba(0,0,0,0) 1px)', backgroundSize: '100% 3px' } as ViewStyle}
        />
        <View
          pointerEvents="none"
          style={{ ...fill, backgroundImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)' } as ViewStyle}
        />
        <A
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, right: 0, top: 0, height: 40, backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.08), rgba(255,255,255,0))' } as ViewStyle,
            anim(skScan(280), 3.2, 0, 'linear', 'infinite'),
          ]}
        />
        <Svg width={296} height={268} viewBox="0 0 296 268" style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
          <Path
            d="M14 34 V14 H34 M262 14 H282 V34 M282 234 V254 H262 M34 254 H14 V234"
            fill="none"
            stroke="#fff"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.85}
          />
        </Svg>
        <A pointerEvents="none" style={[{ position: 'absolute', left: 232, top: 26, width: 28, height: 28 }, loop(skTwinkle(), 1.8)]}>
          <Svg width={28} height={28} viewBox="232 26 28 28">
            <Path d="M246 26 q3 12 14 14 q-11 3 -14 14 q-3 -11 -14 -14 q11 -2 14 -14z" fill={C.sun} stroke={C.ink} strokeWidth={2} />
          </Svg>
        </A>
        <A pointerEvents="none" style={[{ position: 'absolute', left: 257, top: 62, width: 18, height: 18 }, loop(skTwinkle(), 1.8, 0.6)]}>
          <Svg width={18} height={18} viewBox="257 62 18 18">
            <Path d="M266 62 q2 8 9 9 q-7 2 -9 9 q-2 -7 -9 -9 q7 -1 9 -9z" fill="#fff" stroke={C.ink} strokeWidth={2} />
          </Svg>
        </A>
        <View pointerEvents="none" style={{ position: 'absolute', right: 22, bottom: 14, transform: [{ rotate: '-6deg' }], zIndex: 3 }}>
          <T f={F.cav7} s={26} c="#fff" style={{ textShadowColor: C.ink, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 }}>
            {REEL_CAP[reel]}
          </T>
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(17,17,17,.75)',
            borderRadius: 999,
            paddingVertical: 4,
            paddingHorizontal: 10,
          }}>
          <A style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.tomato }, anim(skBlink(), 1, 0, 'linear', 'infinite')]} />
          <T f={F.m7} s={10} c="#fff">
            REC 00:{String(secs).padStart(2, '0')}
          </T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.tomato, boxShadow: '0 0 8px #FF4F2E' }} />
          <T f={F.m7} s={11} c="#E9E4D6">
            FRIENDS.MOV
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T f={F.m4} s={11} c="rgba(233,228,214,.6)">
            0{reel} / 03
          </T>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: '#555a63' }} />
            ))}
          </View>
        </View>
      </View>
    </A>
  );
}

function Ticker() {
  const [w, setW] = useState(0);
  return (
    <View style={{ marginTop: 22, marginHorizontal: -22, borderTopWidth: 2, borderBottomWidth: 2, borderColor: C.ink, backgroundColor: C.ink, overflow: 'hidden' }}>
      <ScrollView horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false}>
      <A style={[{ flexDirection: 'row' }, w ? anim(skMarquee(w), 14, 0, 'linear', 'infinite') : null]}>
        {[0, 1, 2].map((k) => (
          <View key={k} onLayout={k === 0 ? (e) => setW(e.nativeEvent.layout.width) : undefined} style={{ paddingRight: 22, paddingVertical: 9 }}>
            <T f={F.m7} s={13} c={C.sun}>
              {TICKER}
            </T>
          </View>
        ))}
      </A>
      </ScrollView>
    </View>
  );
}

function SlideToStart() {
  const knob = useSharedValue(0);
  const start = useSharedValue(0);
  const max = useSharedValue(0);
  const done = useSharedValue(false);
  const [atRest, setAtRest] = useState(true);

  const go = () => router.replace('/signup');

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      start.value = knob.value;
      scheduleOnRN(setAtRest, false);
    })
    .onUpdate((e) => {
      knob.value = Math.max(0, Math.min(max.value, start.value + e.translationX));
    })
    .onFinalize(() => {
      if (knob.value > max.value * 0.82 && !done.value) {
        done.value = true;
        knob.value = withTiming(max.value, { duration: 150 }, () => scheduleOnRN(go));
      } else if (!done.value) {
        knob.value = withTiming(0, { duration: 350, easing: Easing.bezier(0.2, 0.9, 0.3, 1.3) }, () => scheduleOnRN(setAtRest, true));
      }
    });

  const knobSt = useAnimatedStyle(() => ({ transform: [{ translateX: knob.value }] }));
  const fillSt = useAnimatedStyle(() => ({ width: knob.value + 30 }));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Slide to make your space"
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={go}
        onLayout={(e) => {
          max.value = Math.max(0, e.nativeEvent.layout.width - 62);
        }}
        style={{ height: 66, borderRadius: 999, backgroundColor: C.ink, borderWidth: 2, borderColor: C.ink, overflow: 'hidden' }}>
        <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: C.cobalt }, fillSt]} />
        <View pointerEvents="none" style={{ ...fill, alignItems: 'center', justifyContent: 'center', paddingLeft: 40 }}>
          <T f={F.b7} s={16} c="#fff" ls={0.2}>
            Slide to make your space →
          </T>
        </View>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 5, left: 4 }, knobSt]}>
          <A
            style={[
              { width: 52, height: 52, borderRadius: 26, backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
              atRest ? loop(skNudge(), 1.4) : null,
            ]}>
            <Icon d={ICON.arrow} size={22} sw={2.6} />
          </A>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export default function Welcome() {
  const { top } = useStatusBar();
  return (
    <Screen style={{ paddingTop: top + 11, paddingHorizontal: 22, paddingBottom: 26, backgroundColor: C.paper }}>
      <View
        pointerEvents="none"
        style={{ ...fill, backgroundImage: 'radial-gradient(circle, rgba(17,17,17,.07) 1px, transparent 1px)', backgroundSize: '18px 18px' } as ViewStyle}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, borderRadius: 12, paddingVertical: 5, paddingHorizontal: 10, transform: [{ rotate: '-4deg' }] }}>
          <T f={F.d8} s={18}>
            myspace
          </T>
        </View>
        <Press
          onPress={() => router.push('/login')}
          accessibilityRole="button"
          style={{ borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: '#fff', ...hard(3) }}>
          <T f={F.b7} s={13.5}>
            Log in
          </T>
        </Press>
      </View>
      <Camcorder />
      <Ticker />
      <A style={[{ marginTop: 20 }, anim(skUp(), 0.5, 0.3)]}>
        <T f={F.d8} s={40} lh={40} ls={-1.6}>
          A little space
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <T f={F.d8} s={40} lh={40} ls={-1.6}>
            for{' '}
          </T>
          <View
            style={{
              backgroundColor: C.tomato,
              borderWidth: 2,
              borderColor: C.ink,
              borderRadius: 12,
              paddingHorizontal: 8,
              transform: [{ rotate: '-2deg' }],
            }}>
            <T f={F.d8} s={40} lh={44} ls={-1.6} c="#fff">
              your people.
            </T>
          </View>
        </View>
      </A>
      <View style={{ flex: 1 }} />
      <SlideToStart />
    </Screen>
  );
}
