// Local, device-only state: the sign-up draft (before an account exists) and a few UI choices.
// All real data — profiles, friends, chats, Pocket, games, Throw — comes from Supabase through
// the contexts in src/v2/context (the same backend as Myspace v2).
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { C } from '@/theme/tokens';

// Avatar swatches: [bg, fg] + label.
export const SWATCHES: [string, string][] = [
  [C.sun, C.ink],
  [C.tomato, '#fff'],
  [C.cobalt, '#fff'],
  ['#111111', C.sun],
  ['#FFFFFF', C.ink],
  [C.sky, C.ink],
  [C.bubblegum, C.ink],
  [C.mint, C.ink],
];
export const SWATCH_NAMES = ['SUNNY', 'TOMATO', 'COBALT', 'INK', 'PAPER', 'SKY', 'BUBBLEGUM', 'MINT'];

type State = {
  /** Sign-up draft. */
  name: string;
  email: string;
  pw: string;
  /** Log-in form. */
  lpw: string;
  /** Avatar colour index into SWATCHES (saved to the account's metadata after sign-up). */
  av: number;
  /** Local photo picked during onboarding, uploaded once a session exists. */
  photo: string | null;
  /** Route to land on after the next sign-in (e.g. '/success' right after sign-up). */
  afterAuth: string | null;
};

const initial: State = { name: '', email: '', pw: '', lpw: '', av: 0, photo: null, afterAuth: null };

type Store = State & {
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const set = useCallback<Store['set']>(
    (patch) => setS((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) })),
    [],
  );
  const value = useMemo(() => ({ ...s, set }), [s, set]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

export const initialsOf = (name: string) =>
  (name || '?')
    .replace(/[^\p{L} ]/gu, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

export const firstOf = (name: string) => (name || 'friend').trim().split(/\s+/)[0];
