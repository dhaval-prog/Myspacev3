// Port of animations.css (sk* = onboarding/map, gp* = games/pocket) to
// Reanimated 4 CSS keyframes. Keyframes that used `var(--r)` are factories
// keyed by the rotation so each one is created once.
import { css, cubicBezier, type CSSAnimationKeyframes } from 'react-native-reanimated';

type Ease = ReturnType<typeof cubicBezier> | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

export const E = {
  out: cubicBezier(0.2, 0.8, 0.3, 1), // entrance
  s12: cubicBezier(0.2, 0.8, 0.3, 1.2),
  s13: cubicBezier(0.2, 0.8, 0.3, 1.3),
  s14: cubicBezier(0.2, 0.8, 0.3, 1.4),
  s15: cubicBezier(0.2, 0.8, 0.3, 1.5),
  sheet: cubicBezier(0.2, 0.9, 0.3, 1),
  throwCard: cubicBezier(0.5, 0, 0.7, 0.4),
  along: cubicBezier(0.45, 0.05, 0.4, 1),
} as const;

const cache = new Map<string, ReturnType<typeof css.keyframes>>();
export const kf = (key: string, frames: () => CSSAnimationKeyframes) => {
  let k = cache.get(key);
  if (!k) {
    k = css.keyframes(frames() as any);
    cache.set(key, k);
  }
  return k;
};
const deg = (n: number) => `${n}deg`;

