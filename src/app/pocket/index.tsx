// P1 Pocket cards — your real budget cards (owned + shared), stacked; tap one to open it.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, type ViewStyle } from 'react-native';

import { useMyProfile } from '@/state/profile';
import { initialsOf } from '@/state/store';
import { E } from '@/theme/anim';
import { C, dots, F, hard, inr } from '@/theme/tokens';
import { A, Press, T, useStatusBar, useY } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';
import { useExpenses } from '@/v2/context/ExpensesContext';
import { parseAmount } from '@/v2/utils/expensesFormat';

export default function Pocket() {
  const { top } = useStatusBar();
  const y = useY();
  const { profile } = useMyProfile();
  const { deck, expensesFor, loading } = useExpenses();
  const [sel, setSel] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (t.current && clearTimeout(t.current)), []);

  const cards = deck.map((card) => {
    const spent = expensesFor(card).reduce((s, x) => s + parseAmount(x.amt), 0);
    const budget = parseAmount(card.amount);
    return { card, spent, budget, left: Math.max(0, budget - spent) };
  });
  const total = cards.reduce((a, c) => a + c.spent, 0);
  const selected = sel ?? cards[0]?.card.id ?? null;

  const open = (id: string) => {
    setSel(id);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => router.push({ pathname: '/pocket/[id]', params: { id } }), 350);
  };

  return (
    <Screen style={{ backgroundColor: C.paper, ...(dots(0.07, 16) as ViewStyle) }}>
      <View style={{ paddingTop: top + 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T f={F.d8} s={36} ls={-1.4}>
          Pocket
        </T>
        <Press
          onPress={() => router.push('/account')}
          accessibilityLabel="Account settings"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.tomato, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...hard(2) }}>
          <T f={F.b8} s={14} c="#fff">
            {initialsOf(profile?.name ?? '')}
          </T>
        </Press>
      </View>
      <View
        style={{
          marginTop: 12,
          marginHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 16,
          paddingVertical: 10,
          paddingHorizontal: 14,
          ...hard(3),
        }}>
        <View style={{ flex: 1 }}>
          <T f={F.m7} s={9.5} ls={1.2}>
            SPENT THIS CYCLE
          </T>
          <T f={F.d8} s={22} ls={-0.6}>
            {inr(total)}
          </T>
        </View>
        <View style={{ backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 }}>
          <T f={F.m7} s={10}>
            {cards.length} {cards.length === 1 ? 'CARD' : 'CARDS'}
          </T>
        </View>
      </View>

      {loading && !cards.length ? <ActivityIndicator style={{ marginTop: 60 }} color={C.ink} /> : null}
      {!loading && !cards.length ? (
        <View style={{ marginTop: 30, marginHorizontal: 20, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: C.ink, padding: 26, gap: 6 }}>
          <T f={F.d8} s={20} center>
            No cards yet
          </T>
          <T s={13.5} c={C.ink60} center>
            Make a budget card for groceries, a trip or the flat — or join a friend’s shared card.
          </T>
        </View>
      ) : null}

      <View style={{ position: 'absolute', left: 0, right: 0, top: y(204) }}>
        {cards.map(({ card, left, budget }, i) => {
          const on = card.id === selected;
          return (
            <A
              key={card.id}
              style={
                {
                  position: 'absolute',
                  left: 20,
                  right: 20,
                  top: i * 72,
                  height: 200,
                  borderWidth: 2,
                  borderColor: C.ink,
                  borderRadius: 24,
                  backgroundColor: card.bg,
                  overflow: 'hidden',
                  boxShadow: on ? '6px 6px 0 #111' : '0 -3px 0 rgba(17,17,17,.12)',
                  transform: on ? [{ translateY: -14 }, { rotate: '-1.5deg' }] : [{ translateY: 0 }, { rotate: '0deg' }],
                  transitionProperty: ['transform', 'boxShadow'],
                  transitionDuration: ['350ms', '200ms'],
                  transitionTimingFunction: [E.s14, 'ease'],
                } as any
              }>
              <Press onPress={() => open(card.id)} accessibilityRole="button" accessibilityLabel={`${card.label}, ${inr(left)} remaining`} style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 18 }}>
                <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: C.ink, backgroundColor: card.artA }} />
                <T f={F.d8} s={19} ls={-0.4} c={card.ink} lines={1} style={{ marginRight: 90 }}>
                  {card.label}
                </T>
                <T f={F.b6} s={12.5} c={card.ink} style={{ marginTop: 2 }} lines={1}>
                  {(card.isOwner ? '' : 'SHARED · ') + (card.sub || `${card.expLabel ?? 'RESETS'} ${card.exp}`).toUpperCase()}
                </T>
                <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <View>
                    <T f={F.m4} s={10} ls={1} c={card.ink}>
                      REMAINING
                    </T>
                    <T f={F.d8} s={28} ls={-0.8} c={card.ink}>
                      {inr(left)}
                    </T>
                  </View>
                  <T f={F.b7} s={13} c={card.ink}>
                    of {inr(budget)}
                  </T>
                </View>
              </Press>
            </A>
          );
        })}
      </View>

      <Press
        onPress={() => router.push('/pocket/manage')}
        accessibilityRole="button"
        pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }] }}
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 116,
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: 999,
          backgroundColor: C.ink,
          borderWidth: 2,
          borderColor: C.ink,
          ...hard(4, 4, C.cobalt),
        }}>
        <T f={F.b8} s={20} lh={22} c={C.lime}>
          +
        </T>
        <T f={F.b8} s={15} ls={0.4} c="#fff">
          ADD OR JOIN A CARD
        </T>
      </Press>
      <TabBar active="pocket" tone="ink" delay={0.2} />
    </Screen>
  );
}
