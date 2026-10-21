// Playful letter interactions for Throw's compose paper (v3): ink prompts, the TO stamp, sticker
// badges, weather on the paper, fold creases, mic sound bars, the reminder clock dial, stamps,
// haptics and shake detection. Animations are Reanimated CSS keyframes (see theme/anim's `kf`).
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Animated as RNAnimated, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { Line, Path } from 'react-native-svg';

import { anim, kf, loop } from '@/theme/anim';
import { acConfetti } from '@/theme/animAccount';

export const FX_INK = '#16210C';
const SUN = '#FFD23F';
const TOMATO = '#FF4F2E';
const COBALT = '#2B4BFF';
const LIME = '#C3EA4F';
const SKY = '#9EB3FF';
const BUBBLE = '#FFB4C8';
export const SPRING = cubicBezier(0.2, 0.8, 0.3, 1.4);
const OUT = cubicBezier(0.5, 0, 0.8, 0.4);
const A = Animated.View;

// ---------------------------------------------------------------------------------------------
// keyframes
export const fxFloat = () =>
  kf('fxFloat', () => ({
    '0%': { transform: [{ translateY: 0 }, { rotate: '-0.6deg' }] },
    '50%': { transform: [{ translateY: -4 }, { rotate: '0.5deg' }] },
    '100%': { transform: [{ translateY: 0 }, { rotate: '-0.6deg' }] },
  }));
/** Old sheet slips out to the left, a fresh one slaps down with a slight tilt (A/B to retrigger). */
export const fxNewSheet = (v: 'A' | 'B') =>
  kf('fxNewSheet' + v, () => ({
    '0%': { transform: [{ translateX: 0 }, { rotate: '0deg' }, { scale: 1 }], opacity: 1 },
    '30%': { transform: [{ translateX: -260 }, { rotate: '-12deg' }, { scale: 0.96 }], opacity: 0 },
    '31%': { transform: [{ translateX: 0 }, { rotate: '6deg' }, { scale: 1.25 }], opacity: 0 },
    '70%': { transform: [{ translateX: 0 }, { rotate: '-2deg' }, { scale: 0.97 }], opacity: 1 },
    '100%': { transform: [{ translateX: 0 }, { rotate: '-1deg' }, { scale: 1 }], opacity: 1 },
  }));
/** A fresh sheet slapping down (after a crumple / clear). */
export const fxSlapIn = (v: 'A' | 'B') =>
  kf('fxSlapIn' + v, () => ({
    '0%': { transform: [{ rotate: '6deg' }, { scale: 1.25 }], opacity: 0 },
    '60%': { transform: [{ rotate: '-2deg' }, { scale: 0.97 }], opacity: 1 },
    '100%': { transform: [{ rotate: '-1deg' }, { scale: 1 }], opacity: 1 },
  }));
export const fxWobble = (v: 'A' | 'B') =>
  kf('fxWobble' + v, () => ({
    '0%': { transform: [{ rotate: '0deg' }, { scale: 1 }] },
    '25%': { transform: [{ rotate: '-1.6deg' }, { scale: 1.012 }] },
    '55%': { transform: [{ rotate: '1.2deg' }, { scale: 0.995 }] },
    '80%': { transform: [{ rotate: '-0.5deg' }, { scale: 1 }] },
    '100%': { transform: [{ rotate: '0deg' }, { scale: 1 }] },
  }));
/** Crumple into a ball and bounce away. */
export const fxCrumple = () =>
  kf('fxCrumple', () => ({
    '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }], opacity: 1, borderRadius: 18 },
    '35%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 0.35 }, { rotate: '-25deg' }], opacity: 1, borderRadius: 200 },
    '55%': { transform: [{ translateX: 40 }, { translateY: -60 }, { scale: 0.22 }, { rotate: '120deg' }], opacity: 1, borderRadius: 200 },
    '75%': { transform: [{ translateX: 110 }, { translateY: 20 }, { scale: 0.2 }, { rotate: '220deg' }], opacity: 1, borderRadius: 200 },
    '100%': { transform: [{ translateX: 260 }, { translateY: -40 }, { scale: 0.16 }, { rotate: '330deg' }], opacity: 0, borderRadius: 200 },
  }));
