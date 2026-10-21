// Realistic letter effects (v3): a layered flickering flame, a live mic ring driven by voice
// loudness, weather that sits on the paper (water beads, snow, sunlight) and the crumpled-paper
// ball that bounces away. Kept apart from letterFx.tsx, which holds the lighter sticker effects.
import React, { useEffect, useId, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
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

const BAR_LEN = 13;

function MicBar({ i, n, radius, t, energy }: { i: number; n: number; radius: number; t: SharedValue<number>; energy: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const tt = t.value;
    const e = energy.value;
    // Neighbouring bars move together (a travelling wave) with a faster jitter on top — reads like
    // a real level meter instead of identical pulsing bars.
    const wave = 0.5 + 0.5 * Math.sin(tt * 6.1 + i * 0.75) * Math.sin(tt * 2.3 + i * 1.7);
    const jitter = 0.5 + 0.5 * Math.sin(tt * 17.3 + i * 4.1) * Math.cos(tt * 9.7 + i * 2.3);
    const v = 0.08 + e * (0.55 * wave + 0.45 * jitter);
    return { transform: [{ scaleY: 0.18 + v * 1.25 }], opacity: 0.3 + Math.min(1, v) * 0.7 };
  });
  return (
    <View style={{ position: 'absolute', width: 3, height: radius * 2, alignItems: 'center', transform: [{ rotate: `${(i / n) * 360}deg` }] }}>
      <A style={[{ width: 3, height: BAR_LEN, borderRadius: 2, backgroundColor: INK, transformOrigin: '50% 100%' } as ViewStyle, style]} />
    </View>
  );
}

