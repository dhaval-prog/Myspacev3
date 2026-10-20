// Design tokens from the "Sticker pop" handoff.

export const C = {
  paper: '#F4EFE3',
  ink: '#111111',
  deep: '#16210C', // app-style screens (chats, add friend, sign up)
  cobalt: '#2B4BFF',
  tomato: '#FF4F2E',
  sun: '#FFD23F',
  lime: '#C3EA4F',
  white: '#FFFFFF',
  sky: '#9EB3FF',
  bubblegum: '#FFB4C8',
  mint: '#7FE0A6',
  coral: '#FF8A6B',
  ice: '#EDFDFF',
  cream: '#FFFDF7',
  mapBg: '#E4EBDD',
  park: '#B9D99A',
  locate: '#2F6BFF',
  ink55: 'rgba(17,17,17,.55)',
  ink60: 'rgba(17,17,17,.6)',
  ink62: 'rgba(17,17,17,.62)',
  deep55: 'rgba(22,33,12,.55)',
} as const;

// Font families (loaded in the root layout). Custom fonts carry their own weight,
// so never combine these with fontWeight.
export const F = {
  d7: 'BricolageGrotesque_700Bold',
  d8: 'BricolageGrotesque_800ExtraBold',
  m4: 'SpaceMono_400Regular',
  m7: 'SpaceMono_700Bold',
  b4: 'Figtree_400Regular',
  b5: 'Figtree_500Medium',
  b6: 'Figtree_600SemiBold',
  b7: 'Figtree_700Bold',
  b8: 'Figtree_800ExtraBold',
  b4i: 'Figtree_400Regular_Italic',
  dm4: 'DMMono_400Regular',
  dm5: 'DMMono_500Medium',
  cav5: 'Caveat_500Medium',
  cav7: 'Caveat_700Bold',
} as const;

/** Figtree family for a CSS weight. */
export const fig = (w: number | string): string => {
  const n = Number(w);
  if (n >= 800) return F.b8;
  if (n >= 700) return F.b7;
  if (n >= 600) return F.b6;
  if (n >= 500) return F.b5;
  return F.b4;
};

/** Dot-grid paper background (CSS gradient, native in RN 0.88+). */
export const dots = (alpha = 0.07, size = 18, rgb = '17,17,17', r = 1) => ({
  backgroundImage: `radial-gradient(circle, rgba(${rgb},${alpha}) ${r}px, transparent ${r}px)`,
  backgroundSize: `${size}px ${size}px`,
});

/** Hard offset shadow, no blur. */
export const hard = (x: number, y = x, color: string = C.ink) => ({
  boxShadow: `${x}px ${y}px 0px 0px ${color}`,
});

/** ₹ + Indian digit grouping. */
export const inr = (n: number) => '₹' + groupIN(n);

/** Indian digit grouping (1,23,456) without relying on Intl. */
export function groupIN(n: number): string {
  const s = String(Math.round(Math.abs(n)));
  const sign = n < 0 ? '-' : '';
  if (s.length <= 3) return sign + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return sign + rest + ',' + last3;
}
