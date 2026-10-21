// Keyframes from the "Account Settings v4 – Sticker" handoff, ported 1:1 (names prefixed `ac`).
// Durations, delays and easing curves are set where each one is used, as in the handoff.
import { kf } from './anim';

const t = (x = 0, y = 0) => [{ translateX: x }, { translateY: y }];

export const acUp = () => kf('acUp', () => ({ '0%': { transform: [{ translateY: 16 }], opacity: 0 }, '100%': { transform: [{ translateY: 0 }], opacity: 1 } }));
/** Toast pop (the handoff centres it with translateX(-50%); here the toast is centred by layout). */
export const acPop = () =>
  kf('acPop', () => ({
    '0%': { transform: [{ scale: 0.6 }], opacity: 0 },
    '70%': { transform: [{ scale: 1.06 }] },
    '100%': { transform: [{ scale: 1 }], opacity: 1 },
  }));
export const acStamp = () =>
  kf('acStamp', () => ({
    '0%': { transform: [{ scale: 2.2 }, { rotate: '-14deg' }], opacity: 0 },
    '60%': { transform: [{ scale: 0.9 }, { rotate: '-8deg' }], opacity: 1 },
    '100%': { transform: [{ scale: 1 }, { rotate: '-8deg' }], opacity: 1 },
  }));
export const acSheet = (h = 900) => kf('acSheet' + h, () => ({ '0%': { transform: [{ translateY: h }] }, '100%': { transform: [{ translateY: 0 }] } }));
export const acFade = () => kf('acFade', () => ({ '0%': { opacity: 0 }, '100%': { opacity: 1 } }));
/** Wobble; the A/B copies let a re-trigger restart it. */
export const acWob = (v: 'A' | 'B') =>
  kf('acWob' + v, () => ({
    '0%': { transform: [{ rotate: '-6deg' }, { scale: 1 }] },
    '30%': { transform: [{ rotate: '4deg' }, { scale: 1.12 }] },
    '60%': { transform: [{ rotate: '-9deg' }, { scale: 0.96 }] },
    '100%': { transform: [{ rotate: '-6deg' }, { scale: 1 }] },
  }));
export const acFly = (v: 'A' | 'B') =>
  kf('acFly' + v, () => ({
    '0%': { transform: [...t(-120, 40), { rotate: '-20deg' }], opacity: 0 },
    '60%': { transform: [...t(8, -6), { rotate: '6deg' }], opacity: 1 },
    '100%': { transform: [...t(0, 0), { rotate: '0deg' }], opacity: 1 },
  }));
export const acBob = () =>
  kf('acBob', () => ({
    '0%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
    '50%': { transform: [{ translateY: -5 }, { rotate: '-4deg' }] },
    '100%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
  }));
export const acTwinkle = () =>
  kf('acTwinkle', () => ({
    '0%': { opacity: 0.25, transform: [{ scale: 0.7 }] },
    '50%': { opacity: 1, transform: [{ scale: 1 }] },
    '100%': { opacity: 0.25, transform: [{ scale: 0.7 }] },
  }));
export const acShake = (v: 'A' | 'B' = 'A') =>
  kf('acShake' + v, () => ({
    '0%': { transform: [{ translateX: 0 }] },
    '20%': { transform: [{ translateX: -7 }] },
    '40%': { transform: [{ translateX: 7 }] },
    '60%': { transform: [{ translateX: -4 }] },
    '80%': { transform: [{ translateX: 4 }] },
    '100%': { transform: [{ translateX: 0 }] },
  }));
export const acOutR = () =>
  kf('acOutR', () => ({ '0%': { transform: [{ translateX: 0 }, { rotate: '0deg' }], opacity: 1 }, '100%': { transform: [{ translateX: 420 }, { rotate: '10deg' }], opacity: 0 } }));
export const acOutL = () =>
  kf('acOutL', () => ({ '0%': { transform: [{ translateX: 0 }, { rotate: '0deg' }], opacity: 1 }, '100%': { transform: [{ translateX: -420 }, { rotate: '-10deg' }], opacity: 0 } }));
export const acCrumple = () =>
  kf('acCrumple', () => ({
    '0%': { transform: [{ scale: 1 }, { rotate: '0deg' }], opacity: 1 },
    '40%': { transform: [{ scale: 1.04 }, { rotate: '-3deg' }], opacity: 1 },
    '100%': { transform: [{ scale: 0.2 }, { rotate: '20deg' }], opacity: 0 },
  }));
export const acPopIn = () =>
  kf('acPopIn', () => ({ '0%': { transform: [{ scale: 0.5 }], opacity: 0 }, '70%': { transform: [{ scale: 1.05 }], opacity: 1 }, '100%': { transform: [{ scale: 1 }], opacity: 1 } }));
/** One confetti piece flying from the origin to (dx, dy) while spinning. */
export const acConfetti = (dx: number, dy: number, rot: number) =>
  kf(`acConfetti${dx},${dy},${rot}`, () => ({
    '0%': { transform: [...t(0, 0), { scale: 0.3 }, { rotate: '0deg' }], opacity: 1 },
    '100%': { transform: [...t(dx, dy), { scale: 1 }, { rotate: `${rot}deg` }], opacity: 0 },
  }));
export const acNudge = () =>
  kf('acNudge', () => ({ '0%': { transform: [{ rotate: '0deg' }] }, '25%': { transform: [{ rotate: '-6deg' }] }, '75%': { transform: [{ rotate: '6deg' }] }, '100%': { transform: [{ rotate: '0deg' }] } }));
export const acFall = () =>
  kf('acFall', () => ({ '0%': { transform: [{ translateY: 0 }, { rotate: '0deg' }], opacity: 1 }, '100%': { transform: [{ translateY: 170 }, { rotate: '35deg' }], opacity: 0 } }));
export const acWave = () =>
  kf('acWave', () => ({ '0%': { transform: [{ rotate: '-8deg' }] }, '50%': { transform: [{ rotate: '8deg' }] }, '100%': { transform: [{ rotate: '-8deg' }] } }));
export const acPeel = () =>
  kf('acPeel', () => ({
    '0%': { transform: [{ rotate: '0deg' }, ...t(0, 0)], opacity: 1 },
    '25%': { transform: [{ rotate: '-16deg' }, ...t(-8, -12)], opacity: 1 },
    '100%': { transform: [{ rotate: '70deg' }, ...t(60, 600)], opacity: 0 },
  }));
export const acShackle = () =>
  kf('acShackle', () => ({ '0%': { transform: [{ translateY: -5 }] }, '45%': { transform: [{ translateY: -5 }] }, '75%': { transform: [{ translateY: 1 }] }, '100%': { transform: [{ translateY: 0 }] } }));
export const acDots = () =>
  kf('acDots', () => ({
    '0%': { transform: [{ translateY: 0 }], opacity: 0.4 },
    '30%': { transform: [{ translateY: -4 }], opacity: 1 },
    '60%': { transform: [{ translateY: 0 }], opacity: 0.4 },
    '100%': { transform: [{ translateY: 0 }], opacity: 0.4 },
  }));
