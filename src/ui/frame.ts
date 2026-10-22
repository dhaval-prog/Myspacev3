// iPad / desktop support. Myspace is designed for a phone, so on wide screens (tablets, desktop
// browsers) the app runs in a centred phone-width column instead of stretching. This module makes
// the rest of the app *believe* the window is that column: every `Dimensions.get('window')` and
// `useWindowDimensions()` reports the column's width, so screens that size things from the window
// (carousels, overlays, weather effects, the letter) lay out exactly as they do on a phone.
//
// Imported first thing in the root layout, before any screen reads the window size.
import { Dimensions, Platform } from 'react-native';

/** Width of the app column on wide screens (matches the web launch screen's column). */
export const FRAME_WIDTH = 480;
/** Windows at least this wide get the centred column; anything narrower is a phone and fills it. */
export const WIDE_BREAKPOINT = 600;

type Win = { width: number; height: number; scale: number; fontScale: number };

export function isWideWindow(width: number) {
  return width >= WIDE_BREAKPOINT;
}

let last: { src: Win; out: Win } | null = null;
function framed(win: Win): Win {
  if (!win || !isWideWindow(win.width)) return win;
  // Same input → same object, so hooks holding the result don't re-render for nothing.
  if (last && last.src === win) return last.out;
  const out = { ...win, width: Math.min(win.width, FRAME_WIDTH) };
  last = { src: win, out };
  return out;
}

type Handler = (dims: { window: Win; screen: Win }) => void;
const D = Dimensions as unknown as {
  get: (d: 'window' | 'screen') => Win;
  addEventListener: (type: 'change', h: Handler) => { remove: () => void };
  removeEventListener?: (type: 'change', h: Handler) => void;
  __framed?: boolean;
};

if (!D.__framed) {
  D.__framed = true;
  const get = D.get.bind(Dimensions);
  const add = D.addEventListener.bind(Dimensions);
  const remove = D.removeEventListener?.bind(Dimensions);
  const wrapped = new WeakMap<Handler, Handler>();
  D.get = (d) => (d === 'window' ? framed(get('window')) : get(d));
  D.addEventListener = (type, h) => {
    const w: Handler = (dims) => h({ ...dims, window: framed(dims.window) });
    wrapped.set(h, w);
    return add(type, w);
  };
  if (remove) D.removeEventListener = (type, h) => remove(type, wrapped.get(h) ?? h);
}

/** Native tablets: whether to show the centred column (web does this in CSS + WebShell). */
export function isNativeTablet() {
  if (Platform.OS === 'web') return false;
  const { width, height } = Dimensions.get('screen');
  // A tablet's *short* side is still wide; a phone's never is (even in landscape).
  return Math.min(width, height) >= WIDE_BREAKPOINT;
}
