// Realistic letter effects (v3): a layered flickering flame, a live mic ring driven by voice
// loudness, weather that sits on the paper (water beads, snow, sunlight) and the crumpled-paper
// ball that bounces away. Kept apart from letterFx.tsx, which holds the lighter sticker effects.
import React, { useEffect, useId, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

import { anim, kf, loop } from '@/theme/anim';

const A = Animated.View;
const INK = '#16210C';
const TOMATO = '#FF4F2E';

/** SVG gradient ids must be plain identifiers (React's useId adds colons/guillemets). */
function useSvgId(prefix: string) {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

// ---------------------------------------------------------------------------------------------
// Flame

const flameKf = (name: string, steps: [number, number, number, number][]) =>
  kf(name, () =>
    Object.fromEntries(
      steps.map(([pct, sx, sy, skew]) => [`${pct}%`, { transform: [{ skewX: `${skew}deg` }, { scaleX: sx }, { scaleY: sy }] }]),
    ),
  );
// Three layers on co-prime timings so the flame never visibly repeats.
const fxFlameOuter = () =>
  flameKf('fxFlameOuter', [
    [0, 1, 1, 0],
    [13, 0.94, 1.07, -5],
    [27, 1.04, 0.95, 3],
    [41, 0.92, 1.12, -2],
    [58, 1.03, 0.97, 6],
    [72, 0.95, 1.09, -4],
    [86, 1.02, 0.94, 2],
    [100, 1, 1, 0],
  ]);
const fxFlameMid = () =>
  flameKf('fxFlameMid', [
    [0, 1, 1, 0],
    [18, 0.9, 1.1, 4],
    [36, 1.05, 0.93, -4],
    [55, 0.93, 1.14, 3],
    [77, 1.02, 0.96, -6],
    [100, 1, 1, 0],
  ]);
const fxFlameCore = () =>
  flameKf('fxFlameCore', [
    [0, 1, 1, 0],
    [25, 0.88, 1.12, -3],
    [50, 1.06, 0.92, 3],
    [75, 0.92, 1.08, -2],
    [100, 1, 1, 0],
  ]);
const fxFlameGlow = () =>
  kf('fxFlameGlow', () => ({
    '0%': { opacity: 0.55, transform: [{ scale: 1 }] },
    '30%': { opacity: 0.8, transform: [{ scale: 1.12 }] },
    '55%': { opacity: 0.5, transform: [{ scale: 0.96 }] },
    '80%': { opacity: 0.75, transform: [{ scale: 1.08 }] },
    '100%': { opacity: 0.55, transform: [{ scale: 1 }] },
  }));
const fxEmber = () =>
  kf('fxEmber', () => ({
    '0%': { opacity: 0, transform: [{ translateY: 0 }, { translateX: 0 }, { scale: 1 }] },
    '10%': { opacity: 1 },
    '100%': { opacity: 0, transform: [{ translateY: -16 }, { translateX: 3 }, { scale: 0.3 }] },
  }));

const OUTER = 'M12 1C13.6 6.2 19.4 10 20.7 16.4 22.1 23 18 30.6 12 31 6 30.6 1.9 23 3.4 16.7 4.4 12.6 7.4 11 8.4 7.4 9.6 10.2 10.2 11.6 11.1 12.1 11 8.1 11.2 4.6 12 1Z';
const MID = 'M12.2 9.6C14.2 13.8 17.8 17 17.3 22.6 16.9 27.6 14.6 30.6 12 30.8 9.4 30.6 7.2 27.6 6.9 23 6.6 19 9.4 16.9 10.4 13.9 11.1 15.9 11.6 17 12.4 17.5 12.1 15 11.9 12.4 12.2 9.6Z';
const CORE = 'M12 18.6C13.7 21.3 15.1 23.4 14.8 26.5 14.5 29.1 13.4 30.7 12 30.8 10.6 30.7 9.5 29.1 9.2 26.6 8.9 23.9 10.5 21.8 12 18.6Z';

/** A small, realistic candle-style flame: glow + outer/mid/core layers flickering independently. */
export function RealFlame({ size = 18 }: { size?: number }) {
  const id = useSvgId('fl');
  const w = size * 0.75;
  const h = size;
  const layer = (d: string, grad: string, k: ReturnType<typeof fxFlameOuter>, dur: number) => (
    <A style={[StyleSheet.absoluteFill, { transformOrigin: '50% 96%' } as ViewStyle, loop(k, dur, 0, 'ease-in-out')]}>
      <Svg width={w} height={h} viewBox="0 0 24 32">
        <Path d={d} fill={`url(#${grad})`} />
      </Svg>
    </A>
  );
  return (
    <View style={{ width: w, height: h }} pointerEvents="none">
      <A style={[{ position: 'absolute', left: -w * 0.35, top: h * 0.2, width: w * 1.7, height: w * 1.7 }, loop(fxFlameGlow(), 1.3)]}>
        <Svg width="100%" height="100%" viewBox="0 0 10 10">
          <Defs>
            <RadialGradient id={id + 'g'} cx="50%" cy="55%" r="50%">
              <Stop offset="0" stopColor="#FFB020" stopOpacity={0.75} />
              <Stop offset="0.5" stopColor="#FF6A00" stopOpacity={0.25} />
              <Stop offset="1" stopColor="#FF4000" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={5} cy={5} r={5} fill={`url(#${id}g)`} />
        </Svg>
      </A>
      <Svg width={0} height={0} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id + 'o'} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#D92B00" />
            <Stop offset="0.45" stopColor="#FF5A00" />
            <Stop offset="0.85" stopColor="#FF9A1F" />
            <Stop offset="1" stopColor="#FFC24A" stopOpacity={0.6} />
          </LinearGradient>
          <LinearGradient id={id + 'm'} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#FF8A00" />
            <Stop offset="0.6" stopColor="#FFC21A" />
            <Stop offset="1" stopColor="#FFE066" />
          </LinearGradient>
          <LinearGradient id={id + 'c'} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#FFF0B3" />
            <Stop offset="1" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>
      </Svg>
      {layer(OUTER, id + 'o', fxFlameOuter(), 0.93)}
      {layer(MID, id + 'm', fxFlameMid(), 0.67)}
      {layer(CORE, id + 'c', fxFlameCore(), 0.49)}
      <A style={[{ position: 'absolute', left: w * 0.55, top: h * 0.08, width: 2, height: 2, borderRadius: 1, backgroundColor: '#FFB347' }, loop(fxEmber(), 1.7, 0.4, 'ease-out')]} />
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Live mic ring

/**
 * A soft glow + ring around the recording mic button that swells with your voice: the native
 * recognizer's loudness when it reports one, otherwise a burst each time new words are heard (web).
 */
export function LiveMicRing({ size, level, activity }: { size: number; level: number | null; activity: string }) {
  const t = useSharedValue(0);
  const energy = useSharedValue(0.1);
  const target = useSharedValue(0.1);
  const bump = useSharedValue(0);
  useEffect(() => {
    if (level != null) target.value = 0.06 + level * 0.94;
  }, [level, target]);
  useEffect(() => {
    if (activity) bump.value = 1;
  }, [activity, bump]);
  useFrameCallback((f) => {
    const dt = Math.min(0.05, (f.timeSincePreviousFrame ?? 16) / 1000);
    t.value += dt;
    bump.value = Math.max(0, bump.value - dt * 1.4);
    const goal = Math.max(target.value, 0.1 + bump.value * 0.85);
    // Fast attack, slow release — like a real VU meter.
    energy.value += (goal - energy.value) * (goal > energy.value ? 0.4 : 0.07);
  });
  const glow = useAnimatedStyle(() => ({ opacity: 0.12 + energy.value * 0.35, transform: [{ scale: 1.02 + energy.value * 0.38 }] }));
  const ring = useAnimatedStyle(() => ({ opacity: 0.5 + energy.value * 0.5, transform: [{ scale: 1 + energy.value * 0.08 }] }));
  const box = size * 1.6;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: (size - box) / 2, top: (size - box) / 2, width: box, height: box, alignItems: 'center', justifyContent: 'center' }}
    >
      <A style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: TOMATO }, glow]} />
      <A style={[{ position: 'absolute', width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderWidth: 2, borderColor: TOMATO }, ring]} />
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Weather on the paper