const fxPenWiggle = () =>
  kf('fxPenWiggle', () => ({
    '0%': { transform: [{ rotate: '-8deg' }] },
    '50%': { transform: [{ rotate: '10deg' }] },
    '100%': { transform: [{ rotate: '-8deg' }] },
  }));
const fxFlash = () => kf('fxFlash', () => ({ '0%': { opacity: 0 }, '15%': { opacity: 0.95 }, '100%': { opacity: 0 } }));
export const fxPolaroidIn = () =>
  kf('fxPolaroidIn', () => ({
    '0%': { transform: [{ translateY: -40 }, { scale: 1.5 }, { rotate: '-18deg' }], opacity: 0 },
    '60%': { transform: [{ translateY: 2 }, { scale: 0.95 }, { rotate: '4deg' }], opacity: 1 },
    '100%': { transform: [{ translateY: 0 }, { scale: 1 }, { rotate: '0deg' }], opacity: 1 },
  }));
const fxBar = () =>
  kf('fxBar', () => ({ '0%': { transform: [{ scaleY: 0.35 }] }, '50%': { transform: [{ scaleY: 1 }] }, '100%': { transform: [{ scaleY: 0.35 }] } }));
const fxPulseRing = () =>
  kf('fxPulseRing', () => ({ '0%': { transform: [{ scale: 1 }], opacity: 0.55 }, '100%': { transform: [{ scale: 1.55 }], opacity: 0 } }));
export const fxSwing = (v: 'A' | 'B') =>
  kf('fxSwing' + v, () => ({
    '0%': { transform: [{ rotate: '0deg' }] },
    '15%': { transform: [{ rotate: '22deg' }] },
    '35%': { transform: [{ rotate: '-18deg' }] },
    '55%': { transform: [{ rotate: '12deg' }] },
    '75%': { transform: [{ rotate: '-6deg' }] },
    '100%': { transform: [{ rotate: '0deg' }] },
  }));
const fxDialSpin = () => kf('fxDialSpin', () => ({ '0%': { transform: [{ rotate: '-540deg' }] }, '100%': { transform: [{ rotate: '0deg' }] } }));
const fxStamp = () =>
  kf('fxStamp', () => ({
    '0%': { transform: [{ scale: 2.2 }, { rotate: '-14deg' }], opacity: 0 },
    '60%': { transform: [{ scale: 0.9 }, { rotate: '-8deg' }], opacity: 1 },
    '100%': { transform: [{ scale: 1 }, { rotate: '-8deg' }], opacity: 1 },
  }));
const fxFlicker = () =>
  kf('fxFlicker', () => ({
    '0%': { transform: [{ scale: 1 }, { rotate: '-4deg' }] },
    '25%': { transform: [{ scale: 1.12 }, { rotate: '3deg' }] },
    '50%': { transform: [{ scale: 0.94 }, { rotate: '-2deg' }] },
    '75%': { transform: [{ scale: 1.08 }, { rotate: '5deg' }] },
    '100%': { transform: [{ scale: 1 }, { rotate: '-4deg' }] },
  }));
const fxRise = () =>
  kf('fxRise', () => ({
    '0%': { transform: [{ translateY: 6 }, { scale: 0.6 }], opacity: 0 },
    '25%': { transform: [{ translateY: -6 }, { scale: 1.15 }], opacity: 1 },
    '100%': { transform: [{ translateY: -46 }, { scale: 1 }], opacity: 0 },
  }));