/**
 * Sound bars around the recording mic button that follow your voice: the native recognizer's
 * loudness when it reports one, otherwise a burst each time new words are heard (web).
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
  const radius = size / 2 + 5 + BAR_LEN;
  const box = radius * 2 + 4;
  const n = 30;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: (size - box) / 2, top: (size - box) / 2, width: box, height: box, alignItems: 'center', justifyContent: 'center' }}
    >
      <A style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: TOMATO }, glow]} />
      <A style={[{ position: 'absolute', width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderWidth: 2, borderColor: TOMATO }, ring]} />
      {Array.from({ length: n }, (_, i) => (
        <MicBar key={i} i={i} n={n} radius={radius} t={t} energy={energy} />
      ))}
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

const fxBead = (slide: number) =>
  kf('fxBead' + slide, () =>
    (slide
      ? {
          '0%': { opacity: 0, transform: [{ translateY: 0 }, { scaleX: 0.2 }, { scaleY: 0.2 }] },
          '3%': { opacity: 1, transform: [{ translateY: 0 }, { scaleX: 1.3 }, { scaleY: 1.1 }] },
          '6%': { opacity: 1, transform: [{ translateY: 0 }, { scaleX: 0.92 }, { scaleY: 1.02 }] },
          '9%': { opacity: 1, transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] },
          '40%': { opacity: 1, transform: [{ translateY: 0 }, { scaleX: 1 }, { scaleY: 1 }] },
          '48%': { opacity: 1, transform: [{ translateY: slide * 0.08 }, { scaleX: 0.94 }, { scaleY: 1.15 }] },
          '78%': { opacity: 1, transform: [{ translateY: slide }, { scaleX: 0.85 }, { scaleY: 1.25 }] },
          '90%': { opacity: 0, transform: [{ translateY: slide * 1.05 }, { scaleX: 0.7 }, { scaleY: 1 }] },
          '100%': { opacity: 0, transform: [{ translateY: slide * 1.05 }, { scaleX: 0.7 }, { scaleY: 1 }] },
        }
      : {
          '0%': { opacity: 0, transform: [{ scaleX: 0.2 }, { scaleY: 0.2 }] },
          '3%': { opacity: 1, transform: [{ scaleX: 1.3 }, { scaleY: 1.1 }] },
          '6%': { opacity: 1, transform: [{ scaleX: 0.92 }, { scaleY: 1.02 }] },
          '9%': { opacity: 1, transform: [{ scaleX: 1 }, { scaleY: 1 }] },
          '80%': { opacity: 1, transform: [{ scaleX: 1 }, { scaleY: 1 }] },
          '96%': { opacity: 0, transform: [{ scaleX: 0.75 }, { scaleY: 0.7 }] },
          '100%': { opacity: 0, transform: [{ scaleX: 0.75 }, { scaleY: 0.7 }] },
        }) as Record<string, object>,
  );
const fxSplash = () =>
  kf('fxSplash', () => ({
    '0%': { opacity: 0, transform: [{ scale: 0.3 }] },
    '2%': { opacity: 0.8, transform: [{ scale: 0.6 }] },
    '9%': { opacity: 0, transform: [{ scale: 2.3 }] },
    '100%': { opacity: 0, transform: [{ scale: 2.3 }] },
  }));
const fxWetSpot = () =>
  kf('fxWetSpot', () => ({
    '0%': { opacity: 0, transform: [{ scale: 0.4 }] },
    '7%': { opacity: 1, transform: [{ scale: 1 }] },
    '85%': { opacity: 0.85, transform: [{ scale: 1.08 }] },
    '100%': { opacity: 0, transform: [{ scale: 1.1 }] },
  }));
const fxTrail = () =>
  kf('fxTrail', () => ({
    '0%': { opacity: 0, transform: [{ scaleY: 0 }] },
    '42%': { opacity: 0, transform: [{ scaleY: 0 }] },
    '45%': { opacity: 1, transform: [{ scaleY: 0.05 }] },
    '78%': { opacity: 1, transform: [{ scaleY: 1 }] },
    '96%': { opacity: 0, transform: [{ scaleY: 1 }] },
    '100%': { opacity: 0, transform: [{ scaleY: 1 }] },
  }));
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

function WaterBead({ s, id }: { s: number; id: string }) {
  return (
    <Svg width={s} height={s * 1.1} viewBox="0 0 20 22">
      <Defs>
        <RadialGradient id={id + 'sh'} cx="50%" cy="50%" r="50%">
          <Stop offset="0.55" stopColor="#3A4A66" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#3A4A66" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={id + 'b'} cx="42%" cy="38%" r="60%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <Stop offset="0.6" stopColor="#CFE0F5" stopOpacity={0.18} />
          <Stop offset="0.88" stopColor="#6F8DBA" stopOpacity={0.38} />
          <Stop offset="1" stopColor="#3F5A88" stopOpacity={0.6} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={11.6} cy={13.4} rx={9} ry={8.6} fill={`url(#${id}sh)`} />
      <Ellipse cx={10} cy={11} rx={8} ry={8.6} fill={`url(#${id}b)`} />
      <Ellipse cx={11} cy={16} rx={4.2} ry={1.9} fill="#FFFFFF" opacity={0.5} />
      <Ellipse cx={7} cy={6.4} rx={2.5} ry={1.5} fill="#FFFFFF" opacity={0.95} transform="rotate(-32 7 6.4)" />
      <Circle cx={12.6} cy={5.6} r={0.7} fill="#FFFFFF" opacity={0.8} />
    </Svg>
  );
}

function RainOnPaper({ w, h, intensity, storm, reducedFlashing }: { w: number; h: number; intensity: Intensity; storm: boolean; reducedFlashing?: boolean }) {
  const id = useSvgId('rn');
  const beads = countFor(intensity, 6, 9, 13);
  const streaks = countFor(intensity, 6, 10, 16);
  const hh = Math.round(h / 50) * 50;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {/* Rain falling past the paper. */}
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
      {/* Drops landing on the paper: splash, a damp spot, a bead that sits or slides down. */}
      {Array.from({ length: beads }, (_, i) => {
        const s = 12 + rand(i + 1) * 12;
        const x = 0.06 + rand(i + 11) * 0.86;
        const y = 0.05 + rand(i + 31) * 0.7;
        const dur = 6 + rand(i + 51) * 4;
        const delay = rand(i + 71) * 6;
        const slide = rand(i + 91) > 0.55 ? Math.round((40 + rand(i + 5) * 70) / 10) * 10 : 0;
        const left = x * w - s / 2;
        const top = y * h - s / 2;
        return (
          <React.Fragment key={'b' + i}>
            <A style={[{ position: 'absolute', left: left - s * 0.9, top: top - s * 0.8, width: s * 2.8, height: s * 2.8 }, loop(fxWetSpot(), dur, delay, 'ease-out')]}>
              <Svg width="100%" height="100%" viewBox="0 0 10 10">
                <Defs>
                  <RadialGradient id={id + 'w' + i} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#7C8FAE" stopOpacity={0.1} />
                    <Stop offset="0.7" stopColor="#7C8FAE" stopOpacity={0.05} />
                    <Stop offset="1" stopColor="#4C5E80" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={5} cy={5} r={5} fill={`url(#${id}w${i})`} />
              </Svg>
            </A>
            {slide ? (
              <A
                style={[
                  { position: 'absolute', left: left + s * 0.33, top: top + s * 0.5, width: s * 0.34, height: slide, borderRadius: s, backgroundColor: 'rgba(76,96,140,.10)', transformOrigin: '50% 0%' } as ViewStyle,
                  loop(fxTrail(), dur, delay, 'linear'),
                ]}
              />
            ) : null}
            <A style={[{ position: 'absolute', left, top, width: s, height: s, borderRadius: s, borderWidth: 1, borderColor: 'rgba(80,110,160,.6)' }, loop(fxSplash(), dur, delay, 'ease-out')]} />
            <A style={[{ position: 'absolute', left, top }, loop(fxBead(slide), dur, delay, 'ease-in-out')]}>
              <WaterBead s={s} id={id + 'd' + i} />
            </A>
          </React.Fragment>
        );
      })}
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
// Crumple

