// 01 Splash — logo stamps in; tap the stickers to peel them and learn what the app does.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { anim, E, loop, skJig, skPeelOff, skPopR, skSlap, skSpin, skTwinkle, skUp } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { OutlinedText, Sheen, STAR4 } from '@/ui/kit';
import { A, Icon, ICON, Press, pushed, Stage, T, useY } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

type StickerKey = 'plane' | 'chat' | 'friends' | 'pin' | 'heart' | 'pocket' | 'music';

// [icon, bg, x, y, rotation, size, delay, caption]
const STICKERS: [StickerKey, string, number, number, number, number, number, string][] = [
  ['plane', C.sun, 30, 118, -12, 80, 1.4, 'Throw letters to friends'],
  ['chat', '#fff', 282, 128, 10, 78, 1.5, 'Group chats that feel alive'],
  ['friends', C.mint, 12, 300, 8, 84, 1.6, 'Find your people'],
  ['pin', C.tomato, 298, 302, -8, 72, 1.7, "See who's nearby"],
  ['heart', C.bubblegum, 40, 552, -10, 70, 1.8, 'Send love, not likes'],
  ['pocket', C.sky, 157, 566, 6, 76, 1.9, 'Keep stuff in your pocket'],
  ['music', '#fff', 278, 550, 12, 70, 2, 'Put a song on your space'],
];

