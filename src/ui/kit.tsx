import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, G, Line, Path, Pattern, Rect, type PathProps } from 'react-native-svg';

import { anim, loop, skSheen, skSpin } from '@/theme/anim';
import { C } from '@/theme/tokens';
import { A, T } from './primitives';

const APath = Animated.createAnimatedComponent(Path);

/**
 * Diagonal light sweep (skSheen). `w`/`h` are the sheen's own size; it sits
 * inside an overflow-hidden parent.
 */
export function Sheen({
  w,
  h,
  top = 0,
  dur,
  delay = 1,
  alpha = 0.55,
}: {
  w: number;
  h: number;
  top?: number;
  dur: number;
  delay?: number;
  alpha?: number;
}) {
  return (
    <A
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top,
          width: w,
          height: h,
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,${alpha}), rgba(255,255,255,0))`,
        } as ViewStyle,
        loop(skSheen(w), dur, delay),
      ]}
    />
  );
}

/**
 * skDraw: stroke draws on (0→35%), holds (→82%), then fades (→100%), looping.
 */
export function DrawPath({
  len,
  dur,
  delay = 0,
  once = false,
  ...props
}: PathProps & { len: number; dur: number; delay?: number; once?: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    const t = withTiming(1, { duration: dur * 1000, easing: Easing.inOut(Easing.ease) });
    p.value = withDelay(delay * 1000, once ? t : withRepeat(t, -1, false));
  }, [dur, delay, once, p]);
  const ap = useAnimatedProps(() => {
    const v = p.value;
    if (once) return { strokeDashoffset: len * (1 - v), strokeOpacity: 1 };
    const off = v < 0.35 ? len * (1 - v / 0.35) : 0;
    const op = v < 0.82 ? 1 : 1 - (v - 0.82) / 0.18;
    return { strokeDashoffset: off, strokeOpacity: op };
  });
  return <APath {...props} strokeDasharray={[len, len]} animatedProps={ap} />;
}

/** skDash: marching dashes along a path. */
export function MarchPath({ period = 18, dur = 1.2, ...props }: PathProps & { period?: number; dur?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: dur * 1000, easing: Easing.linear }), -1, false);
  }, [dur, p]);
  const ap = useAnimatedProps(() => ({ strokeDashoffset: -period * p.value }));
  return <APath {...props} animatedProps={ap} />;
}

/** Spinner ring (skSpinFast). */
export function Spinner({ size = 18, color = C.sun, track = 'rgba(255,210,63,.3)' }: { size?: number; color?: string; track?: string }) {
  return (
    <A
      style={[
        { width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderColor: track, borderTopColor: color },
        anim(skSpin(1), 0.7, 0, 'linear', 'infinite'),
      ]}
    />
  );
}

/**
 * Text with an ink outline + hard drop shadow (CSS -webkit-text-stroke +
 * text-shadow). The outline is faked with offset copies so it lays out like
 * normal text on every platform.
 */
export function OutlinedText({
  children,
  style,
  color,
  stroke = C.ink,
  sw = 1.4,
  shadow = 4,
}: {
  children: ReactNode;
  style: StyleProp<TextStyle>;
  color: string;
  stroke?: string;
  sw?: number;
  shadow?: number;
}) {
  const offs: [number, number][] = [];
  for (let a = 0; a < 360; a += 45) {
    const r = (a * Math.PI) / 180;
    offs.push([Math.round(Math.cos(r) * sw * 100) / 100, Math.round(Math.sin(r) * sw * 100) / 100]);
  }
  const copy = (x: number, y: number, k: string) => (
    <T key={k} style={[style, { position: 'absolute', left: x, top: y, color: stroke }]}>
      {children}
    </T>
  );
  return (
    <View>
      {shadow ? offs.map(([x, y], i) => copy(x + shadow, y + shadow, 's' + i)) : null}
      {offs.map(([x, y], i) => copy(x, y, 'o' + i))}
      <T style={[style, { color }]}>{children}</T>
    </View>
  );
}

/** Repeating diagonal (or straight) stripes via an SVG pattern. */
export function Stripes({
  angle = 45,
  color,
  width,
  gap,
  style,
}: {
  angle?: number;
  color: string;
  width: number;
  gap: number;
  style?: StyleProp<ViewStyle>;
}) {
  const id = `st${angle}${width}${gap}${color.replace(/[^a-z0-9]/gi, '')}`;
  const p = width + gap;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={p} height={p} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle})`}>
            <Rect x={0} y={0} width={width} height={p} fill={color} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Barcode strip (the pass footer). */
export function Barcode({ height = 30 }: { height?: number }) {
  return (
    <Svg width="100%" height={height}>
      <Defs>
        <Pattern id="barcode" width={17} height={height} patternUnits="userSpaceOnUse">
          <Rect x={0} y={0} width={2} height={height} fill="#111" />
          <Rect x={4} y={0} width={1} height={height} fill="#111" />
          <Rect x={8} y={0} width={3} height={height} fill="#111" />
          <Rect x={13} y={0} width={1} height={height} fill="#111" />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height={height} fill="url(#barcode)" />
    </Svg>
  );
}

/** Animated-width fill inside a track (progress bars). */
export function Fill({ pct, color, ms = 400, style }: { pct: number; color: string; ms?: number; style?: StyleProp<ViewStyle> }) {
  const w = useSharedValue(pct);
  useEffect(() => {
    w.value = withTiming(pct, { duration: ms, easing: Easing.bezier(0.2, 0.8, 0.3, 1) });
  }, [pct, ms, w]);
  const st = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return <Animated.View style={[{ height: '100%', backgroundColor: color }, style, st]} />;
}

/** Twinkle star path (4-point) used on splash/avatar/welcome. */
export const STAR4 = 'M12 1 L14.5 9.5 L23 12 L14.5 14.5 L12 23 L9.5 14.5 L1 12 L9.5 9.5 Z';

export { G, Line };