type Intensity = 'light' | 'medium' | 'heavy' | string | null | undefined;
const countFor = (intensity: Intensity, light: number, medium: number, heavy: number) =>
  intensity === 'heavy' ? heavy : intensity === 'light' ? light : medium;

// Fixed pseudo-random layout so beads don't jump around between renders.
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const fxStreak = (h: number) =>
  kf('fxStreak' + h, () => ({ '0%': { transform: [{ translateY: -60 }] }, '100%': { transform: [{ translateY: h + 60 }] } }));
const fxStormFlash = () =>
  kf('fxStormFlash', () => ({
    '0%': { opacity: 0 },
    '84%': { opacity: 0 },
    '85%': { opacity: 0.45 },
    '87%': { opacity: 0.05 },
    '89%': { opacity: 0.3 },
    '94%': { opacity: 0 },
    '100%': { opacity: 0 },
  }));

function RainOnPaper({ w, h, intensity, storm, reducedFlashing }: { w: number; h: number; intensity: Intensity; storm: boolean; reducedFlashing?: boolean }) {
  const id = useSvgId('rn');
  const streaks = countFor(intensity, 6, 10, 16);
  const hh = Math.round(h / 50) * 50;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {/* Rain falling past the paper (no droplets settle on it). */}
      <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: '8deg' }, { scale: 1.2 }] }]}>
        {Array.from({ length: streaks }, (_, i) => (
          <A
            key={'s' + i}
            style={[
              { position: 'absolute', top: 0, left: rand(i + 3) * w, width: 1.2, height: 22 + rand(i + 9) * 18, opacity: 0.35 },
              loop(fxStreak(hh), 0.55 + rand(i + 21) * 0.35, rand(i + 40) * 1.2, 'linear'),
            ]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 1 10" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id={id + 'st' + i} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#5C7CB0" stopOpacity={0} />
                  <Stop offset="1" stopColor="#5C7CB0" stopOpacity={0.9} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={1} height={10} fill={`url(#${id}st${i})`} />
            </Svg>
          </A>
        ))}
      </View>
      {storm && !reducedFlashing ? <A style={[StyleSheet.absoluteFill, { backgroundColor: '#EEF2FF' }, loop(fxStormFlash(), 7.5, 2, 'linear')]} /> : null}
    </View>
  );
}