/** The paper scrunching in on itself, in uneven crunches. */
export const fxCrumplePaper = () =>
  kf('fxCrumplePaper', () => ({
    '0%': { opacity: 1, transform: [{ scaleX: 1 }, { scaleY: 1 }, { rotate: '0deg' }, { skewX: '0deg' }] },
    '9%': { opacity: 1, transform: [{ scaleX: 0.9 }, { scaleY: 0.96 }, { rotate: '-2deg' }, { skewX: '3deg' }] },
    '16%': { opacity: 1, transform: [{ scaleX: 0.86 }, { scaleY: 0.9 }, { rotate: '-1deg' }, { skewX: '1deg' }] },
    '25%': { opacity: 1, transform: [{ scaleX: 0.7 }, { scaleY: 0.76 }, { rotate: '4deg' }, { skewX: '-4deg' }] },
    '33%': { opacity: 1, transform: [{ scaleX: 0.62 }, { scaleY: 0.6 }, { rotate: '2deg' }, { skewX: '-2deg' }] },
    '42%': { opacity: 1, transform: [{ scaleX: 0.44 }, { scaleY: 0.46 }, { rotate: '-6deg' }, { skewX: '5deg' }] },
    '50%': { opacity: 1, transform: [{ scaleX: 0.32 }, { scaleY: 0.3 }, { rotate: '8deg' }, { skewX: '-3deg' }] },
    '56%': { opacity: 0, transform: [{ scaleX: 0.22 }, { scaleY: 0.22 }, { rotate: '12deg' }, { skewX: '0deg' }] },
    '100%': { opacity: 0, transform: [{ scaleX: 0.22 }, { scaleY: 0.22 }, { rotate: '12deg' }, { skewX: '0deg' }] },
  }));
const fxCreases = () =>
  kf('fxCreases', () => ({ '0%': { opacity: 0 }, '12%': { opacity: 0.45 }, '30%': { opacity: 0.8 }, '50%': { opacity: 1 }, '100%': { opacity: 1 } }));

// Crease network drawn on the shrinking sheet (0..100 box).
const CREASES = [
  'M0 18 L22 30 L48 22 L70 36 L100 28',
  'M0 52 L18 46 L40 58 L62 48 L84 60 L100 54',
  'M0 82 L26 74 L50 86 L76 72 L100 80',
  'M14 0 L22 30 L18 46 L26 74 L20 100',
  'M44 0 L48 22 L40 58 L50 86 L46 100',
  'M76 0 L70 36 L62 48 L76 72 L80 100',
  'M22 30 L40 58 M70 36 L84 60 M18 46 L50 86 M62 48 L50 86',
];
const FACETS: [string, number][] = [
  ['0,0 22,30 48,22 44,0', 0.07],
  ['48,22 70,36 62,48 40,58', 0.12],
  ['0,52 18,46 26,74 0,82', 0.09],
  ['62,48 84,60 76,72 50,86', 0.06],
  ['70,36 100,28 100,54 84,60', 0.1],
  ['26,74 50,86 46,100 20,100', 0.08],
];