// --- entrances ----------------------------------------------------------
export const skUp = () =>
  kf('skUp', () => ({ from: { opacity: 0, transform: [{ translateY: 40 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } }));
export const skSlideIn = () =>
  kf('skSlideIn', () => ({ from: { opacity: 0, transform: [{ translateX: 60 }] }, to: { opacity: 1, transform: [{ translateX: 0 }] } }));
export const skStep = () =>
  kf('skStep', () => ({ from: { opacity: 0, transform: [{ translateX: 48 }] }, to: { opacity: 1, transform: [{ translateX: 0 }] } }));
export const skFade = () => kf('skFade', () => ({ from: { opacity: 0 }, to: { opacity: 1 } }));
export const skPop = () =>
  kf('skPop', () => ({
    '0%': { opacity: 0, transform: [{ scale: 0 }] },
    '70%': { opacity: 1, transform: [{ scale: 1.08 }] },
    '100%': { opacity: 1, transform: [{ scale: 1 }] },
  }));
export const skPopR = (r = 0) =>
  kf('skPopR' + r, () => ({
    '0%': { opacity: 0, transform: [{ scale: 0 }, { rotate: deg(r) }] },
    '70%': { opacity: 1, transform: [{ scale: 1.06 }, { rotate: deg(r) }] },
    '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: deg(r) }] },
  }));
export const skStamp = (r = -8) =>
  kf('skStamp' + r, () => ({
    '0%': { opacity: 0, transform: [{ scale: 1.6 }, { rotate: deg(r) }] },
    '55%': { opacity: 1, transform: [{ scale: 0.92 }, { rotate: deg(r) }] },
    '75%': { opacity: 1, transform: [{ scale: 1.04 }, { rotate: deg(r) }] },
    '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: deg(r) }] },
  }));
export const skSlap = (r = 0) =>
  kf('skSlap' + r, () => ({
    '0%': { opacity: 0, transform: [{ scale: 1.9 }, { rotate: deg(r) }] },
    '60%': { opacity: 1, transform: [{ scale: 0.93 }, { rotate: deg(r) }] },
    '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: deg(r) }] },
  }));
export const skPin = () =>
  kf('skPin', () => ({
    '0%': { opacity: 0, transform: [{ translateY: -120 }] },
    '60%': { opacity: 1, transform: [{ translateY: 4 }] },
    '80%': { opacity: 1, transform: [{ translateY: -6 }] },
    '100%': { opacity: 1, transform: [{ translateY: 0 }] },
  }));
export const skSheet = (h = 400) =>
  kf('skSheet' + h, () => ({ from: { transform: [{ translateY: h }] }, to: { transform: [{ translateY: 0 }] } }));
export const skRepaint = () =>
  kf('skRepaint', () => ({
    '0%': { transform: [{ scale: 0.84 }, { rotate: '-14deg' }] },
    '60%': { transform: [{ scale: 1.07 }, { rotate: '-3deg' }] },
    '100%': { transform: [{ scale: 1 }, { rotate: '-6deg' }] },
  }));
export const skFlip = () =>
  kf('skFlip', () => ({
    '0%': { opacity: 0, transform: [{ perspective: 800 }, { rotateY: '-100deg' }] },
    '60%': { opacity: 1, transform: [{ perspective: 800 }, { rotateY: '-40deg' }] },
    '100%': { opacity: 1, transform: [{ perspective: 800 }, { rotateY: '0deg' }] },
  }));
export const skDrop = () =>
  kf('skDrop', () => ({
    '0%': { transform: [{ translateY: -560 }, { rotate: '0deg' }] },
    '70%': { transform: [{ translateY: 12 }, { rotate: '-6deg' }] },
    '100%': { transform: [{ translateY: 0 }, { rotate: '4deg' }] },
  }));
export const skCardBack = () =>
  kf('skCardBack', () => ({
    from: { opacity: 0, transform: [{ translateY: 50 }, { scale: 0.96 }] },
    to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  }));
export const skThrowCard = () =>
  kf('skThrowCard', () => ({
    '0%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }] },
    '25%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 10 }, { scale: 0.97 }, { rotate: '-2deg' }] },
    '100%': { opacity: 0, transform: [{ translateX: 110 }, { translateY: -360 }, { scale: 0.15 }, { rotate: '-28deg' }] },
  }));
export const skPeelOff = (r = 0) =>
  kf('skPeelOff' + r, () => ({
    '0%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: deg(r) }, { scale: 1 }] },
    '30%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: -14 }, { rotate: deg(r - 12) }, { scale: 1.1 }] },
    '100%': { opacity: 0, transform: [{ translateX: 70 }, { translateY: -280 }, { rotate: deg(r + 140) }, { scale: 0.5 }] },
  }));
export const skLetter = () =>
  kf('skLetter', () => ({ from: { transform: [{ translateY: 40 }] }, to: { transform: [{ translateY: -70 }] } }));
export const skFlap = () =>
  kf('skFlap', () => ({
    from: { transform: [{ perspective: 700 }, { rotateX: '0deg' }] },
    to: { transform: [{ perspective: 700 }, { rotateX: '180deg' }] },
  }));

// --- loops --------------------------------------------------------------
export const skSpin = (dir = 1) =>
  kf('skSpin' + dir, () => ({ from: { transform: [{ rotate: '0deg' }] }, to: { transform: [{ rotate: deg(360 * dir) }] } }));
export const skWobble = (r = 0) =>
  kf('skWobble' + r, () => ({
    '0%': { transform: [{ rotate: deg(r) }] },
    '50%': { transform: [{ rotate: deg(r + 6) }] },
    '100%': { transform: [{ rotate: deg(r) }] },
  }));
export const skBob = (d = -10) =>
  kf('skBob' + d, () => ({
    '0%': { transform: [{ translateY: 0 }] },
    '50%': { transform: [{ translateY: d }] },
    '100%': { transform: [{ translateY: 0 }] },
  }));
export const skMarquee = (w: number) =>
  kf('skMarquee' + Math.round(w), () => ({ from: { transform: [{ translateX: 0 }] }, to: { transform: [{ translateX: -w }] } }));
export const skPlane = () =>
  kf('skPlane', () => ({
    from: { transform: [{ translateX: -60 }, { translateY: 120 }, { rotate: '-10deg' }] },
    to: { transform: [{ translateX: 340 }, { translateY: -30 }, { rotate: '10deg' }] },
  }));
export const skCloud = () =>
  kf('skCloud', () => ({ from: { transform: [{ translateX: -90 }] }, to: { transform: [{ translateX: 390 }] } }));
export const skBlink = () =>
  kf('skBlink', () => ({ '0%': { opacity: 1 }, '49.9%': { opacity: 1 }, '50%': { opacity: 0 }, '100%': { opacity: 0 } }));
export const skBulb = () => kf('skBulb', () => ({ '0%': { opacity: 1 }, '50%': { opacity: 0.35 }, '100%': { opacity: 1 } }));
export const skNudge = () =>
  kf('skNudge', () => ({
    '0%': { transform: [{ translateX: 0 }] },
    '50%': { transform: [{ translateX: 8 }] },
    '100%': { transform: [{ translateX: 0 }] },
  }));
export const skTwinkle = () =>
  kf('skTwinkle', () => ({
    '0%': { transform: [{ scale: 0.55 }, { rotate: '0deg' }] },
    '50%': { transform: [{ scale: 1.15 }, { rotate: '25deg' }] },
    '100%': { transform: [{ scale: 0.55 }, { rotate: '0deg' }] },
  }));
/** Sheen sweep. Percent translates are relative to the sheen's own width. */
export const skSheen = (w: number) =>
  kf('skSheen' + Math.round(w), () => ({
    '0%': { transform: [{ translateX: -1.8 * w }, { rotate: '20deg' }] },
    '55%': { transform: [{ translateX: 3.2 * w }, { rotate: '20deg' }] },
    '100%': { transform: [{ translateX: 3.2 * w }, { rotate: '20deg' }] },
  }));
export const skSlide = (from: number, to: number) =>
  kf(`skSlide${from}_${to}`, () => ({ from: { transform: [{ translateX: from }] }, to: { transform: [{ translateX: to }] } }));
export const skSwing = () =>
  kf('skSwing', () => ({
    '0%': { transform: [{ rotate: '4deg' }] },
    '50%': { transform: [{ rotate: '-3.5deg' }] },
    '100%': { transform: [{ rotate: '4deg' }] },
  }));
export const skPulse = () =>
  kf('skPulse', () => ({ from: { opacity: 0.8, transform: [{ scale: 0.4 }] }, to: { opacity: 0, transform: [{ scale: 2.6 }] } }));
export const skRingP = () =>
  kf('skRingP', () => ({ from: { opacity: 0.9, transform: [{ scale: 1 }] }, to: { opacity: 0, transform: [{ scale: 1.35 }] } }));
/** Online ring: stands in for the box-shadow spread pulse. */
export const skRing = () =>
  kf('skRing', () => ({ from: { opacity: 0.65, transform: [{ scale: 1 }] }, to: { opacity: 0, transform: [{ scale: 2.2 }] } }));
export const skDot = () =>
  kf('skDot', () => ({
    '0%': { opacity: 0.4, transform: [{ translateY: 0 }] },
    '50%': { opacity: 1, transform: [{ translateY: -4 }] },
    '100%': { opacity: 0.4, transform: [{ translateY: 0 }] },
  }));
export const skFloat = () =>
  kf('skFloat', () => ({
    '0%': { opacity: 0, transform: [{ translateY: 0 }, { scale: 0.6 }] },
    '20%': { opacity: 1, transform: [{ translateY: -22 }, { scale: 0.68 }] },
    '100%': { opacity: 0, transform: [{ translateY: -110 }, { scale: 1 }] },
  }));
export const skFall = () =>
  kf('skFall', () => ({
    from: { transform: [{ translateY: -60 }, { rotate: '0deg' }] },
    to: { transform: [{ translateY: 900 }, { rotate: '720deg' }] },
  }));
export const skJig = () =>
  kf('skJig', () => ({
    '0%': { transform: [{ rotate: '0deg' }] },
    '20%': { transform: [{ rotate: '-12deg' }] },
    '40%': { transform: [{ rotate: '10deg' }] },
    '60%': { transform: [{ rotate: '-6deg' }] },
    '80%': { transform: [{ rotate: '4deg' }] },
    '100%': { transform: [{ rotate: '0deg' }] },
  }));
export const skWiggle = () =>
  kf('skWiggle', () => ({
    '0%': { transform: [{ rotate: '0deg' }] },
    '25%': { transform: [{ rotate: '-2deg' }] },
    '75%': { transform: [{ rotate: '2deg' }] },
    '100%': { transform: [{ rotate: '0deg' }] },
  }));
export const skScan = (to = 280) =>
  kf('skScan' + to, () => ({ from: { transform: [{ translateY: -40 }] }, to: { transform: [{ translateY: to }] } }));
export const skScanQ = () =>
  kf('skScanQ', () => ({
    '0%': { transform: [{ translateY: 0 }] },
    '50%': { transform: [{ translateY: 137 }] },
    '100%': { transform: [{ translateY: 0 }] },
  }));
export const skShake = (amp = 10) =>
  kf('skShake' + amp, () => ({
    '0%': { transform: [{ translateX: 0 }] },
    '20%': { transform: [{ translateX: -amp }] },
    '40%': { transform: [{ translateX: amp * 0.9 }] },
    '60%': { transform: [{ translateX: -amp * 0.6 }] },
    '80%': { transform: [{ translateX: amp * 0.4 }] },
    '100%': { transform: [{ translateX: 0 }] },
  }));

// --- games & pocket ------------------------------------------------------
export const gpStamp = () =>
  kf('gpStamp', () => ({
    '0%': { opacity: 0, transform: [{ scale: 2.2 }, { rotate: '-14deg' }] },
    '60%': { opacity: 1, transform: [{ scale: 0.9 }, { rotate: '-8deg' }] },
    '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: '-8deg' }] },
  }));
export const gpPop = () =>
  kf('gpPop', () => ({
    '0%': { opacity: 0, transform: [{ scale: 0.6 }] },
    '70%': { opacity: 1, transform: [{ scale: 1.08 }] },
    '100%': { opacity: 1, transform: [{ scale: 1 }] },
  }));
export const gpShake = () =>
  kf('gpShake', () => ({
    '0%': { transform: [{ translateX: 0 }] },
    '20%': { transform: [{ translateX: -7 }] },
    '40%': { transform: [{ translateX: 7 }] },
    '60%': { transform: [{ translateX: -4 }] },
    '80%': { transform: [{ translateX: 4 }] },
    '100%': { transform: [{ translateX: 0 }] },
  }));
export const gpUp = (h = 520) =>
  kf('gpUp' + h, () => ({ from: { transform: [{ translateY: h }] }, to: { transform: [{ translateY: 0 }] } }));

/**
 * Build CSS-animation style props. Times are in seconds to match the
 * handoff's CSS (`skUp .5s .3s`).
 */
export function anim(
  name: ReturnType<typeof css.keyframes>,
  dur: number,
  delay = 0,
  ease: Ease = 'ease',
  iter: number | 'infinite' = 1,
  fill: 'both' | 'none' | 'forwards' | 'backwards' = 'both',
): any {
  return {
    animationName: name,
    animationDuration: `${dur}s`,
    animationDelay: `${delay}s`,
    animationTimingFunction: ease,
    animationIterationCount: iter,
    animationFillMode: fill,
  };
}

/** Shorthand for an infinite loop. */
export const loop = (name: ReturnType<typeof css.keyframes>, dur: number, delay = 0, ease: Ease = 'ease-in-out') =>
  anim(name, dur, delay, ease, 'infinite', 'both');
