// Shared bits for the chat thread (Chat Thread · Sticker spec): keyframes, the paper plane,
// hearts, haptics and the toast.
import * as Haptics from 'expo-haptics';
import React, { useId } from 'react';
import { Platform, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';

import { anim, kf } from '@/theme/anim';

export const A = Animated.View;
export const INK = '#111111';
export const LIME = '#C9EC5A';
export const COBALT = '#2F6BFF';
export const COBALT_INK = '#2440C8';
export const OLIVE = '#4B5A43';
export const PAPER = '#FAF8F2';
export const READ_GREEN = '#5B7A2E';
export const SPRING = cubicBezier(0.2, 0.9, 0.3, 1.3);
export const SPRING_SOFT = cubicBezier(0.2, 0.9, 0.3, 1.1);
export const HEART_PATH = 'M12 21s-8-5.3-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 15.7 12 21 12 21z';
export const SEND_PATH = 'M22 2 2 9l9 4 4 9z';

export function buzz(strong = false) {
  if (Platform.OS === 'web') {
    try {
      (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(strong ? 18 : 10);
    } catch {
      // not supported
    }
    return;
  }
  Haptics.impactAsync(strong ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

const T = (o: Record<string, object>) => o;
export const ctIn = () => kf('ctIn', () => T({ '0%': { opacity: 0, transform: [{ translateY: 16 }, { scale: 0.96 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } }));
export const ctPop = (v: 'A' | 'B' = 'A') =>
  kf('ctPop' + v, () => T({ '0%': { opacity: 0, transform: [{ scale: 0.3 }] }, '65%': { opacity: 1, transform: [{ scale: 1.15 }] }, '100%': { opacity: 1, transform: [{ scale: 1 }] } }));
export const ctMine = () =>
  kf('ctMine', () =>
    T({
      '0%': { opacity: 0, transform: [{ translateX: 40 }, { translateY: 30 }, { scale: 0.6 }, { rotate: '6deg' }] },
      '65%': { opacity: 1, transform: [{ translateX: -3 }, { translateY: -2 }, { scale: 1.04 }, { rotate: '0deg' }] },
      '100%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }] },
    }),
  );
export const ctTheirs = () =>
  kf('ctTheirs', () =>
    T({
      '0%': { opacity: 0, transform: [{ translateX: -30 }, { translateY: 20 }, { scale: 0.6 }, { rotate: '-6deg' }] },
      '65%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1.04 }, { rotate: '0deg' }] },
      '100%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }] },
    }),
  );
export const ctThrowIn = () =>
  kf('ctThrowIn', () =>
    T({
      '0%': { opacity: 0, transform: [{ translateX: -360 }, { translateY: -200 }, { rotate: '-40deg' }, { scale: 0.4 }] },
      '60%': { opacity: 1, transform: [{ translateX: 10 }, { translateY: 6 }, { rotate: '4deg' }, { scale: 1.02 }] },
      '80%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '-2deg' }, { scale: 1 }] },
      '100%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] },
    }),
  );
export const ctThrowMine = () =>
  kf('ctThrowMine', () =>
    T({
      '0%': { opacity: 0, transform: [{ translateX: 300 }, { translateY: 300 }, { rotate: '30deg' }, { scale: 0.4 }] },
      '60%': { opacity: 1, transform: [{ translateX: -8 }, { translateY: -6 }, { rotate: '-3deg' }, { scale: 1 }] },
      '100%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] },
    }),
  );
export const ctGlide = () =>
  kf('ctGlide', () =>
    T({
      '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '-4deg' }] },
      '50%': { transform: [{ translateX: -6 }, { translateY: -8 }, { rotate: '3deg' }] },
      '100%': { transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '-4deg' }] },
    }),
  );
export const ctHover = () =>
  kf('ctHover', () =>
    T({
      '0%': { transform: [{ translateY: 0 }, { rotate: '-3deg' }] },
      '50%': { transform: [{ translateY: -12 }, { rotate: '2deg' }] },
      '100%': { transform: [{ translateY: 0 }, { rotate: '-3deg' }] },
    }),
  );
export const ctPoke = (v: 'A' | 'B') =>
  kf('ctPoke' + v, () =>
    T({
      '0%': { transform: [{ rotate: '0deg' }, { scale: 1 }] },
      '25%': { transform: [{ rotate: '-12deg' }, { scale: 1.06 }] },
      '60%': { transform: [{ rotate: '9deg' }, { scale: 1 }] },
      '100%': { transform: [{ rotate: '0deg' }, { scale: 1 }] },
    }),
  );
export const ctCatchPop = () =>
  kf('ctCatchPop', () =>
    T({
      '0%': { opacity: 0, transform: [{ translateX: -160 }, { translateY: 240 }, { rotate: '-30deg' }, { scale: 0.3 }] },
      '60%': { opacity: 1, transform: [{ translateX: 8 }, { translateY: -10 }, { rotate: '6deg' }, { scale: 1.08 }] },
      '100%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] },
    }),
  );
export const ctPlaneUnfold = () =>
  kf('ctPlaneUnfold', () =>
    T({
      '0%': { opacity: 1, transform: [{ translateY: 0 }, { rotate: '-20deg' }, { scale: 1 }] },
      '50%': { opacity: 1, transform: [{ translateY: -40 }, { rotate: '160deg' }, { scale: 1.3 }] },
      '100%': { opacity: 0, transform: [{ translateY: 80 }, { rotate: '360deg' }, { scale: 2.4 }] },
    }),
  );
export const ctSheetOpen = () =>
  kf('ctSheetOpen', () =>
    T({
      '0%': { opacity: 0, transform: [{ perspective: 900 }, { rotateX: '70deg' }, { scaleX: 0.3 }, { scaleY: 0.15 }] },
      '55%': { opacity: 1, transform: [{ perspective: 900 }, { rotateX: '-8deg' }, { scaleX: 1.02 }, { scaleY: 1 }] },
      '100%': { opacity: 1, transform: [{ perspective: 900 }, { rotateX: '0deg' }, { scaleX: 1 }, { scaleY: 1 }] },
    }),
  );
/** A folded letter flicked away: it shoots up off the top of the screen. */
export const ctFlyAway = () =>
  kf('ctFlyAway', () =>
    T({
      '0%': { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { rotate: '0deg' }, { scale: 1 }] },
      '20%': { opacity: 1, transform: [{ translateY: 30 }, { translateX: -6 }, { rotate: '4deg' }, { scale: 1.03 }] },
      '100%': { opacity: 0, transform: [{ translateY: -900 }, { translateX: 60 }, { rotate: '-18deg' }, { scale: 0.45 }] },
    }),
  );
export const ctFadeOut = () => kf('ctFadeOut', () => T({ '0%': { opacity: 1 }, '100%': { opacity: 0 } }));
export const ctFade = () => kf('ctFade', () => T({ '0%': { opacity: 0 }, '100%': { opacity: 1 } }));
export const ctStamp = () =>
  kf('ctStamp', () =>
    T({
      '0%': { opacity: 0, transform: [{ scale: 2.2 }, { rotate: '-20deg' }] },
      '60%': { opacity: 1, transform: [{ scale: 0.92 }, { rotate: '-6deg' }] },
      '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: '-6deg' }] },
    }),
  );
export const ctInk = () =>
  kf('ctInk', () => T({ '0%': { opacity: 0, transform: [{ translateY: 4 }, { scale: 0.96 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } }));
export const ctPolaroid = (r: number) =>
  kf('ctPolaroid' + r, () =>
    T({
      '0%': { opacity: 0, transform: [{ translateY: -40 }, { scale: 1.3 }, { rotate: '-14deg' }] },
      '65%': { opacity: 1, transform: [{ translateY: 4 }, { scale: 0.97 }, { rotate: `${r + 3}deg` }] },
      '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }, { rotate: `${r}deg` }] },
    }),
  );
export const ctDrawLine = () => kf('ctDrawLine', () => T({ '0%': { transform: [{ scaleX: 0 }] }, '100%': { transform: [{ scaleX: 1 }] } }));
export const ctHeartUp = (r: number, s: number) =>
  kf(`ctHeartUp${r}_${s}`, () =>
    T({
      '0%': { opacity: 0, transform: [{ translateY: 0 }, { scale: 0.3 }, { rotate: '0deg' }] },
      '25%': { opacity: 1, transform: [{ translateY: -30 }, { scale: s }, { rotate: `${r}deg` }] },
      '100%': { opacity: 0, transform: [{ translateY: -150 }, { scale: s }, { rotate: `${-r}deg` }] },
    }),
  );
export const ctBigHeart = () =>
  kf('ctBigHeart', () =>
    T({
      '0%': { opacity: 0, transform: [{ scale: 0.3 }, { translateY: 0 }] },
      '30%': { opacity: 1, transform: [{ scale: 1.3 }, { translateY: 0 }] },
      '100%': { opacity: 0, transform: [{ scale: 1 }, { translateY: -40 }] },
    }),
  );
export const ctHeartChip = () =>
  kf('ctHeartChip', () =>
    T({
      '0%': { opacity: 0, transform: [{ scale: 0.2 }] },
      '40%': { opacity: 1, transform: [{ scale: 1.5 }] },
      '70%': { opacity: 1, transform: [{ scale: 0.9 }] },
      '100%': { opacity: 1, transform: [{ scale: 1 }] },
    }),
  );
export const ctPicker = () =>
  kf('ctPicker', () => T({ '0%': { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.6 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } }));
export const ctDots = () =>
  kf('ctDots', () =>
    T({
      '0%': { opacity: 0.35, transform: [{ translateY: 0 }] },
      '30%': { opacity: 1, transform: [{ translateY: -5 }] },
      '60%': { opacity: 0.35, transform: [{ translateY: 0 }] },
      '100%': { opacity: 0.35, transform: [{ translateY: 0 }] },
    }),
  );
export const ctSendFly = () =>
  kf('ctSendFly', () =>
    T({
      '0%': { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }, { scale: 1 }] },
      '100%': { opacity: 0, transform: [{ translateX: 60 }, { translateY: -380 }, { rotate: '-20deg' }, { scale: 0.4 }] },
    }),
  );
export const ctJig = (v: 'A' | 'B') =>
  kf('ctJig' + v, () =>
    T({
      '0%': { transform: [{ translateX: 0 }] },
      '25%': { transform: [{ translateX: -6 }] },
      '50%': { transform: [{ translateX: 6 }] },
      '75%': { transform: [{ translateX: -3 }] },
      '100%': { transform: [{ translateX: 0 }] },
    }),
  );
export const ctTrayPop = () =>
  kf('ctTrayPop', () => T({ '0%': { opacity: 0, transform: [{ scale: 0.6 }, { translateY: 16 }] }, '100%': { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] } }));
export const ctTray = () => kf('ctTray', () => T({ '0%': { opacity: 0, transform: [{ translateY: 20 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }] } }));
export const ctToast = () =>
  kf('ctToast', () => T({ '0%': { opacity: 0, transform: [{ translateY: -14 }, { scale: 0.85 }] }, '100%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] } }));
export const ctFlash = () => kf('ctFlash', () => T({ '0%': { opacity: 1 }, '100%': { opacity: 0 } }));
export const ctPhone = () =>
  kf('ctPhone', () =>
    T({
      '0%': { transform: [{ rotate: '0deg' }] },
      '20%': { transform: [{ rotate: '-16deg' }] },
      '40%': { transform: [{ rotate: '16deg' }] },
      '60%': { transform: [{ rotate: '-16deg' }] },
      '80%': { transform: [{ rotate: '16deg' }] },
      '100%': { transform: [{ rotate: '0deg' }] },
    }),
  );
export const ctStreak = (v: 'A' | 'B') =>
  kf('ctStreak' + v, () =>
    T({
      '0%': { transform: [{ scale: 1 }, { rotate: '0deg' }] },
      '40%': { transform: [{ scale: 1.3 }, { rotate: v === 'A' ? '-6deg' : '6deg' }] },
      '100%': { transform: [{ scale: 1 }, { rotate: '0deg' }] },
    }),
  );
export const ctArrowUp = () =>
  kf('ctArrowUp', () => T({ '0%': { transform: [{ translateY: 0 }] }, '50%': { transform: [{ translateY: -6 }] }, '100%': { transform: [{ translateY: 0 }] } }));
export const ctPulsePlay = () =>
  kf('ctPulsePlay', () => T({ '0%': { transform: [{ scale: 1 }] }, '50%': { transform: [{ scale: 1.12 }] }, '100%': { transform: [{ scale: 1 }] } }));
export const ctReadIn = () => kf('ctReadIn', () => T({ '0%': { opacity: 0.6, transform: [{ scale: 0.98 }] }, '100%': { opacity: 1, transform: [{ scale: 1 }] } }));

/** The design's folded paper plane (130×118 artboard). */
/** `dark` = a letter thrown on dark (night) paper. */
export function PaperPlaneArt({ width, dark = false }: { width: number; dark?: boolean }) {
  const id = 'pp' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width={width} height={(width * 118) / 130} viewBox="0 0 130 118" style={{ overflow: 'visible' }}>
      <Defs>
        <LinearGradient id={id + 'l'} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={dark ? '#5A5A5D' : '#FFFFFF'} />
          <Stop offset="1" stopColor={dark ? '#454547' : '#EDEDEF'} />
        </LinearGradient>
        <LinearGradient id={id + 'r'} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={dark ? '#4A4A4C' : '#F6F6F7'} />
          <Stop offset="1" stopColor={dark ? '#2F2F31' : '#D9D9DD'} />
        </LinearGradient>
      </Defs>
      <Polygon points="68,10 128,48 120,98 76,102" fill="rgba(40,44,70,.05)" />
      <Polygon points="66,8 126,46 118,96 74,100" fill="rgba(40,44,70,.07)" />
      <Polygon points="60,4 61,112 63,112 62,96" fill={dark ? '#262628' : '#C8C8CC'} />
      <Polygon points="60,4 4,90 58,95" fill={`url(#${id}l)`} stroke="rgba(0,0,0,.07)" strokeWidth={0.8} strokeLinejoin="round" />
      <Polygon points="60,4 62,96 118,90" fill={`url(#${id}r)`} stroke="rgba(0,0,0,.07)" strokeWidth={0.8} strokeLinejoin="round" />
      <Path d="M60 4 L58.5 95" stroke="rgba(0,0,0,.18)" strokeWidth={1.1} />
      <Path d="M60.6 6 L61.6 95" stroke={dark ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.9)'} strokeWidth={0.8} />
      <Path d="M60 4 L26 92" stroke="rgba(0,0,0,.045)" strokeWidth={1} />
      <Path d="M60 4 L92 93" stroke="rgba(0,0,0,.06)" strokeWidth={1} />
    </Svg>
  );
}

export function Heart({ size, fill = '#FF5C8A' }: { size: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={HEART_PATH} fill={fill} stroke={INK} strokeWidth={1.4} />
    </Svg>
  );
}

/** Black pill toast with a lime hard shadow, dropping in under the header. */
export function Toast({ text, top }: { text: string; top: number }) {
  return (
    <A pointerEvents="none" style={[styles.toastWrap, { top }]}>
      <A style={[styles.toast, anim(ctToast(), 0.3, 0, SPRING)]}>
        <Text style={styles.toastText}>{text}</Text>
      </A>
    </A>
  );
}

export const mono = (size: number, color = 'rgba(17,17,17,.6)', spacing = 1): TextStyle => ({ fontFamily: 'SpaceMono_400Regular', fontSize: size, letterSpacing: spacing, color });

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 45 },
  toast: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: INK, boxShadow: `3px 3px 0 ${LIME}` } as ViewStyle,
  toastText: { fontFamily: 'Figtree_700Bold', fontSize: 13.5, color: '#fff' },
});