export const fxPlaneWiggle = () =>
  kf('fxPlaneWiggle', () => ({
    '0%': { transform: [{ rotate: '0deg' }, { translateY: 0 }] },
    '25%': { transform: [{ rotate: '-3deg' }, { translateY: -3 }] },
    '50%': { transform: [{ rotate: '0deg' }, { translateY: 0 }] },
    '75%': { transform: [{ rotate: '3deg' }, { translateY: -3 }] },
    '100%': { transform: [{ rotate: '0deg' }, { translateY: 0 }] },
  }));
export const fxArrowBounce = () =>
  kf('fxArrowBounce', () => ({ '0%': { transform: [{ translateY: 0 }] }, '50%': { transform: [{ translateY: -7 }] }, '100%': { transform: [{ translateY: 0 }] } }));
const fxDrop = () =>
  kf('fxDrop', () => ({
    '0%': { transform: [{ translateY: -10 }, { scale: 0.2 }], opacity: 0 },
    '15%': { transform: [{ translateY: 0 }, { scale: 1.1 }], opacity: 0.85 },
    '70%': { transform: [{ translateY: 26 }, { scale: 1 }], opacity: 0.7 },
    '100%': { transform: [{ translateY: 40 }, { scale: 0.9 }], opacity: 0 },
  }));
const fxSnowSettle = () =>
  kf('fxSnowSettle', () => ({ '0%': { transform: [{ translateY: -12 }], opacity: 0 }, '100%': { transform: [{ translateY: 0 }], opacity: 1 } }));
const fxGlare = () =>
  kf('fxGlare', () => ({
    '0%': { transform: [{ translateX: -420 }, { rotate: '20deg' }], opacity: 0 },
    '10%': { opacity: 0.55 },
    '45%': { transform: [{ translateX: 420 }, { rotate: '20deg' }], opacity: 0.55 },
    '46%': { opacity: 0 },
    '100%': { transform: [{ translateX: 420 }, { rotate: '20deg' }], opacity: 0 },
  }));
export const fxPinBounce = (v: 'A' | 'B') =>
  kf('fxPinBounce' + v, () => ({
    '0%': { transform: [{ translateY: 0 }, { scale: 1 }] },
    '20%': { transform: [{ translateY: -26 }, { scale: 1.12 }] },
    '40%': { transform: [{ translateY: 0 }, { scale: 0.92 }] },
    '55%': { transform: [{ translateY: -12 }, { scale: 1.04 }] },
    '70%': { transform: [{ translateY: 0 }, { scale: 0.98 }] },
    '85%': { transform: [{ translateY: -4 }, { scale: 1 }] },
    '100%': { transform: [{ translateY: 0 }, { scale: 1 }] },
  }));

// ---------------------------------------------------------------------------------------------
// haptics + shake