/** Wrinkles + shaded facets that appear across the sheet as it crumples. */
export function CrumpleCreases() {
  return (
    <A pointerEvents="none" style={[StyleSheet.absoluteFill, anim(fxCreases(), 0.75, 0, 'linear')]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {FACETS.map(([pts, o], i) => (
          <Polygon key={i} points={pts} fill="#2A2416" opacity={o} />
        ))}
        {CREASES.map((d, i) => (
          <Path key={i} d={d} fill="none" stroke="#2A2416" strokeOpacity={0.28} strokeWidth={0.5} />
        ))}
        {CREASES.slice(0, 6).map((d, i) => (
          <Path key={'h' + i} d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={0.4} transform="translate(0.6 0.6)" />
        ))}
      </Svg>
    </A>
  );
}

// Ball physics sampled into keyframes: forms at the centre, is tossed up and to the right,
// bounces with squash on each landing, then rolls off-screen.
const BALL_DELAY = 0.21; // fraction of the timeline before the ball appears (paper still scrunching)
function simulateBall() {
  const frames: { p: number; x: number; y: number; rot: number; sx: number; sy: number; o: number }[] = [];
  const total = 1.5; // seconds after the ball forms
  const floor = 150;
  const g = 1500;
  let x = 0;
  let y = 0;
  let vx = 230;
  let vy = -520;
  let rot = 0;
  let squash = 0;
  const steps = 60;
  const dt = total / steps;
  for (let k = 0; k <= steps; k++) {
    const p = BALL_DELAY + (k / steps) * (1 - BALL_DELAY);
    const sq = Math.max(0, squash);
    frames.push({ p, x, y, rot, sx: 1 + sq * 0.3, sy: 1 - sq * 0.28, o: 1 });
    squash -= dt * 9;
    vy += g * dt;
    x += vx * dt;
    y += vy * dt;
    rot += (vx * dt) / 0.32; // rolling: distance / radius (deg-ish)
    if (y > floor) {
      y = floor;
      vy = -vy * 0.48;
      vx *= 0.88;
      squash = Math.min(1, Math.abs(vy) / 300);
    }
  }
  return frames;
}
export const fxBall = () =>
  kf('fxBall', () => {
    const out: Record<string, object> = {
      '0%': { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 0.3 }, { scaleY: 0.3 }, { rotate: '0deg' }] },
      [`${Math.round((BALL_DELAY - 0.04) * 100)}%`]: { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scaleX: 0.5 }, { scaleY: 0.5 }, { rotate: '-20deg' }] },
    };
    for (const f of simulateBall()) {
      out[`${(f.p * 100).toFixed(2)}%`] = {
        opacity: f.o,
        transform: [{ translateX: f.x }, { translateY: f.y }, { scaleX: f.sx }, { scaleY: f.sy }, { rotate: `${f.rot.toFixed(1)}deg` }],
      };
    }
    return out;
  });
export const fxBallShadow = () =>
  kf('fxBallShadow', () => {
    const out: Record<string, object> = { '0%': { opacity: 0, transform: [{ translateX: 0 }, { scaleX: 0.3 }] } };
    for (const f of simulateBall()) {
      const hgt = Math.max(0, 150 - f.y) / 150;
      out[`${(f.p * 100).toFixed(2)}%`] = { opacity: 0.35 * (1 - hgt * 0.7), transform: [{ translateX: f.x }, { scaleX: 1 - hgt * 0.5 }] };
    }
    return out;
  });
/** When (seconds into the crumple) the ball hits the floor — for haptic ticks. */
export function ballLandingTimes(duration: number) {
  const times: number[] = [];
  const frames = simulateBall();
  for (let i = 1; i < frames.length - 1; i++) {
    if (frames[i].y >= 150 && frames[i - 1].y < 150) times.push(frames[i].p * duration);
  }
  return times;
}

