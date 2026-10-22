import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { C, F } from '@/theme/tokens';
import { FRAME_WIDTH, isNativeTablet } from './frame';

export const A = Animated.View;
export const AText = Animated.Text;

type TProps = {
  f?: string;
  s?: number;
  c?: string;
  ls?: number;
  lh?: number;
  center?: boolean;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
  lines?: number;
};

/** Text with design-system font shorthands. */
export function T({ f = F.b5, s = 15, c = C.ink, ls, lh, center, style, children, lines }: TProps) {
  return (
    <Text
      numberOfLines={lines}
      allowFontScaling={false}
      style={[
        { fontFamily: f, fontSize: s, color: c, letterSpacing: ls, lineHeight: lh, textAlign: center ? 'center' : undefined },
        style,
      ]}>
      {children}
    </Text>
  );
}

type PressProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  /** Style merged in while pressed (the handoff's `style-active`). */
  pressed?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Pressable with a sticker-style pressed state. */
export function Press({ style, pressed, children, ...rest }: PressProps) {
  return (
    <Pressable {...rest} style={({ pressed: p }) => [style, p && pressed]}>
      {children}
    </Pressable>
  );
}

/** Common pressed states: push the sticker into its shadow. */
export const pushed = (d = 3, rest = 1, color: string = C.ink): ViewStyle =>
  ({ transform: [{ translateX: d }, { translateY: d }], boxShadow: `${rest}px ${rest}px 0px 0px ${color}` }) as ViewStyle;

type IconProps = {
  d: string;
  size?: number;
  color?: string;
  sw?: number;
  fill?: string;
  vb?: number;
  style?: StyleProp<ViewStyle>;
};

/** 24×24 stroke icon (round caps/joins) from a path string. */
export function Icon({ d, size = 20, color = C.ink, sw = 2, fill = 'none', vb = 24, style }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} style={style}>
      <Path d={d} fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const ICON = {
  back: 'M15 5l-7 7 7 7',
  back2: 'M15 6l-6 6 6 6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  plusSm: 'M12 6v12M6 12h12',
  check: 'M5 12.5 10 17.5 19 7',
  search: 'M20 20l-4.2-4.2M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z',
  chat: 'M20 11.5a7.5 7.5 0 0 1-10.7 6.8L4 19.5l1.3-4.9A7.5 7.5 0 1 1 20 11.5z',
  chatPlus: 'M20 11.5a7.5 7.5 0 0 1-10.7 6.8L4 19.5l1.3-4.9A7.5 7.5 0 1 1 20 11.5z M12 8.5v6M9 11.5h6',
  throw: 'M22 2L11 13 M22 2L15 22L11 13L2 9L22 2Z',
  map: 'M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z',
  games: 'M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L14.5 13h-5l-1.1 1.8A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4z',
  pocket: 'M5 4.5h14v15H5zM8 8.5h8M8 12h8M8 15.5h5',
  locate: 'M12 3l8 18-8-4-8 4z',
  addFriend: 'M12.2 8a3.2 3.2 0 1 1-6.4 0 3.2 3.2 0 0 1 6.4 0zM3.5 19a5.5 5.5 0 0 1 11 0M18 8v6M15 11h6',
  share: 'M12 15V4M8 7.5 12 3.5l4 4 M5 14v4.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V14',
  copy: 'M8 8h12v12H8z M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2',
  scan: 'M3.5 8V5.5a2 2 0 0 1 2-2H8M16 3.5h2.5a2 2 0 0 1 2 2V8M20.5 16v2.5a2 2 0 0 1-2 2H16M8 20.5H5.5a2 2 0 0 1-2-2V16 M3.5 12h17',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z',
  pencil: 'M4 20h4L19 9l-4-4L4 16z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff:
    'M3 3l18 18 M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1 M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6',
  groups:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  lock: 'M5 10.5h14v9.5H5z M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5',
  pin: 'M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  sun: 'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1',
  image: 'M4 5h16v14H4zM4 16l4.5-4.5 4 4L15 13l5 5',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  mail: 'M4 6h16v12H4z M4 7l8 6 8-6',
  replay: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
};

/** The paper-plane glyph (64×64) used for unread badges and send buttons. */
export function Plane({
  size = 12,
  fill = C.lime,
  wing,
  stroke,
  sw = 4,
}: {
  size?: number;
  fill?: string;
  wing?: string;
  stroke?: string;
  sw?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M4 30 L60 8 L38 58 L30 36 Z" fill={fill} stroke={stroke} strokeWidth={stroke ? sw : 0} strokeLinejoin="round" />
      {wing ? <Path d="M30 36 L60 8 L22 40 Z" fill={wing} stroke={stroke} strokeWidth={stroke ? sw : 0} strokeLinejoin="round" /> : null}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Layout shell / status-bar height.
// The design is drawn on a 390×844 iPhone artboard with a 47px status bar. On device we use the
// real safe-area inset. On web there's no OS status bar, so content starts a little below the top,
// and the app is shown full-screen on phones and as a centred mobile-width column on desktop.

export const IS_WEB = Platform.OS === 'web';
const WEB_TOP = 14;
/** Widest the app gets on web before it's centred as a mobile column. */
export const WEB_MAX_WIDTH = FRAME_WIDTH;

/** Status-bar height: real inset on device, a small top margin on web. */
export function useStatusBar() {
  const insets = useSafeAreaInsets();
  if (IS_WEB) return { top: Math.max(insets.top, WEB_TOP), bottom: insets.bottom };
  return { top: Math.max(insets.top, 20), bottom: insets.bottom };
}

/** Convert a design `top` (measured from the artboard top) to screen space. */
export function useY() {
  const { top } = useStatusBar();
  return (y: number) => y - 47 + top;
}

/** Web: full-bleed on phones, a centred mobile-width column on wider screens. Native: passthrough. */
/** Wide screens (iPad, desktop) show the app in a centred phone-width column — see ui/frame. On web
 * the page backdrop behind it comes from index.html; on a native tablet it's drawn here. */
export function WebShell({ children }: { children: ReactNode }) {
  if (!IS_WEB && !isNativeTablet()) return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: IS_WEB ? 'transparent' : C.cobalt }}>
      <View
        style={
          {
            flex: 1,
            width: '100%',
            maxWidth: WEB_MAX_WIDTH,
            overflow: 'hidden',
            backgroundColor: C.paper,
            boxShadow: '0 0 0 1px rgba(17,17,17,.12), 0 30px 80px rgba(10,20,80,.35)',
          } as ViewStyle
        }
      >
        {children}
      </View>
    </View>
  );
}

/** 390-wide design stage, centred horizontally, full height. Children use artboard x coordinates. */
export function Stage({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center' }}>
      <View pointerEvents="box-none" style={[{ width: 390, height: '100%' }, style]}>
        {children}
      </View>
    </View>
  );
}