const fxFlake = (h: number, sway: number) =>
  kf(`fxFlake${h}_${sway}`, () => {
    const out: Record<string, object> = {};
    for (let k = 0; k <= 8; k++) {
      const p = k / 8;
      out[`${Math.round(p * 100)}%`] = {
        opacity: k === 0 ? 0 : k === 8 ? 0 : 1,
        transform: [{ translateY: -16 + p * (h + 32) }, { translateX: Math.sin(p * Math.PI * 2) * sway }, { rotate: `${p * 180}deg` }],
      };
    }
    return out;
  });
const fxGrowUp = () => kf('fxGrowUp', () => ({ '0%': { transform: [{ scaleY: 0 }] }, '100%': { transform: [{ scaleY: 1 }] } }));
const fxTwinkle = () =>
  kf('fxTwinkle', () => ({
    '0%': { opacity: 0.2, transform: [{ scale: 0.6 }] },
    '50%': { opacity: 1, transform: [{ scale: 1 }] },
    '100%': { opacity: 0.2, transform: [{ scale: 0.6 }] },
  }));

function driftPath(w: number, base: number, amp: number, seed: number) {
  const n = 7;
  let d = `M0 ${base + 30} L0 ${base - amp * rand(seed)}`;
  for (let i = 1; i <= n; i++) {
    const x = (i / n) * w;
    const y = base - amp * (0.3 + rand(seed + i) * 0.7);
    const cx = x - w / n / 2;
    const cy = base - amp * (0.6 + rand(seed + i * 3) * 0.8);
    d += ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + ` L${w} ${base + 30} Z`;
}

function capPath(w: number) {
  const n = 9;
  let d = `M0 0 L0 ${(4 + rand(50) * 5).toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const x = (i / n) * w;
    d += ` Q${(x - w / n / 2).toFixed(1)} ${(7 + rand(60 + i) * 6).toFixed(1)} ${x.toFixed(1)} ${(3 + rand(70 + i) * 5).toFixed(1)}`;
  }
  return d + ` L${w} 0 Z`;
}

function SnowOnPaper({ w, h, intensity }: { w: number; h: number; intensity: Intensity }) {
  const id = useSvgId('sn');
  const flakes = countFor(intensity, 10, 16, 24);
  const hh = Math.round(h / 50) * 50;
  const driftH = 56;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {/* Frost creeping in from the corners. */}
      <Svg style={StyleSheet.absoluteFill} width={w} height={h}>
        <Defs>
          {[0, 1, 2, 3].map((c) => (
            <RadialGradient key={c} id={`${id}f${c}`} cx={c % 2 ? '100%' : '0%'} cy={c < 2 ? '0%' : '100%'} r="38%">
              <Stop offset="0" stopColor="#D6E4F4" stopOpacity={0.95} />
              <Stop offset="0.3" stopColor="#E6EFF9" stopOpacity={0.6} />
              <Stop offset="1" stopColor="#EEF4FB" stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {[0, 1, 2, 3].map((c) => (
          <Rect key={c} x={0} y={0} width={w} height={h} fill={`url(#${id}f${c})`} />
        ))}
      </Svg>
      {/* Little ice crystals glinting in the frost. */}
      {[
        [0.06, 0.05],
        [0.9, 0.07],
        [0.12, 0.9],
        [0.86, 0.86],
        [0.18, 0.12],
      ].map(([x, y], i) => (
        <A key={'c' + i} style={[{ position: 'absolute', left: x * w, top: y * h }, loop(fxTwinkle(), 2.2 + i * 0.5, i * 0.4)]}>
          <Svg width={10} height={10} viewBox="0 0 10 10">
            <Path d="M5 0V10M0 5H10M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="#9FB6D3" strokeWidth={1} strokeLinecap="round" />
          </Svg>
        </A>
      ))}
      {/* Falling flakes, drifting side to side. */}
      {Array.from({ length: flakes }, (_, i) => {
        const s = 5 + rand(i + 2) * 7;
        const sway = Math.round(6 + rand(i + 8) * 14);
        return (
          <A
            key={'f' + i}
            style={[{ position: 'absolute', top: 0, left: rand(i + 13) * w, width: s, height: s }, loop(fxFlake(hh, sway), 6 + rand(i + 17) * 6, rand(i + 29) * 8, 'linear')]}
          >
            <Svg width={s} height={s} viewBox="0 0 10 10">
              <Defs>
                <RadialGradient id={`${id}k${i}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                  <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.95} />
                  <Stop offset="0.8" stopColor="#B9C9DE" stopOpacity={0.55} />
                  <Stop offset="1" stopColor="#B9C9DE" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={5} cy={5} r={5} fill={`url(#${id}k${i})`} />
            </Svg>
          </A>
        );
      })}
      {/* Snow settled along the top edge and drifted up along the bottom. */}
      <Svg style={{ position: 'absolute', top: 0, left: 0 }} width={w} height={14}>
        <Path d={capPath(w)} fill="#FFFFFF" stroke="#C3D2E4" strokeWidth={0.8} />
      </Svg>
      <A style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, height: driftH, transformOrigin: '50% 100%' } as ViewStyle, anim(fxGrowUp(), 2.4, 0.3, 'ease-out')]}>
        <Svg width={w} height={driftH}>
          <Defs>
            <LinearGradient id={id + 'd'} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.5" stopColor="#F2F6FB" />
              <Stop offset="1" stopColor="#CBD8E8" />
            </LinearGradient>
          </Defs>
          <G transform="translate(0 -3)">
            <Path d={driftPath(w, driftH - 18, 22, 7)} fill="#5A6E90" opacity={0.18} />
          </G>
          <Path d={driftPath(w, driftH - 18, 22, 7)} fill={`url(#${id}d)`} stroke="#FFFFFF" strokeWidth={1.2} />
        </Svg>
      </A>
    </View>
  );
}