/** A tiny tap on the phone (native), a short buzz where the web supports it. */
export function tick(strong = false) {
  if (Platform.OS === 'web') {
    try {
      (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(strong ? 18 : 8);
    } catch {
      // not supported
    }
    return;
  }
  Haptics.impactAsync(strong ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** iOS web needs motion permission from a user gesture; call this from a tap. */
export function requestMotionPermission() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const D = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
  D?.requestPermission?.().catch(() => {});
}

/** Calls `onShake` on a firm shake (web: devicemotion; native: expo-sensors accelerometer). */
export function useShake(onShake: () => void, enabled = true) {
  const cb = useRef(onShake);
  cb.current = onShake;
  useEffect(() => {
    if (!enabled) return;
    let last = 0;
    let hits = 0;
    let hitAt = 0;
    const feed = (mag: number) => {
      const now = Date.now();
      if (mag < 2.2) return; // in g
      if (now - hitAt > 700) hits = 0;
      hits += 1;
      hitAt = now;
      if (hits >= 3 && now - last > 1500) {
        last = now;
        hits = 0;
        cb.current();
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      const onMotion = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null || a.y == null || a.z == null) return;
        feed(Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.81);
      };
      window.addEventListener('devicemotion', onMotion);
      return () => window.removeEventListener('devicemotion', onMotion);
    }
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    import('expo-sensors')
      .then(({ Accelerometer }) => {
        if (cancelled) return;
        Accelerometer.setUpdateInterval(80);
        sub = Accelerometer.addListener(({ x, y, z }) => feed(Math.sqrt(x * x + y * y + z * z)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);
}

// ---------------------------------------------------------------------------------------------
// components

const PEN = 'M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4';

/** The placeholder, written in like ink, cycling through prompts that use the recipient's name. */
export function InkPrompt({ name, color, style, wiggleKey, centered }: { name: string; color: string; style?: ViewStyle; wiggleKey: number; centered?: boolean }) {
  const first = (name || 'them').trim().split(/\s+/)[0];
  const prompts = name === 'Me' || name === 'You'
    ? ['Note to self…', 'Remind yourself of something nice', 'What do you want to remember?']
    : [`Tell ${first} about your day…`, 'What made you smile today?', `Something only ${first} would get…`, 'Write something for your loved one'];
  const [idx, setIdx] = useState(0);
  const [n, setN] = useState(0);
  const text = prompts[idx % prompts.length];
  useEffect(() => {
    if (n < text.length) {
      const t = setTimeout(() => setN((x) => x + 1), 38);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setIdx((i) => i + 1);
      setN(0);
    }, 2800);
    return () => clearTimeout(t);
  }, [n, text]);
  return (
    <View pointerEvents="none" style={[styles.promptWrap, centered && { justifyContent: 'center' }, style]}>
      <Text style={[styles.promptText, { color }]}>
        {text.slice(0, n)}
        <Text style={{ opacity: 0 }}>{text.slice(n)}</Text>
      </Text>
      <A key={'pen' + wiggleKey} style={[{ marginTop: 6 }, wiggleKey ? anim(fxSwing(wiggleKey % 2 ? 'A' : 'B'), 0.6, 0, 'ease-out') : loop(fxPenWiggle(), 1.6)]}>
        <Svg width={22} height={22} viewBox="0 0 24 24">
          <Path d={PEN} fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </A>
    </View>
  );
}

/** "TO: PRIYA" rubber stamp in the paper's corner; restamps when the recipient changes. */
export function ToStamp({ label, color = COBALT }: { label: string; color?: string }) {
  return (
    <A key={label} pointerEvents="none" style={[styles.toStamp, { borderColor: color }, anim(fxStamp(), 0.4, 0.25, SPRING)]}>
      <Text style={[styles.toStampText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </A>
  );
}

/** One-off stamp (e.g. "DING!") that pops in place. */
export function PopStamp({ text, color = TOMATO, style }: { text: string; color?: string; style?: ViewStyle }) {
  return (
    <A pointerEvents="none" style={[styles.popStamp, { borderColor: color }, style, anim(fxStamp(), 0.35, 0, SPRING)]}>
      <Text style={[styles.toStampText, { color }]}>{text}</Text>
    </A>
  );
}

/** White flash over the paper when a photo lands (keyed by the photo count). */
export function ShutterFlash({ k }: { k: number }) {
  if (!k) return null;
  return <A key={'flash' + k} pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }, anim(fxFlash(), 0.45, 0, 'ease-out')]} />;
}

const STREAK_SEEN = new Map<string, number>();

/** Sticker-style streak + points badges: flickering flame (tap it a few times for a heart),
 * "+1" with confetti when the streak goes up, and points that roll up like a counter. */
export function StickerBadges({ streak, points, recipientKey, label }: { streak: number; points: number; recipientKey: string; label: string }) {
  const [shown, setShown] = useState(0);
  const [plusOne, setPlusOne] = useState(0);
  const [hearts, setHearts] = useState(0);
  const taps = useRef<number[]>([]);
  useEffect(() => {
    const prev = STREAK_SEEN.get(recipientKey);
    STREAK_SEEN.set(recipientKey, streak);
    if (prev !== undefined && streak > prev) setPlusOne((n) => n + 1);
  }, [streak, recipientKey]);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const step = () => {
      const p = Math.min(1, (Date.now() - t0) / 700);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(points * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [points, recipientKey]);
  const tapFlame = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    tick();
    if (taps.current.length >= 4) {
      taps.current = [];
      setHearts((h) => h + 1);
      tick(true);
    }
  };
  return (
    <View style={styles.badges} pointerEvents="box-none">
      {streak > 0 ? (
        <Pressable onPress={tapFlame} accessibilityRole="button" accessibilityLabel={`${streak} day throw streak with ${label}`} hitSlop={6}>
          <View style={[styles.badge, { backgroundColor: SUN, transform: [{ rotate: '-4deg' }] }]}>
            <A style={loop(fxFlicker(), 1.1, 0, 'ease-in-out')}>
              <Text style={styles.flame}>🔥</Text>
            </A>
            <Text style={styles.badgeText}>{streak}</Text>
          </View>
          {plusOne ? (
            <>
              <A key={'p1' + plusOne} pointerEvents="none" style={[styles.rise, anim(fxRise(), 1.2, 0, 'ease-out')]}>
                <Text style={styles.plusOne}>+1</Text>
              </A>
              {CONFETTI.map((c, i) => (
                <A
                  key={`cf${plusOne}-${i}`}
                  pointerEvents="none"
                  style={[
                    { position: 'absolute', left: 16, top: 10, width: c.s, height: c.s, backgroundColor: c.bg, borderWidth: 1.5, borderColor: FX_INK, borderRadius: c.round ? c.s / 2 : 2 },
                    anim(acConfetti(c.dx, c.dy, c.rot), 0.8, c.d, cubicBezier(0.2, 0.8, 0.3, 1)),
                  ]}
                />
              ))}
            </>
          ) : null}
          {hearts
            ? [0, 1, 2].map((i) => (
                <A key={`h${hearts}-${i}`} pointerEvents="none" style={[styles.rise, { left: 2 + i * 12 }, anim(fxRise(), 1.1, i * 0.12, 'ease-out')]}>
                  <Text style={{ fontSize: 16 }}>💖</Text>
                </A>
              ))
            : null}
        </Pressable>
      ) : null}
      <View style={[styles.badge, { backgroundColor: '#fff', transform: [{ rotate: '3deg' }] }]} accessibilityLabel={`${points} leaderboard points with ${label}`}>
        <Svg width={12} height={12} viewBox="0 0 24 24">
          <Path d="M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.21 13.89 7 23l5-3 5 3-1.21-9.12" fill="none" stroke={FX_INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Text style={styles.badgeText}>{shown}</Text>
      </View>
    </View>
  );
}

const CONFETTI = Array.from({ length: 10 }, (_, i) => {
  const a = ((-170 + i * (160 / 9)) * Math.PI) / 180;
  const r = 34 + ((i * 29) % 26);
  return { dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r), rot: (i * 67) % 360, s: 6 + (i % 3) * 2, bg: [SUN, TOMATO, COBALT, LIME, SKY, BUBBLE][i % 6], round: i % 2 === 1, d: (i % 4) * 0.03 };
});

/** Rain drops, settled snow or a sunny glare on the paper, from Throw's weather setting. */
export function PaperWeather({ condition, isNight }: { condition: string | null | undefined; isNight?: boolean }) {
  if (!condition) return null;
  if (condition === 'rain' || condition === 'thunderstorm') {
    const drops = [
      [0.12, 0.3, 0],
      [0.78, 0.22, 1.1],
      [0.4, 0.62, 2.3],
      [0.86, 0.7, 3.2],
      [0.2, 0.8, 4.1],
    ];
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {drops.map(([x, y, d], i) => (
          <A
            key={i}
            style={[
              { position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: 9, height: 12, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, backgroundColor: 'rgba(80,120,220,.28)', borderWidth: 1, borderColor: 'rgba(80,120,220,.45)' } as ViewStyle,
              loop(fxDrop(), 5, d, 'ease-in'),
            ]}
          />
        ))}
      </View>
    );
  }
  if (condition === 'snow') {
    const blobs = Array.from({ length: 9 }, (_, i) => ({ left: `${i * 11.5 - 2}%`, w: 34 + ((i * 17) % 22), h: 12 + ((i * 7) % 8) }));
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {blobs.map((b, i) => (
          <A key={'t' + i} style={[{ position: 'absolute', top: -6, left: b.left, width: b.w, height: b.h, borderRadius: b.h, backgroundColor: 'rgba(255,255,255,.92)' } as ViewStyle, anim(fxSnowSettle(), 0.9, i * 0.08, 'ease-out')]} />
        ))}
        {blobs.map((b, i) => (
          <A key={'b' + i} style={[{ position: 'absolute', bottom: -6, left: b.left, width: b.w + 8, height: b.h + 4, borderRadius: b.h, backgroundColor: 'rgba(255,255,255,.95)', borderWidth: 1, borderColor: 'rgba(22,33,12,.06)' } as ViewStyle, anim(fxSnowSettle(), 1.1, 0.3 + i * 0.08, 'ease-out')]} />
        ))}
      </View>
    );
  }
  if ((condition === 'sunny' || condition === 'clear') && !isNight) {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <A style={[{ position: 'absolute', top: -60, bottom: -60, left: '45%', width: 70, backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,250,220,.75), rgba(255,255,255,0))' } as ViewStyle, loop(fxGlare(), 6, 1, 'ease-in-out')]} />
      </View>
    );
  }
  return null;
}

/** Dashed fold lines that appear as the paper starts folding (driven by the fold progress). */
export function FoldCreases({ progress, color = 'rgba(22,33,12,.35)' }: { progress: RNAnimated.Value; color?: string }) {
  const opacity = progress.interpolate({ inputRange: [0, 0.015, 0.12, 0.2], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' });
  return (
    <RNAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Line x1="50" y1="0" x2="50" y2="100" stroke={color} strokeWidth={0.6} strokeDasharray="2.5 2" />
        <Line x1="0" y1="0" x2="50" y2="38" stroke={color} strokeWidth={0.6} strokeDasharray="2.5 2" />
        <Line x1="100" y1="0" x2="50" y2="38" stroke={color} strokeWidth={0.6} strokeDasharray="2.5 2" />
        <Line x1="22" y1="0" x2="50" y2="100" stroke={color} strokeWidth={0.4} strokeDasharray="2 2.5" />
        <Line x1="78" y1="0" x2="50" y2="100" stroke={color} strokeWidth={0.4} strokeDasharray="2 2.5" />
      </Svg>
    </RNAnimated.View>
  );
}

/** Pulse ring + sound bars around the mic button while recording; `level` (0..1) scales them when known. */
export function SoundBars({ size, level }: { size: number; level: number | null }) {
  const r = size / 2 + 9;
  const bars = 10;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -20, top: -20, width: size + 40, height: size + 40, alignItems: 'center', justifyContent: 'center' }}>
      <A style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: TOMATO }, loop(fxPulseRing(), 1.2, 0, 'ease-out')]} />
      {Array.from({ length: bars }, (_, i) => {
        const a = (i / bars) * 360;
        const h = 6 + (level == null ? 6 : level * 12);
        return (
          <View key={i} style={{ position: 'absolute', width: 4, height: r * 2, alignItems: 'center', transform: [{ rotate: `${a}deg` }] }}>
            <A style={[{ width: 4, height: h, borderRadius: 2, backgroundColor: FX_INK }, loop(fxBar(), 0.55 + (i % 3) * 0.12, (i % 5) * 0.08, 'ease-in-out')]} />
          </View>
        );
      })}
    </View>
  );
}

