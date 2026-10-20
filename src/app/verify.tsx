// 06 Check mail — kraft envelope, wax-seal flap opens, letter rises, hearts float.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { firstOf, useStore } from '@/state/store';
import { anim, E, skFlap, skFloat, skLetter } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { DrawPath, Stripes } from '@/ui/kit';
import { A, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

const fill = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;
const HEART = 'M12 20 C-6 8 4 -4 12 5 C20 -4 30 8 12 20z';

function Heart({ w, h, color, pos, delay }: { w: number; h: number; color: string; pos: ViewStyle; delay: number }) {
  return (
    <A pointerEvents="none" style={[{ position: 'absolute', zIndex: 5, ...pos }, anim(skFloat(), 2.4, delay, 'ease-out', 'infinite')]}>
      <Svg width={w} height={h} viewBox="0 0 24 22">
        <Path d={HEART} fill={color} stroke={C.ink} strokeWidth={2} />
      </Svg>
    </A>
  );
}

export default function Verify() {
  const s = useStore();
  const { top } = useStatusBar();
  // The flap swings over the letter for the first half of its turn, then tucks behind it.
  const [flapBehind, setFlapBehind] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFlapBehind(true), 700);
    return () => clearTimeout(t);
  }, []);
  const name = (s.name || 'Friend').trim();

  return (
    <Screen style={{ backgroundColor: C.tomato, paddingTop: top + 11, paddingHorizontal: 22, paddingBottom: 24, alignItems: 'center' }}>
      <View
        pointerEvents="none"
        style={{ ...fill, backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255,220,180,.55), rgba(255,79,46,0) 55%)' } as ViewStyle}
      />
      <View
        pointerEvents="none"
        style={{ ...fill, backgroundImage: 'radial-gradient(circle, rgba(17,17,17,.08) 1px, transparent 1px)', backgroundSize: '18px 18px' } as ViewStyle}
      />

      <View style={{ marginTop: 96, width: 256, height: 196 }}>
        <View
          style={
            {
              position: 'absolute',
              left: 6,
              right: 6,
              bottom: -22,
              height: 24,
              borderRadius: 122,
              backgroundImage: 'radial-gradient(ellipse, rgba(90,10,0,.45), rgba(90,10,0,0) 70%)',
            } as ViewStyle
          }
        />
        <Svg width={300} height={120} viewBox="0 0 300 120" style={{ position: 'absolute', left: -22, top: 60 }}>
          <DrawPath
            d="M14 30 l-12 -8 M10 56 h-14 M14 82 l-12 8 M286 30 l12 -8 M290 56 h14 M286 82 l12 8"
            fill="none"
            stroke={C.ink}
            strokeWidth={3.5}
            strokeLinecap="round"
            len={20}
            dur={1.6}
            delay={1.4}
          />
        </Svg>

        {/* letter */}
        <A
          style={[
            {
              position: 'absolute',
              left: 22,
              right: 22,
              top: 30,
              height: 142,
              zIndex: 2,
              backgroundImage: 'linear-gradient(180deg, #fff, #f6f1e6)',
              borderWidth: 2,
              borderColor: C.ink,
              borderRadius: 8,
              boxShadow: '0 4px 10px rgba(0,0,0,.15)',
              paddingVertical: 12,
              paddingHorizontal: 14,
              overflow: 'hidden',
            } as ViewStyle,
            anim(skLetter(), 0.9, 1, E.out),
          ]}>
          <View
            pointerEvents="none"
            style={{ ...fill, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 17px, rgba(43,75,255,.18) 17px)', backgroundSize: '100% 18px' } as ViewStyle}
          />
          <T f={F.m7} s={10}>
            MYSPACE · CONFIRM
          </T>
          <T f={F.cav7} s={24} lh={26} style={{ marginTop: 2 }}>
            hi {firstOf(s.name)}!
          </T>
          <View style={{ marginTop: 6, width: 96, height: 22, borderRadius: 6, backgroundColor: C.cobalt, borderWidth: 2, borderColor: C.ink, ...hard(2) }} />
        </A>

        {/* envelope body */}
        <View
          style={
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 50,
              bottom: 0,
              zIndex: 3,
              backgroundImage: 'linear-gradient(160deg, #F2D9AE, #DDB47E 60%, #CC9F66)',
              borderWidth: 3,
              borderColor: C.ink,
              borderRadius: 12,
              boxShadow: '6px 6px 0 #111, 0 18px 26px rgba(90,10,0,.3)',
              overflow: 'hidden',
            } as ViewStyle
          }>
          <Stripes angle={115} color="rgba(120,80,30,.07)" width={2} gap={5} />
          <Stripes angle={25} color="rgba(255,255,255,.08)" width={1} gap={8} />
          <Svg width={256} height={146} viewBox="0 0 256 146" style={{ position: 'absolute', left: -3, top: -3 }}>
            <Path d="M2 144 L110 70 M254 144 L146 70" fill="none" stroke="rgba(90,50,10,.35)" strokeWidth={2} />
          </Svg>
          <View style={{ position: 'absolute', left: 18, bottom: 16 }}>
            <T f={F.cav7} s={21} lh={20} c="#2a2219">
              {name}
            </T>
            <T f={F.cav7} s={16} lh={20} c="#2a2219" style={{ opacity: 0.75 }}>
              {s.email || 'your email'}
            </T>
          </View>
          {/* postage stamp */}
          <View
            style={{
              position: 'absolute',
              right: 14,
              bottom: 12,
              width: 46,
              height: 54,
              backgroundColor: '#fff',
              padding: 5,
              borderWidth: 2,
              borderStyle: 'dotted',
              borderColor: '#E3C08B',
              boxShadow: '0 2px 4px rgba(0,0,0,.2)',
              transform: [{ rotate: '4deg' }],
            }}>
            <View style={{ flex: 1, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink }} />
            </View>
          </View>
          <Svg width={70} height={40} viewBox="0 0 70 40" style={{ position: 'absolute', right: 34, bottom: 30, opacity: 0.55 }}>
            <Circle cx={48} cy={20} r={15} fill="none" stroke={C.ink} strokeWidth={2} />
            <Path d="M2 12 q8 -5 16 0 t16 0 t16 0 M2 20 q8 -5 16 0 t16 0 t16 0 M2 28 q8 -5 16 0 t16 0 t16 0" fill="none" stroke={C.ink} strokeWidth={2} />
          </Svg>
        </View>

        {/* flap */}
        <A
          style={[
            { position: 'absolute', left: 0, right: 0, top: 50, height: 92, zIndex: flapBehind ? 1 : 4, transformOrigin: '50% 0%' } as ViewStyle,
            anim(skFlap(), 0.6, 0.4, 'ease-in'),
          ]}>
          <Svg width={256} height={92} viewBox="0 0 256 92" style={{ overflow: 'visible' }}>
            <Defs>
              <LinearGradient id="skKraft" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#E9C893" />
                <Stop offset="1" stopColor="#F6E1BA" />
              </LinearGradient>
            </Defs>
            <Path d="M3 3 L128 88 L253 3 Z" fill="url(#skKraft)" stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
          </Svg>
          <View
            style={
              {
                position: 'absolute',
                left: 106,
                top: 62,
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 2,
                borderColor: C.ink,
                backgroundImage: 'radial-gradient(circle at 35% 30%, #7d92ff, #2B4BFF 45%, #1a2fb0)',
                boxShadow: '0 3px 6px rgba(0,0,0,.4), inset 0 0 0 5px rgba(0,0,0,.12)',
                alignItems: 'center',
                justifyContent: 'center',
              } as ViewStyle
            }>
            <T f={F.d8} s={20} c="rgba(255,255,255,.85)" style={{ textShadowColor: 'rgba(0,0,0,.45)', textShadowOffset: { width: 0, height: -1 }, textShadowRadius: 0 }}>
              m
            </T>
          </View>
        </A>

        <Heart w={22} h={20} color={C.bubblegum} pos={{ left: 40, top: 0 }} delay={1.8} />
        <Heart w={18} h={16} color={C.sun} pos={{ left: 128, top: -14 }} delay={2.4} />
        <Heart w={24} h={22} color="#fff" pos={{ right: 36, top: 4 }} delay={3} />
      </View>

      <View style={{ marginTop: 44 }}>
        <T f={F.d8} s={44} lh={42} ls={-1.8} c="#fff" center>
          {'You’ve got\nmail!'}
        </T>
      </View>
      <View style={{ flex: 1 }} />
      <Press
        onPress={() => router.replace('/success')}
        accessibilityRole="button"
        pressed={pushed(4, 1)}
        style={{ alignSelf: 'stretch', borderRadius: 20, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, paddingVertical: 18, alignItems: 'center', ...hard(5) }}>
        <T f={F.d8} s={20}>
          Open my inbox
        </T>
      </Press>
      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        <T f={F.b7} s={14}>
          Nothing yet?{' '}
        </T>
        <T f={F.b7} s={14} style={{ textDecorationLine: 'underline' }}>
          Send again
        </T>
      </View>
    </Screen>
  );
}