const fxBreathe = () => kf('fxBreathe', () => ({ '0%': { opacity: 0.75 }, '50%': { opacity: 1 }, '100%': { opacity: 0.75 } }));
const fxRayShimmer = () =>
  kf('fxRayShimmer', () => ({
    '0%': { opacity: 0.25, transform: [{ translateX: 0 }] },
    '50%': { opacity: 0.7, transform: [{ translateX: 10 }] },
    '100%': { opacity: 0.25, transform: [{ translateX: 0 }] },
  }));
const fxLeaf = (n: number) =>
  kf('fxLeaf' + n, () => ({
    '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
    '30%': { transform: [{ translateX: 6 + n }, { translateY: -3 }, { scale: 1.05 }] },
    '60%': { transform: [{ translateX: -4 }, { translateY: 2 }, { scale: 0.97 }] },
    '100%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
  }));
const fxMote = (dx: number, dy: number) =>
  kf(`fxMote${dx}_${dy}`, () => ({
    '0%': { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }] },
    '20%': { opacity: 0.9 },
    '80%': { opacity: 0.7 },
    '100%': { opacity: 0, transform: [{ translateX: dx }, { translateY: dy }] },
  }));

function SunOnPaper({ w, h }: { w: number; h: number }) {
  const id = useSvgId('su');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {/* Warm sunlight falling in from the top-right corner. */}
      <A style={[StyleSheet.absoluteFill, loop(fxBreathe(), 6)]}>
        <Svg width={w} height={h}>
          <Defs>
            <RadialGradient id={id + 'l'} cx="100%" cy="0%" r="95%">
              <Stop offset="0" stopColor="#FFE08A" stopOpacity={0.55} />
              <Stop offset="0.35" stopColor="#FFEFC2" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#FFF6DD" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={w} height={h} fill={`url(#${id}l)`} />
        </Svg>
      </A>
      {/* Soft sunbeams. */}
      <View style={{ position: 'absolute', right: -w * 0.2, top: -h * 0.3, width: w * 1.2, height: h * 1.6, transform: [{ rotate: '32deg' }] }}>
        {[0.2, 0.42, 0.6, 0.78].map((x, i) => (
          <A key={'r' + i} style={[{ position: 'absolute', top: 0, bottom: 0, left: `${x * 100}%`, width: 18 + i * 9 }, loop(fxRayShimmer(), 5 + i * 1.3, i * 0.8)]}>
            <Svg width="100%" height="100%" viewBox="0 0 10 10" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id={`${id}r${i}`} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#FFF4CF" stopOpacity={0} />
                  <Stop offset="0.5" stopColor="#FFF4CF" stopOpacity={0.55} />
                  <Stop offset="1" stopColor="#FFF4CF" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x={0} y={0} width={10} height={10} fill={`url(#${id}r${i})`} />
            </Svg>
          </A>
        ))}
      </View>
      {/* Sunlight dappling through leaves, swaying in a breeze. */}
      {Array.from({ length: 7 }, (_, i) => {
        const s = 26 + rand(i + 4) * 40;
        return (
          <A
            key={'l' + i}
            style={[{ position: 'absolute', left: rand(i + 14) * w - s / 2, top: rand(i + 24) * h * 0.85 - s / 2, width: s, height: s * 0.7 }, loop(fxLeaf(i % 3), 4.5 + rand(i + 34) * 3.5, rand(i + 44) * 2)]}
          >
            <Svg width="100%" height="100%" viewBox="0 0 10 7">
              <Defs>
                <RadialGradient id={`${id}d${i}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFF1B8" stopOpacity={0.42} />
                  <Stop offset="0.5" stopColor="#FFE38A" stopOpacity={0.14} />
                  <Stop offset="1" stopColor="#FFE38A" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={5} cy={3.5} rx={5} ry={3.5} fill={`url(#${id}d${i})`} />
            </Svg>
          </A>
        );
      })}
      {/* Dust motes floating in the light. */}
      {Array.from({ length: 9 }, (_, i) => {
        const dx = Math.round(-20 - rand(i + 60) * 40);
        const dy = Math.round(20 + rand(i + 70) * 50);
        const s = 1.5 + rand(i + 80) * 2;
        return (
          <A
            key={'m' + i}
            style={[
              { position: 'absolute', left: (0.4 + rand(i + 90) * 0.55) * w, top: rand(i + 100) * h * 0.55, width: s, height: s, borderRadius: s, backgroundColor: '#FFF8E0', boxShadow: '0 0 4px rgba(255,230,160,.9)' } as ViewStyle,
              loop(fxMote(dx, dy), 7 + rand(i + 110) * 6, rand(i + 120) * 5, 'ease-in-out'),
            ]}
          />
        );
      })}
    </View>
  );
}

const fxCloudPass = (w: number) =>
  kf('fxCloudPass' + w, () => ({ '0%': { transform: [{ translateX: -w * 1.2 }] }, '100%': { transform: [{ translateX: w * 1.2 }] } }));

function CloudShadows({ w, h, fast }: { w: number; h: number; fast: boolean }) {
  const id = useSvgId('cl');
  const ww = Math.round(w / 50) * 50;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {[0, 1].map((i) => (
        <A
          key={i}
          style={[{ position: 'absolute', left: 0, top: (0.1 + i * 0.4) * h, width: w * 1.1, height: h * 0.6 }, loop(fxCloudPass(ww), fast ? 9 + i * 3 : 22 + i * 7, i * (fast ? 4 : 10), 'linear')]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 10 6">
            <Defs>
              <RadialGradient id={`${id}${i}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#3C465A" stopOpacity={0.12} />
                <Stop offset="0.6" stopColor="#3C465A" stopOpacity={0.06} />
                <Stop offset="1" stopColor="#3C465A" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse cx={5} cy={3} rx={5} ry={3} fill={`url(#${id}${i})`} />
          </Svg>
        </A>
      ))}
    </View>
  );
}

/** Weather sitting on the letter itself, from Throw's weather setting. */
export function PaperWeather({
  condition,
  intensity,
  isNight,
  reducedFlashing,
}: {
  condition: string | null | undefined;
  intensity?: Intensity;
  isNight?: boolean;
  reducedFlashing?: boolean;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 2 || Math.abs(size.h - height) > 2) setSize({ w: width, h: height });
  };
  let body: React.ReactNode = null;
  if (size && condition) {
    const { w, h } = size;
    if (condition === 'rain' || condition === 'thunderstorm' || condition === 'lightning')
      body = <RainOnPaper w={w} h={h} intensity={intensity} storm={condition !== 'rain'} reducedFlashing={reducedFlashing} />;
    else if (condition === 'snow') body = <SnowOnPaper w={w} h={h} intensity={intensity} />;
    else if ((condition === 'sunny' || condition === 'clear') && !isNight) body = <SunOnPaper w={w} h={h} />;
    else if (condition === 'cloudy' || condition === 'wind') body = <CloudShadows w={w} h={h} fast={condition === 'wind'} />;
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {body}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Hold to shred

/** Seconds the paper takes to feed through the shredder. */
export const SHRED_SECONDS = 1.05;

/** The paper trembling while it's held down (builds anticipation before the shred). */
export const fxTremble = () =>
  kf('fxTremble', () => ({
    '0%': { transform: [{ translateX: 0 }, { rotate: '0deg' }] },
    '25%': { transform: [{ translateX: -1.2 }, { rotate: '-0.25deg' }] },
    '50%': { transform: [{ translateX: 1 }, { rotate: '0.2deg' }] },
    '75%': { transform: [{ translateX: -0.8 }, { rotate: '0.15deg' }] },
    '100%': { transform: [{ translateX: 0 }, { rotate: '0deg' }] },
  }));
/** The sheet being pulled up into the shredder at its top edge, juddering as it goes. */
export const fxIntoShredder = (h: number) =>
  kf('fxIntoShredder' + h, () => {
    const out: Record<string, object> = { '0%': { transform: [{ translateY: 0 }, { translateX: 0 }] }, '8%': { transform: [{ translateY: 8 }, { translateX: 0 }] } };
    for (let k = 1; k <= 12; k++) {
      const p = 8 + k * 7.5;
      out[`${p}%`] = { transform: [{ translateY: -(k / 12) * (h + 10) }, { translateX: k % 2 ? 1.4 : -1.4 }] };
    }
    out['100%'] = { transform: [{ translateY: -(h + 10) }, { translateX: 0 }] };
    return out;
  });
const fxShredderIn = () =>
  kf('fxShredderIn', () => ({
    '0%': { opacity: 0, transform: [{ translateY: -40 }, { scaleX: 0.9 }] },
    '10%': { opacity: 1, transform: [{ translateY: 4 }, { scaleX: 1.02 }] },
    '16%': { opacity: 1, transform: [{ translateY: 0 }, { scaleX: 1 }] },
    '86%': { opacity: 1, transform: [{ translateY: 0 }, { scaleX: 1 }] },
    '100%': { opacity: 0, transform: [{ translateY: -40 }, { scaleX: 0.95 }] },
  }));
const fxShredderBuzz = () =>
  kf('fxShredderBuzz', () => ({
    '0%': { transform: [{ translateX: 0 }] },
    '33%': { transform: [{ translateX: 0.8 }] },
    '66%': { transform: [{ translateX: -0.8 }] },
    '100%': { transform: [{ translateX: 0 }] },
  }));
const fxLed = () => kf('fxLed', () => ({ '0%': { opacity: 1 }, '50%': { opacity: 0.25 }, '100%': { opacity: 1 } }));
const fxStrip = (n: number, fall: number) =>
  kf(`fxStrip${n}_${fall}`, () => {
    const dir = n % 2 ? 1 : -1;
    const drift = dir * (14 + (n % 4) * 12);
    const spin = dir * (40 + (n % 5) * 30);
    return {
      '0%': { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { rotate: '0deg' }, { scaleY: 0 }] },
      '28%': { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { rotate: `${dir * 3}deg` }, { scaleY: 1 }] },
      '42%': { opacity: 1, transform: [{ translateY: -26 }, { translateX: drift * 0.2 }, { rotate: `${spin * 0.15}deg` }, { scaleY: 1 }] },
      '70%': { opacity: 1, transform: [{ translateY: fall * 0.45 }, { translateX: drift * 0.7 }, { rotate: `${spin * 0.6}deg` }, { scaleY: 1 }] },
      '100%': { opacity: 0, transform: [{ translateY: fall }, { translateX: drift }, { rotate: `${spin}deg` }, { scaleY: 1 }] },
    };
  });
const fxChargeFill = () => kf('fxChargeFill', () => ({ '0%': { transform: [{ scaleX: 0 }] }, '100%': { transform: [{ scaleX: 1 }] } }));
const fxChargeIn = () =>
  kf('fxChargeIn', () => ({ '0%': { opacity: 0, transform: [{ translateY: 8 }, { scale: 0.9 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } }));

/** "Hold to shred" pill with a bar that fills while the paper is held down. */
export function HoldToShred({ seconds, delay }: { seconds: number; delay: number }) {
  return (
    <A pointerEvents="none" style={[styles.charge, anim(fxChargeIn(), 0.2, delay, 'ease-out')]}>
      <Text style={styles.chargeText}>Hold to shred</Text>
      <View style={styles.chargeTrack}>
        <A style={[styles.chargeFill, anim(fxChargeFill(), seconds - delay, delay, 'linear')]} />
      </View>
    </A>
  );
}

/**
 * The shredder that drops onto the letter's top edge, plus the strips that shoot out of it and
 * rain down. Positioned by the caller at the paper's top edge (`width` = paper width, `fall` =
 * how far the strips drop — the paper's height plus a bit).
 */
export function Shredder({ width, fall, ink }: { width: number; fall: number; ink: string }) {
  const n = Math.max(8, Math.round(width / 26));
  const sw = width / n;
  const total = SHRED_SECONDS + 0.9;
  const fallR = Math.round(fall / 20) * 20;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height: 0, overflow: 'visible' }}>
      {/* Strips coming out of the top of the head, then tumbling down. */}
      {Array.from({ length: n }, (_, i) => {
        const h = 40 + rand(i + 500) * 50;
        const marks = Array.from({ length: 3 }, (_, k) => rand(i * 7 + k + 600));
        return (
          <A
            key={i}
            style={[
              { position: 'absolute', top: -12 - h, left: i * sw + 1, width: sw - 2, height: h, backgroundColor: '#FBF8F1', borderWidth: 0.5, borderColor: 'rgba(22,33,12,.2)', overflow: 'hidden', transformOrigin: '50% 100%', boxShadow: '0 2px 4px rgba(22,33,12,.15)' } as ViewStyle,
              anim(fxStrip(i, fallR), 1.5 + rand(i + 700) * 0.5, 0.15 + rand(i + 800) * 0.7, 'ease-in'),
            ]}
          >
            {marks.map((m, k) =>
              m > 0.45 ? (
                <View key={k} style={{ position: 'absolute', top: 6 + k * 14 + m * 4, left: 1, right: 1 + m * 3, height: 2, borderRadius: 1, backgroundColor: ink, opacity: 0.55 }} />
              ) : null,
            )}
          </A>
        );
      })}
      {/* The shredder head. */}
      <A style={[{ position: 'absolute', left: -10, top: -16, width: width + 20, height: 30 }, anim(fxShredderIn(), total, 0, 'ease-out')]}>
        <A style={[styles.shredHead, loop(fxShredderBuzz(), 0.07, 0, 'linear')]}>
          <View style={styles.shredSlot} />
          <A style={[styles.shredLed, loop(fxLed(), 0.3)]} />
          <View style={styles.shredTeeth}>
            {Array.from({ length: n }, (_, i) => (
              <View key={i} style={styles.shredTooth} />
            ))}
          </View>
        </A>
      </A>
    </View>
  );
}

const styles = StyleSheet.create({
  charge: { position: 'absolute', top: -50, alignSelf: 'center', alignItems: 'center', gap: 6, backgroundColor: INK, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, zIndex: 20, boxShadow: '3px 3px 0 #FFD23F' } as ViewStyle,
  chargeText: { fontFamily: 'Figtree_700Bold', fontSize: 12.5, color: '#fff' },
  chargeTrack: { width: 120, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,.2)', overflow: 'hidden' },
  chargeFill: { width: '100%', height: '100%', backgroundColor: TOMATO, transformOrigin: '0% 50%' } as ViewStyle,
  shredHead: { flex: 1, borderRadius: 10, backgroundColor: '#23281F', borderWidth: 2, borderColor: INK, boxShadow: '0 6px 14px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.12)', justifyContent: 'center' } as ViewStyle,
  shredSlot: { position: 'absolute', left: 14, right: 14, bottom: 6, height: 3, borderRadius: 2, backgroundColor: '#000' },
  shredLed: { position: 'absolute', right: 10, top: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: '#C3EA4F', boxShadow: '0 0 6px #C3EA4F' } as ViewStyle,
  shredTeeth: { position: 'absolute', left: 10, right: 10, top: -4, height: 5, flexDirection: 'row', justifyContent: 'space-between' },
  shredTooth: { width: 3, height: 5, borderRadius: 1, backgroundColor: '#4A5244' },
});