/** Reminder clock: spins in, then its hands turn to the picked time. */
export function ClockDial({ hour, minute }: { hour: number; minute: number }) {
  const hourDeg = ((hour % 12) + minute / 60) * 30;
  const minDeg = minute * 6;
  const hand = (len: number, w: number, deg: number, color: string) => (
    <View
      style={
        {
          position: 'absolute',
          left: 46 - w / 2,
          top: 46 - len,
          width: w,
          height: len,
          borderRadius: w,
          backgroundColor: color,
          transformOrigin: 'bottom',
          transform: [{ rotate: `${deg}deg` }],
          transitionProperty: 'transform',
          transitionDuration: '0.5s',
          transitionTimingFunction: SPRING,
        } as unknown as ViewStyle
      }
    />
  );
  return (
    <View style={{ alignSelf: 'center', marginBottom: 14 }}>
      <A style={[styles.dial, anim(fxDialSpin(), 0.9, 0, cubicBezier(0.2, 0.8, 0.3, 1.05))]}>
        {Array.from({ length: 12 }, (_, i) => (
          <View key={i} style={{ position: 'absolute', left: 45, top: 4, width: 2, height: 84, alignItems: 'center', transform: [{ rotate: `${i * 30}deg` }] }}>
            <View style={{ width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 9 : 5, borderRadius: 2, backgroundColor: FX_INK }} />
          </View>
        ))}
        {hand(26, 4.5, hourDeg, FX_INK)}
        {hand(36, 3, minDeg, TOMATO)}
        <View style={{ position: 'absolute', left: 41, top: 41, width: 10, height: 10, borderRadius: 5, backgroundColor: SUN, borderWidth: 2, borderColor: FX_INK }} />
      </A>
    </View>
  );
}

