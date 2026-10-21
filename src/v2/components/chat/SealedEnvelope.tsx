// A received Throw letter in chat arrives as a sealed airmail envelope: it wiggles now and then
// to be noticed, the wax seal cracks a little more on each tap, and on the third tap the seal
// splits, the flap flips open, the letter pops out with a burst of confetti and the card turns
// into the open letter. Opened letters are remembered on this device.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';

import { anim, kf, loop } from '@/theme/anim';
import { acConfetti } from '@/theme/animAccount';

const A = Animated.View;
const SPRING = cubicBezier(0.2, 0.8, 0.3, 1.4);
const TAPS_TO_OPEN = 3;
export const ENVELOPE_OPEN_MS = 1150;

// ---------------------------------------------------------------------------------------------
// "Opened" memory (module store + AsyncStorage)

const STORE_KEY = 'myspace.openedLetters.v1';
const opened = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version += 1;
  listeners.forEach((l) => l());
};
AsyncStorage.getItem(STORE_KEY)
  .then((raw) => {
    if (!raw) return;
    (JSON.parse(raw) as string[]).forEach((id) => opened.add(id));
    emit();
  })
  .catch(() => {});
function markOpened(id: string) {
  opened.add(id);
  emit();
  AsyncStorage.setItem(STORE_KEY, JSON.stringify([...opened].slice(-500))).catch(() => {});
}
/** Whether this letter has already been opened on this device (re-renders when it changes). */
export function useLetterOpened(id: string | undefined) {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => version,
  );
  return id ? opened.has(id) : true;
}