// Crumpled ball geometry (64x64 box): an uneven outer ring, an inner ring and a centre point,
// triangulated into facets that are shaded by which way they face a top-left light.
const ring = (n: number, r: number, jitter: number, seed: number, phase = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + phase;
    const rr = r + (rand(seed + i) - 0.5) * jitter;
    return [32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr] as [number, number];
  });
const OUTER_RING = ring(14, 29, 7, 200);
const INNER_RING = ring(7, 15, 7, 240, 0.3);
const BALL_CENTER: [number, number] = [31, 30];
const BALL_TRIS: [number, number][][] = [];
for (let i = 0; i < 14; i++) {
  const a = OUTER_RING[i];
  const b = OUTER_RING[(i + 1) % 14];
  const k = Math.floor((i / 14) * 7);
  const c = INNER_RING[k];
  const d = INNER_RING[(k + 1) % 7];
  BALL_TRIS.push([a, b, c]);
  if (Math.floor(((i + 1) / 14) * 7) !== k) BALL_TRIS.push([b, d, c]);
}
for (let i = 0; i < 7; i++) BALL_TRIS.push([INNER_RING[i], INNER_RING[(i + 1) % 7], BALL_CENTER]);
const BALL_FACETS = BALL_TRIS.map((t, i) => {
  const cx = (t[0][0] + t[1][0] + t[2][0]) / 3 - 32;
  const cy = (t[0][1] + t[1][1] + t[2][1]) / 3 - 32;
  const dist = Math.min(1, Math.hypot(cx, cy) / 30);
  // Facets on the lit (top-left) side brighten, the far side darkens; plus a random tilt per facet.
  const facing = (-cx - cy) / 42;
  const light = facing * dist + (rand(i + 400) - 0.5) * 0.9;
  return { pts: t.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '), light };
});

/** A crumpled ball of letter paper, lit from the top-left, with a few smudges of ink. */
function PaperBall({ size = 82, ink }: { size?: number; ink: string }) {
  const id = useSvgId('pb');
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={id} cx="36%" cy="32%" r="72%">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.55" stopColor="#F1EBDD" />
          <Stop offset="1" stopColor="#C9BEA6" />
        </RadialGradient>
      </Defs>
      <Polygon points={OUTER_RING.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')} fill={`url(#${id})`} />
      {BALL_FACETS.map((f, i) => (
        <Polygon
          key={i}
          points={f.pts}
          fill={f.light > 0 ? '#FFFFFF' : '#4E4430'}
          opacity={f.light > 0 ? Math.min(0.75, f.light * 0.7) : Math.min(0.32, -f.light * 0.3)}
          stroke="#3A3122"
          strokeOpacity={0.22}
          strokeWidth={0.45}
          strokeLinejoin="round"
        />
      ))}
      <Path d="M18 27 q3 -3 6 0 t6 0 M33 41 q3 -2 6 0 t5 -1 M24 47 q2 -1.5 4 0" fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth={1.1} strokeLinecap="round" />
      <Polygon points={OUTER_RING.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')} fill="none" stroke="#3A3122" strokeOpacity={0.4} strokeWidth={0.8} strokeLinejoin="round" />
    </Svg>
  );
}

/** The crumpled ball (and its floor shadow) bouncing away; mount it when a crumple starts. */
export function CrumpleBall({ duration, ink }: { duration: number; ink: string }) {
  return (
    <View pointerEvents="none" style={styles.ballAnchor}>
      <A style={[styles.ballShadow, anim(fxBallShadow(), duration, 0, 'linear')]} />
      <A style={[{ position: 'absolute', left: -41, top: -41 }, anim(fxBall(), duration, 0, 'linear')]}>
        <PaperBall ink={ink} />
      </A>
    </View>
  );
}

const styles = StyleSheet.create({
  ballAnchor: { position: 'absolute', left: '50%', top: '42%', width: 0, height: 0, zIndex: 30 },
  ballShadow: { position: 'absolute', left: -30, top: 184, width: 60, height: 10, borderRadius: 26, backgroundColor: 'rgba(22,33,12,.35)', boxShadow: '0 0 8px rgba(22,33,12,.35)' } as ViewStyle,
});