/** Small toast with an Undo action, used after crumpling / shaking the letter clear. */
export function UndoToast({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <A style={[styles.toast, anim(fxPolaroidIn(), 0.35, 0, SPRING)]}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: LIME }} />
      <Text style={styles.toastText}>{text}</Text>
      <Pressable onPress={onUndo} accessibilityRole="button" hitSlop={10}>
        <Text style={[styles.toastText, { color: SUN, textDecorationLine: 'underline' }]}>Undo</Text>
      </Pressable>
    </A>
  );
}

export { OUT as FX_OUT };

const styles = StyleSheet.create({
  promptWrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  promptText: { fontFamily: 'Caveat_500Medium', fontSize: 22, lineHeight: 30, textAlign: 'center' },
  toStamp: { position: 'absolute', top: 16, left: 16, borderWidth: 2.5, borderRadius: 7, paddingVertical: 2, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,.7)', maxWidth: 150 },
  popStamp: { position: 'absolute', borderWidth: 2.5, borderRadius: 7, paddingVertical: 2, paddingHorizontal: 8, backgroundColor: '#fff' },
  toStampText: { fontFamily: 'SpaceMono_700Bold', fontSize: 11, letterSpacing: 1.2 },
  badges: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 2, borderColor: FX_INK, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, boxShadow: `2px 2px 0 ${FX_INK}` } as ViewStyle,
  badgeText: { fontFamily: 'SpaceMono_700Bold', fontSize: 12.5, color: FX_INK },
  flame: { fontSize: 13 },
  rise: { position: 'absolute', left: 8, top: -6 },
  plusOne: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 18, color: TOMATO, textShadowColor: FX_INK, textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 0 },
  dial: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#fff', borderWidth: 2.5, borderColor: FX_INK, boxShadow: `4px 4px 0 ${FX_INK}` } as ViewStyle,
  toast: { position: 'absolute', top: -46, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: FX_INK, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, boxShadow: `3px 3px 0 ${SUN}`, zIndex: 20 } as ViewStyle,
  toastText: { fontFamily: 'Figtree_700Bold', fontSize: 13, color: '#fff' },
});
