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

/** Suggested people: [name, handle, bg, fg, why]. Mock data — wire to the API. */
export const PEOPLE: [string, string, string, string, string][] = [
  ['Priya Sharma', 'priya', C.sun, C.ink, '3 mutual'],
  ['Aarav Kapoor', 'aarav.k', C.tomato, '#fff', 'in contacts'],
  ['Meera Iyer', 'meera', C.mint, C.ink, 'nearby'],
  ['Kabir Shah', 'kabir', C.bubblegum, C.ink, '2 mutual'],
  ['Ananya Rao', 'ananya', C.sky, C.ink, 'in contacts'],
];

export type Tx = [title: string, who: string, amount: number, when: string];

export type PocketCard = {
  label: string;
  meta: string;
  budget: number;
  bg: string;
  ink: string;
  art: string;
  tx: Tx[];
};

export const POCKET_CARDS: PocketCard[] = [
  {
    label: 'Groceries',
    meta: 'MONTHLY · RESETS 1ST',
    budget: 12000,
    bg: C.sun,
    ink: C.ink,
    art: '#fff',
    tx: [
      ['Big Basket', 'You', 2340, 'Today'],
      ['Milk & bread', 'You', 180, 'Today'],
      ['Zepto', 'Priya', 1460, 'Yesterday'],
      ['Farmers market', 'You', 1600, 'Oct 15'],
    ],
  },
  {
    label: 'Goa Trip ’26',
    meta: 'SHARED · 4 MEMBERS',
    budget: 60000,
    bg: C.cobalt,
    ink: '#fff',
    art: C.sun,
    tx: [
      ['Villa deposit', 'Aarav', 15000, 'Oct 12'],
      ['Flights', 'You', 18400, 'Oct 10'],
      ['Scooter rental', 'Meera', 2000, 'Oct 9'],
    ],
  },
  {
    label: 'Eating out',
    meta: 'MONTHLY · RESETS 1ST',
    budget: 5000,
    bg: C.tomato,
    ink: '#fff',
    art: C.lime,
    tx: [
      ['Toit', 'You', 1450, 'Sat'],
      ['Chai Point', 'You', 240, 'Fri'],
      ['Swiggy', 'Priya', 960, 'Thu'],
    ],
  },
  {
    label: 'Flat expenses',
    meta: 'SHARED · 3 MEMBERS',
    budget: 25000,
    bg: C.lime,
    ink: C.ink,
    art: C.tomato,
    tx: [
      ['Electricity', 'Meera', 3200, 'Oct 14'],
      ['Wi-Fi', 'You', 1200, 'Oct 5'],
      ['Cleaning', 'Aarav', 2500, 'Oct 2'],
    ],
  },
  { label: 'Gym & health', meta: 'MONTHLY · RESETS 15TH', budget: 3000, bg: '#fff', ink: C.ink, art: C.cobalt, tx: [['Cult pass', 'You', 1200, 'Oct 15']] },
];

type State = {
  name: string;
  handle: string;
  email: string;
  pw: string;
  lpw: string;
  av: number;
  photo: string | null;
  fadd: Record<number, boolean>;
  readMap: Record<string, boolean>;
  thSel: number;
  thStreak: number;
  pocketAdd: Record<number, Tx[]>;
};

const initial: State = {
  name: 'Dhaval Patel',
  handle: 'dhaval',
  email: 'dhaval@myspace.app',
  pw: '',
  lpw: 'secret123',
  av: 0,
  photo: null,
  fadd: {},
  readMap: {},
  thSel: 2,
  thStreak: 6,
  pocketAdd: {},
};

type Store = State & {
  set: (patch: Partial<State> | ((s: State) => Partial<State>)) => void;
  toggleFriend: (i: number) => void;
  markRead: (name: string) => void;
  addTx: (card: number, tx: Tx) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const set = useCallback<Store['set']>(
    (patch) => setS((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) })),
    [],
  );
  const toggleFriend = useCallback((i: number) => setS((p) => ({ ...p, fadd: { ...p.fadd, [i]: !p.fadd[i] } })), []);
  const markRead = useCallback((n: string) => setS((p) => ({ ...p, readMap: { ...p.readMap, [n]: true } })), []);
  const addTx = useCallback(
    (card: number, tx: Tx) => setS((p) => ({ ...p, pocketAdd: { ...p.pocketAdd, [card]: [tx, ...(p.pocketAdd[card] || [])] } })),
    [],
  );
  const value = useMemo(() => ({ ...s, set, toggleFriend, markRead, addTx }), [s, set, toggleFriend, markRead, addTx]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

export const initialsOf = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const firstOf = (name: string) => (name || 'friend').trim().split(/\s+/)[0];

/** Derived pocket card values (budget left, spent, all transactions). */
export function usePocket() {
  const { pocketAdd } = useStore();
  return POCKET_CARDS.map((c, i) => {
    const all = [...(pocketAdd[i] || []), ...c.tx];
    const spent = all.reduce((a, t) => a + t[2], 0);
    return { ...c, all, spent, left: Math.max(0, c.budget - spent) };
  });
}