function StickerIcon({ k, size }: { k: StickerKey; size: number }) {
  const p = { stroke: C.ink, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {k === 'plane' && (
        <>
          <Path d="M3 11 L21 3 L14 21 L11 13 Z" fill="#fff" {...p} />
          <Path d="M11 13 L21 3" {...p} />
        </>
      )}
      {k === 'chat' && (
        <>
          <Path d="M4 5h16v11H10l-5 4v-4H4z" fill={C.tomato} {...p} />
          <Path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" {...p} stroke="#fff" strokeWidth={3} />
        </>
      )}
      {k === 'pin' && (
        <>
          <Path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" fill="#fff" {...p} />
          <Circle cx={12} cy={9} r={2.6} fill={C.sun} {...p} />
        </>
      )}
      {k === 'friends' && (
        <>
          <Circle cx={8.5} cy={8} r={3.2} fill="#fff" {...p} />
          <Circle cx={16} cy={9} r={2.8} fill={C.sun} {...p} />
          <Path d="M2.5 20c0-3.8 2.7-6 6-6s6 2.2 6 6" fill="#fff" {...p} />
          <Path d="M14.5 14.6c.5-.2 1-.3 1.5-.3 3 0 5.5 2 5.5 5.7" {...p} />
        </>
      )}
      {k === 'pocket' && (
        <>
          <Rect x={3} y={6} width={18} height={13} rx={3} fill={C.sun} {...p} />
          <Path d="M3 10h18" {...p} />
          <Circle cx={16.5} cy={14.5} r={1.4} fill={C.ink} {...p} />
        </>
      )}
      {k === 'heart' && <Path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20z" fill={C.tomato} {...p} />}
      {k === 'music' && (
        <>
          <Path d="M9 18V5l11-2v13" {...p} />
          <Circle cx={6.5} cy={18} r={2.8} fill="#fff" {...p} />
          <Circle cx={17.5} cy={16} r={2.8} fill="#fff" {...p} />
        </>
      )}
    </Svg>
  );
}

const LETTERS = 'myspace'.split('');
const LETTER_R = [-6, 4, -3, 5, -4, 3, -5];
const SPARKS: [number, number, number, number][] = [
  [-18, -14, 26, 0],
  [150, -20, 20, 0.4],
  [164, 120, 24, 0.8],
  [-24, 128, 18, 1.2],
];

export default function Splash() {
  const y = useY();
  const [peeled, setPeeled] = useState<Record<number, boolean>>({});
  const [slap, setSlap] = useState<Record<number, number>>({});
  const [cap, setCap] = useState<string | null>(null);
  const [capN, setCapN] = useState(0);
  const [logoN, setLogoN] = useState(0);
  const auto = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    auto.current = setTimeout(() => router.replace('/welcome'), 9000);
    const ts = timers.current;
    return () => {
      if (auto.current) clearTimeout(auto.current);
      ts.forEach(clearTimeout);
    };
  }, []);
  const stopAuto = () => auto.current && clearTimeout(auto.current);

  const tapSticker = (i: number) => {
    if (peeled[i]) return;
    stopAuto();
    setPeeled((p) => ({ ...p, [i]: true }));
    setCap(STICKERS[i][7]);
    setCapN((n) => n + 1);
    timers.current.push(
      setTimeout(() => {
        setPeeled((p) => ({ ...p, [i]: false }));
        setSlap((s) => ({ ...s, [i]: (s[i] || 0) + 1 }));
      }, 900),
    );
  };
  const tapLogo = () => {
    stopAuto();
    setLogoN((n) => n + 1);
    setCap('hey, that tickles!');
    setCapN((n) => n + 1);
  };
  const capR = capN % 2 ? 2 : -2;

  return (
    <Screen bar="#fff" style={{ backgroundColor: C.cobalt }}>
      {/* glow + dot grid */}
      <View
        style={
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 50% ${Math.round((y(330) / 844) * 100)}%, rgba(158,179,255,.6), rgba(43,75,255,0) 55%)`,
          } as ViewStyle
        }
      />
      <View
        style={
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.1) 1.2px, transparent 1.2px)',
            backgroundSize: '16px 16px',
          } as ViewStyle
        }
      />
      {/* 390-wide stage, centred on wider screens */}
      <Stage>
        <A
          style={[
            { position: 'absolute', left: -15, top: y(330) - 210, width: 420, height: 420, borderRadius: 210, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.22)' },
            anim(skSpin(1), 40, 0, 'linear', 'infinite'),
          ]}
        />
        <A
          style={[
            { position: 'absolute', left: 45, top: y(330) - 150, width: 300, height: 300, borderRadius: 150, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,.18)' },
            anim(skSpin(-1), 30, 0, 'linear', 'infinite'),
          ]}
        />

        {/* logo */}
        <A
          key={'logo' + logoN}
          style={[
            { position: 'absolute', left: 115, top: y(180), width: 160, height: 160 },
            logoN ? anim(skJig(), 0.55, 0, 'ease-in-out') : anim(skPopR(0), 0.7, 0.15, E.s14),
          ]}>
          <Press onPress={tapLogo} accessibilityLabel="Myspace logo">
            <View
              style={
                {
                  width: 160,
                  height: 160,
                  borderRadius: 40,
                  borderWidth: 4,
                  borderColor: C.ink,
                  backgroundImage: 'radial-gradient(circle at 30% 22%, #FFF0A8, #FFD23F 50%, #F2B90F)',
                  boxShadow: '0 0 0 8px #fff, 0 0 0 11px #111, 9px 11px 0 11px #111, 0 30px 44px rgba(0,0,40,.4)',
                  transform: [{ rotate: '-6deg' }],
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                } as ViewStyle
              }>
              <Svg width={112} height={112} viewBox="0 0 512 512" fill="none">
                <Path d="M150 230 L256 146 L362 230" stroke={C.ink} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" />
                <Path
                  d="M190 372 V308 a33 33 0 0 1 66 0 V372 M256 308 a33 33 0 0 1 66 0 V372"
                  stroke={C.ink}
                  strokeWidth={52}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Sheen w={64} h={256} top={-48} dur={3.2} delay={1} alpha={0.65} />
            </View>
          </Press>
          {SPARKS.map(([sx, sy, s, d], i) => (
            <A key={i} pointerEvents="none" style={[{ position: 'absolute', left: sx, top: sy, width: s, height: s }, loop(skTwinkle(), 1.6, d)]}>
              <Svg width={s} height={s} viewBox="0 0 24 24">
                <Path d={STAR4} fill="#fff" stroke={C.ink} strokeWidth={1.8} strokeLinejoin="round" />
              </Svg>
            </A>
          ))}
        </A>

        {/* wordmark */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: y(384), flexDirection: 'row', justifyContent: 'center', gap: 1 }}>
          {LETTERS.map((ch, i) => (
            <A key={i} style={anim(skPopR(LETTER_R[i]), 0.45, 0.55 + i * 0.07, E.s14)}>
              <OutlinedText
                color={i < 2 ? C.sun : '#fff'}
                style={{ fontFamily: F.d8, fontSize: 66, lineHeight: 70, letterSpacing: -2 }}
                sw={1.4}
                shadow={4}>
                {ch}
              </OutlinedText>
            </A>
          ))}
        </View>
        <A style={[{ position: 'absolute', left: 0, right: 0, top: y(462) }, anim(skUp(), 0.5, 1.3)]}>
          <T
            f={F.cav7}
            s={27}
            c="#fff"
            center
            style={{ textShadowColor: C.ink, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 }}>
            your space. your people.
          </T>
        </A>

        {/* stickers */}
        {STICKERS.map(([k, bg, x, sy, r, s, d], i) => {
          const pe = !!peeled[i];
          const m = slap[i] || 0;
          return (
            <A
              key={`${i}-${pe}-${m}`}
              style={[
                { position: 'absolute', left: x, top: y(sy), width: s, height: s },
                pe ? anim(skPeelOff(r), 0.55, 0, 'ease-in') : anim(skSlap(r), 0.45, m ? 0 : d, E.s12),
              ]}>
              <Press
                onPress={() => tapSticker(i)}
                accessibilityLabel={STICKERS[i][7]}
                style={
                  {
                    width: s,
                    height: s,
                    borderRadius: 26,
                    backgroundColor: bg,
                    borderWidth: 3,
                    borderColor: C.ink,
                    boxShadow: '0 0 0 5px #fff, 0 0 0 7px #111, 5px 6px 0 7px #111, 0 16px 22px rgba(0,0,40,.35)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  } as ViewStyle
                }>
                <StickerIcon k={k} size={s * 0.56} />
                <View
                  pointerEvents="none"
                  style={
                    {
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.55), rgba(255,255,255,0) 45%)',
                    } as ViewStyle
                  }
                />
              </Press>
            </A>
          );
        })}

        {/* caption bubble */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: y(668), alignItems: 'center' }}>
          <A
            key={'cap' + capN}
            style={[
              {
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: C.ink,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                borderBottomRightRadius: 18,
                borderBottomLeftRadius: 4,
                paddingVertical: 7,
                paddingHorizontal: 14,
                ...hard(3),
              },
              capN ? anim(skSlap(capR), 0.4, 0, E.s12) : anim(skUp(), 0.5, 2.2),
            ]}>
            <T f={F.b7} s={15}>
              {cap || 'tap a sticker ✦'}
            </T>
          </A>
        </View>
      </Stage>

      <A style={[{ position: 'absolute', left: 40, right: 40, bottom: 44 }, anim(skUp(), 0.5, 2)]}>
        <Press
          accessibilityRole="button"
          onPress={() => router.replace('/welcome')}
          pressed={pushed(4, 1)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderRadius: 20,
            backgroundColor: C.sun,
            borderWidth: 2,
            borderColor: C.ink,
            paddingVertical: 16,
            ...hard(5),
          }}>
          <T f={F.d8} s={19}>
            Step inside
          </T>
          <Icon d={ICON.arrow} size={18} sw={3} />
        </Press>
      </A>
    </Screen>
  );
}