function tick(strong = false) {
  if (Platform.OS === 'web') {
    try {
      (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(strong ? 22 : 8);
    } catch {
      // not supported
    }
    return;
  }
  Haptics.impactAsync(strong ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// ---------------------------------------------------------------------------------------------
// keyframes

const fxNudge = () =>
  kf('envNudge', () => ({
    '0%': { transform: [{ rotate: '0deg' }, { translateY: 0 }] },
    '78%': { transform: [{ rotate: '0deg' }, { translateY: 0 }] },
    '82%': { transform: [{ rotate: '-3deg' }, { translateY: -4 }] },
    '86%': { transform: [{ rotate: '2.5deg' }, { translateY: -2 }] },
    '90%': { transform: [{ rotate: '-1.5deg' }, { translateY: -1 }] },
    '94%': { transform: [{ rotate: '0.6deg' }, { translateY: 0 }] },
    '100%': { transform: [{ rotate: '0deg' }, { translateY: 0 }] },
  }));
const fxSealSquish = (v: number) =>
  kf('envSquish' + (v % 2), () => ({
    '0%': { transform: [{ scaleX: 1 }, { scaleY: 1 }, { rotate: '0deg' }] },
    '30%': { transform: [{ scaleX: 1.18 }, { scaleY: 0.82 }, { rotate: '-6deg' }] },
    '60%': { transform: [{ scaleX: 0.94 }, { scaleY: 1.08 }, { rotate: '4deg' }] },
    '100%': { transform: [{ scaleX: 1 }, { scaleY: 1 }, { rotate: '0deg' }] },
  }));
const fxShake = (v: number) =>
  kf('envShake' + (v % 2), () => ({
    '0%': { transform: [{ translateX: 0 }] },
    '20%': { transform: [{ translateX: -4 }] },
    '40%': { transform: [{ translateX: 4 }] },
    '60%': { transform: [{ translateX: -2 }] },
    '80%': { transform: [{ translateX: 2 }] },
    '100%': { transform: [{ translateX: 0 }] },
  }));
const fxSealHalf = (dir: 1 | -1) =>
  kf('envHalf' + dir, () => ({
    '0%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }] },
    '25%': { opacity: 1, transform: [{ translateX: dir * 14 }, { translateY: -14 }, { rotate: `${dir * 25}deg` }] },
    '100%': { opacity: 0, transform: [{ translateX: dir * 60 }, { translateY: 120 }, { rotate: `${dir * 140}deg` }] },
  }));
const fxFlapOpen = () =>
  kf('envFlap', () => ({
    '0%': { transform: [{ perspective: 500 }, { rotateX: '0deg' }], opacity: 1 },
    '22%': { transform: [{ perspective: 500 }, { rotateX: '0deg' }], opacity: 1 },
    '60%': { transform: [{ perspective: 500 }, { rotateX: '170deg' }], opacity: 1 },
    '100%': { transform: [{ perspective: 500 }, { rotateX: '180deg' }], opacity: 0.9 },
  }));
const fxPaperOut = () =>
  kf('envPaper', () => ({
    '0%': { transform: [{ translateY: 40 }, { rotate: '0deg' }] },
    '45%': { transform: [{ translateY: 40 }, { rotate: '0deg' }] },
    '80%': { transform: [{ translateY: -46 }, { rotate: '-3deg' }] },
    '100%': { transform: [{ translateY: -34 }, { rotate: '-2deg' }] },
  }));
const fxShine = () =>
  kf('envShine', () => ({
    '0%': { opacity: 0, transform: [{ translateX: -30 }, { rotate: '25deg' }] },
    '70%': { opacity: 0, transform: [{ translateX: -30 }, { rotate: '25deg' }] },
    '80%': { opacity: 0.8, transform: [{ translateX: 0 }, { rotate: '25deg' }] },
    '92%': { opacity: 0, transform: [{ translateX: 30 }, { rotate: '25deg' }] },
    '100%': { opacity: 0, transform: [{ translateX: 30 }, { rotate: '25deg' }] },
  }));
const fxHint = () =>
  kf('envHint', () => ({ '0%': { opacity: 0.55 }, '50%': { opacity: 1 }, '100%': { opacity: 0.55 } }));
/** The open letter settling in after the envelope (used by LetterThrownCard). */
export const fxLetterReveal = () =>
  kf('envReveal', () => ({
    '0%': { opacity: 0, transform: [{ translateY: 26 }, { rotate: '-3deg' }, { scale: 0.94 }] },
    '60%': { opacity: 1, transform: [{ translateY: -4 }, { rotate: '1deg' }, { scale: 1.02 }] },
    '100%': { opacity: 1, transform: [{ translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] },
  }));

const BURST = Array.from({ length: 14 }, (_, i) => {
  const a = ((-180 + i * (180 / 13)) * Math.PI) / 180;
  const r = 50 + ((i * 37) % 40);
  return {
    dx: Math.round(Math.cos(a) * r),
    dy: Math.round(Math.sin(a) * r),
    rot: (i * 71) % 360,
    glyph: ['❤', '✦', '✉', '★'][i % 4],
    color: ['#FF4F6D', '#FFD23F', '#2F6BFF', '#C3EA4F'][i % 4],
    d: (i % 5) * 0.03,
  };
});

// ---------------------------------------------------------------------------------------------
// pieces

const SEAL = 50;
const SEAL_PATH =
  'M25 1.5 C29 3 31 1 34 3.5 C37 6 40 5 42 9 C44 12.5 47.5 13 47.5 17.5 C47.5 21 49.5 23 48.5 27 C47.5 31 48.5 34 45.5 37 C43 40 42.5 43.5 38.5 45 C35 46.5 33 49 28.5 48.5 C25 48 22 49.5 18.5 47.5 C15 45.5 11.5 46.5 9 43 C6.5 39.5 3 38.5 2.5 34 C2 30.5 0.5 28 1.5 24 C2.5 20 1 17 3.5 13.5 C6 10 6.5 6.5 10.5 5 C14 3.5 16 1 20.5 1.5 C22 1.6 23.5 1 25 1.5 Z';
const CRACKS = ['M25 8 L22 18 L27 24 L23 33', 'M25 8 L22 18 L27 24 L23 33 L26 42 M27 24 L36 21 M22 18 L13 16', 'M25 8 L22 18 L27 24 L23 33 L26 42 M27 24 L36 21 L42 26 M22 18 L13 16 L8 22 M23 33 L14 36'];

/** The wax seal; its initial is overlaid as text by the caller so it centres on every platform. */
function WaxSeal({ cracks }: { cracks: number }) {
  return (
    <Svg width={SEAL} height={SEAL} viewBox="0 0 50 50">
      <Defs>
        <RadialGradient id="waxG" cx="38%" cy="32%" r="70%">
          <Stop offset="0" stopColor="#E8384F" />
          <Stop offset="0.55" stopColor="#B5142B" />
          <Stop offset="1" stopColor="#7A0A1A" />
        </RadialGradient>
      </Defs>
      <Path d={SEAL_PATH} fill="url(#waxG)" />
      <Circle cx={25} cy={25} r={15} fill="none" stroke="#7A0A1A" strokeOpacity={0.55} strokeWidth={2} />
      <Circle cx={25.6} cy={25.6} r={15} fill="none" stroke="#FF8A98" strokeOpacity={0.35} strokeWidth={0.8} />
      <Ellipse cx={17} cy={13} rx={6} ry={3} fill="#FFFFFF" opacity={0.28} transform="rotate(-30 17 13)" />
      {cracks > 0 ? <Path d={CRACKS[Math.min(cracks, CRACKS.length) - 1]} fill="none" stroke="#3A0008" strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" /> : null}
    </Svg>
  );
}
/** Left/right halves of the seal flying apart. */
function SealHalves() {
  return (
    <>
      {([-1, 1] as const).map((dir) => (
        <A key={dir} style={[StyleSheet.absoluteFill, { overflow: 'hidden', width: SEAL / 2, left: dir < 0 ? 0 : SEAL / 2 }, anim(fxSealHalf(dir), 0.9, 0, 'ease-in')]}>
          <View style={{ position: 'absolute', left: dir < 0 ? 0 : -SEAL / 2, top: 0 }}>
            <WaxSeal cracks={3} />
          </View>
        </A>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------------------------

const W = 226;
const H = 118;

/**
 * The sealed envelope. Calls `onOpened` once the open animation finishes (the caller then shows
 * the open letter in its place).
 */
export function SealedEnvelope({ id, initial, onOpened }: { id: string; initial: string; onOpened: () => void }) {
  const [taps, setTaps] = useState(0);
  const [opening, setOpening] = useState(false);
  const [shake, setShake] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const tapSeal = () => {
    if (opening) return;
    const next = taps + 1;
    setTaps(next);
    setShake((n) => n + 1);
    tick(next >= TAPS_TO_OPEN);
    if (next >= TAPS_TO_OPEN) {
      setOpening(true);
      timer.current = setTimeout(() => {
        markOpened(id);
        onOpened();
      }, ENVELOPE_OPEN_MS);
    }
  };

  return (
    <A style={opening ? null : loop(fxNudge(), 4.2, 1)}>
      <Pressable onPress={tapSeal} accessibilityRole="button" accessibilityLabel={opening ? 'Opening letter' : `Sealed letter — tap the seal ${TAPS_TO_OPEN - taps} more time${TAPS_TO_OPEN - taps === 1 ? '' : 's'} to open`}>
        <A style={[styles.envelope, shake ? anim(fxShake(shake), 0.3, 0, 'ease-out') : null]}>
          {/* The letter inside, popping out as it opens. */}
          {opening ? (
            <A style={[styles.paperInside, anim(fxPaperOut(), ENVELOPE_OPEN_MS / 1000, 0, 'ease-out')]}>
              {[0, 1, 2].map((l) => (
                <View key={l} style={[styles.paperLine, { width: `${80 - l * 18}%` }]} />
              ))}
            </A>
          ) : null}
          {/* Envelope front: the two lower folds. */}
          <Svg style={StyleSheet.absoluteFill} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <Polygon points={`0,${H} ${W / 2},${H * 0.5} ${W},${H}`} fill="#EFE6D3" />
            <Polygon points={`0,0 ${W / 2},${H * 0.56} 0,${H}`} fill="#F3ECDD" />
            <Polygon points={`${W},0 ${W / 2},${H * 0.56} ${W},${H}`} fill="#F3ECDD" />
            <Path d={`M0 ${H} L${W / 2} ${H * 0.5} L${W} ${H}`} fill="none" stroke="rgba(22,33,12,.15)" strokeWidth={1} />
          </Svg>
          {/* The top flap (flips open). */}
          <A style={[styles.flap, { transformOrigin: '50% 0%' } as ViewStyle, opening ? anim(fxFlapOpen(), ENVELOPE_OPEN_MS / 1000, 0, 'ease-in-out') : null]}>
            <Svg width={W} height={H * 0.62} viewBox={`0 0 ${W} ${H * 0.62}`}>
              <Polygon points={`0,0 ${W},0 ${W / 2},${H * 0.6}`} fill="#E9DEC6" stroke="rgba(22,33,12,.18)" strokeWidth={1} />
            </Svg>
          </A>
          {/* Wax seal at the flap's tip. */}
          <View style={styles.sealAnchor}>
            {opening ? (
              <>
                <SealHalves />
                {BURST.map((b, i) => (
                  <A key={i} pointerEvents="none" style={[styles.burst, anim(acConfetti(b.dx, b.dy, b.rot), 0.9, 0.05 + b.d, cubicBezier(0.2, 0.8, 0.3, 1))]}>
                    <Text style={[styles.burstGlyph, { color: b.color }]}>{b.glyph}</Text>
                  </A>
                ))}
              </>
            ) : (
              <A key={'s' + taps} style={taps ? anim(fxSealSquish(taps), 0.35, 0, SPRING) : null}>
                <WaxSeal cracks={taps} />
                <View pointerEvents="none" style={styles.initialWrap}>
                  <Text style={styles.initial}>{initial}</Text>
                </View>
                <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: SEAL / 2, overflow: 'hidden' }]}>
                  <A style={[styles.shine, loop(fxShine(), 3.2, 0.6, 'ease-in-out')]} />
                </View>
              </A>
            )}
          </View>
        </A>
      </Pressable>
      {!opening ? (
        <A style={[styles.hintRow, loop(fxHint(), 1.6)]}>
          <Text style={styles.hint}>{taps === 0 ? 'Tap the seal to open' : `${TAPS_TO_OPEN - taps} more…`}</Text>
          <View style={styles.dots}>
            {Array.from({ length: TAPS_TO_OPEN }, (_, i) => (
              <View key={i} style={[styles.dot, i < taps && styles.dotOn]} />
            ))}
          </View>
        </A>
      ) : null}
    </A>
  );
}

const styles = StyleSheet.create({
  envelope: { width: W, height: H, alignSelf: 'center', borderRadius: 8, backgroundColor: '#F6F1E6', overflow: 'visible' },
  paperInside: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 10,
    height: H - 20,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(22,33,12,.12)',
    padding: 12,
    gap: 8,
  },
  paperLine: { height: 3, borderRadius: 2, backgroundColor: 'rgba(35,70,200,.45)' },
  flap: { position: 'absolute', left: 0, top: 0, width: W, height: H * 0.62, backfaceVisibility: 'hidden' } as ViewStyle,
  sealAnchor: { position: 'absolute', left: W / 2 - SEAL / 2, top: H * 0.6 - SEAL / 2, width: SEAL, height: SEAL },
  initialWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: 'Caveat_700Bold', fontSize: 22, color: 'rgba(255,220,225,.75)', textShadowColor: 'rgba(60,0,10,.6)', textShadowOffset: { width: 0.5, height: 1 }, textShadowRadius: 0 },
  shine: { position: 'absolute', top: -10, left: SEAL / 2 - 6, width: 12, height: SEAL + 20, backgroundColor: 'rgba(255,255,255,.45)' },
  burst: { position: 'absolute', left: SEAL / 2 - 7, top: SEAL / 2 - 9 },
  burstGlyph: { fontSize: 15 },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  hint: { fontFamily: 'SpaceMono_700Bold', fontSize: 10, letterSpacing: 0.6, color: '#2F6BFF' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#2F6BFF' },
  dotOn: { backgroundColor: '#2F6BFF' },
});
