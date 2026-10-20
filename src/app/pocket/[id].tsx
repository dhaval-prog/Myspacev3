// P2 Card detail — a real budget card: remaining, recent spends, add an expense from the sheet.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { anim, E, gpPop, gpStamp, gpUp, skFade } from '@/theme/anim';
import { C, F, hard, inr } from '@/theme/tokens';
import { Fill } from '@/ui/kit';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { useExpenses } from '@/v2/context/ExpensesContext';
import { parseAmount } from '@/v2/utils/expensesFormat';

const TBG = [C.sun, C.lime, C.tomato, '#fff'];
const AMTS = [200, 500, 1000, 2000];
// Shown label → v2 spend category.
const KINDS: [string, string][] = [
  ['Food', 'Food'],
  ['Outing', 'Outing'],
  ['Bills', 'Utilities'],
  ['Shopping', 'Shopping'],
  ['Other', 'Other'],
];

export default function PocketCard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useStatusBar();
  const ex = useExpenses();
  const idx = ex.deck.findIndex((c) => c.id === id);
  const card = idx >= 0 ? ex.deck[idx] : undefined;

  // addExpense() writes to the context's focused card — point it at this one.
  useEffect(() => {
    if (idx < 0 || !ex.deck.length) return;
    const want = (idx - ex.sel + ex.deck.length) % ex.deck.length;
    if (ex.dot !== want) ex.setDot(want);
  }, [idx, ex.sel, ex.dot, ex.deck.length, ex]);

  const [sheet, setSheet] = useState(false);
  const [amt, setAmt] = useState(500);
  const [kind, setKind] = useState(0);
  const [title, setTitle] = useState('');
  const [toast, setToast] = useState(0);
  const [freshCount, setFreshCount] = useState<number | null>(null);
  const tm = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (tm.current && clearTimeout(tm.current)), []);

  const round = { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(2) } as const;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/pocket'));

  if (!card) {
    return (
      <Screen style={{ backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        {ex.loading ? (
          <ActivityIndicator color={C.ink} />
        ) : (
          <>
            <T f={F.d8} s={20}>
              Card not found
            </T>
            <Press onPress={back} style={{ borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 }}>
              <T f={F.b7} s={14}>
                Back to Pocket
              </T>
            </Press>
          </>
        )}
      </Screen>
    );
  }

  const expenses = ex.expensesFor(card);
  const spent = expenses.reduce((s, x) => s + parseAmount(x.amt), 0);
  const budget = parseAmount(card.amount);
  const left = Math.max(0, budget - spent);
  const pct = budget ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  const ink = card.ink;

  const add = () => {
    const [label, category] = KINDS[kind];
    ex.addExpense({ title: title.trim() || label, amount: amt, category, date: new Date() });
    setSheet(false);
    setTitle('');
    setFreshCount(expenses.length + 1);
    setToast((n) => n + 1);
    if (tm.current) clearTimeout(tm.current);
    tm.current = setTimeout(() => setToast(0), 1100);
  };

  return (
    <Screen style={{ backgroundColor: C.paper }}>
      <View style={{ paddingTop: top + 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Press onPress={back} accessibilityLabel="Back" pressed={pushed(2, 0)} style={round}>
          <Icon d={ICON.back2} size={18} sw={2.4} />
        </Press>
        <T f={F.m7} s={11} ls={1.3} lines={1} style={{ flexShrink: 1, marginHorizontal: 10 }}>
          {(card.isOwner ? '' : 'SHARED · ') + `${card.expLabel ?? 'RESETS'} ${card.exp}`.toUpperCase()}
        </T>
        <Press onPress={() => router.push({ pathname: '/pocket/manage', params: { card: card.id } })} accessibilityLabel="Members, history and settings" pressed={pushed(2, 0)} style={round}>
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Circle cx={5} cy={12} r={2} fill={C.ink} />
            <Circle cx={12} cy={12} r={2} fill={C.ink} />
            <Circle cx={19} cy={12} r={2} fill={C.ink} />
          </Svg>
        </Press>
      </View>

      <View
        style={{
          marginTop: 18,
          marginHorizontal: 20,
          height: 190,
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 24,
          backgroundColor: card.bg,
          padding: 18,
          overflow: 'hidden',
          transform: [{ rotate: '-1deg' }],
          ...hard(6),
        }}>
        <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: C.ink, backgroundColor: card.artA }} />
        <T f={F.d8} s={22} ls={-0.5} c={ink} lines={1} style={{ marginRight: 90 }}>
          {card.label}
        </T>
        <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <T f={F.m4} s={10} ls={1} c={ink}>
                REMAINING
              </T>
              <T f={F.d8} s={36} lh={38} ls={-1.2} c={ink}>
                {inr(left)}
              </T>
            </View>
            <T f={F.b7} s={13} c={ink}>
              of {inr(budget)}
            </T>
          </View>
          <View style={{ marginTop: 12, height: 14, borderWidth: 2, borderColor: C.ink, borderRadius: 999, backgroundColor: '#fff', overflow: 'hidden' }}>
            <Fill pct={pct} color={C.ink} ms={500} />
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 22, paddingHorizontal: 20, paddingBottom: 10 }}>
        <T f={F.m7} s={10.5} ls={1.3}>
          RECENT
        </T>
        <T f={F.m4} s={10.5} c={C.ink60}>
          {inr(spent)} spent
        </T>
      </View>
      <ScrollView style={{ flex: 1, marginBottom: 108 }} contentContainerStyle={{ gap: 9, paddingHorizontal: 20, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        {expenses.length === 0 ? (
          <View style={{ borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: C.ink, padding: 18 }}>
            <T f={F.b6} s={13.5} center>
              No spends yet this cycle.
            </T>
          </View>
        ) : null}
        {expenses.map((t, i) => {
          const isNew = freshCount === expenses.length && i === 0;
          return (
            <A
              key={t.id}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: '#fff',
                  borderWidth: 2,
                  borderColor: C.ink,
                  borderRadius: 16,
                  boxShadow: isNew ? '4px 4px 0 #2B4BFF' : '2px 2px 0 #111',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                } as ViewStyle,
                isNew ? anim(gpPop(), 0.4, 0, E.s14) : null,
              ]}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: C.ink,
                  backgroundColor: TBG[i % 4],
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ rotate: `${[-6, 4, -3, 5][i % 4]}deg` }],
                }}>
                <T f={F.d8} s={15}>
                  {(t.title[0] || '?').toUpperCase()}
                </T>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T f={F.b7} s={14.5} lines={1}>
                  {t.title}
                </T>
                <T s={12} c={C.ink60} lines={1}>
                  {(ex.membersFor(card).find((m) => m.userId === t.userId)?.name ?? 'You').split(' ')[0]} · {t.date}
                </T>
              </View>
              <T f={F.m7} s={13}>
                −{inr(parseAmount(t.amt))}
              </T>
            </A>
          );
        })}
      </ScrollView>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 34 }}>
        <Press
          onPress={() => setSheet(true)}
          accessibilityRole="button"
          pressed={pushed(3, 1)}
          style={{ height: 60, borderRadius: 18, backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(4) }}>
          <T f={F.d8} s={19}>
            + Add expense
          </T>
        </Press>
      </View>

      {sheet ? (
        <>
          <A style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, anim(skFade(), 0.25)]}>
            <Press onPress={() => setSheet(false)} accessibilityLabel="Close" style={{ flex: 1, backgroundColor: 'rgba(17,17,17,.45)' }} />
          </A>
          <A
            style={[
              {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: C.paper,
                borderTopWidth: 3,
                borderColor: C.ink,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                paddingTop: 14,
                paddingHorizontal: 20,
                paddingBottom: 34,
              },
              anim(gpUp(520), 0.35, 0, E.out),
            ]}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.ink, alignSelf: 'center' }} />
            <T f={F.d8} s={22} ls={-0.5} style={{ marginTop: 14 }} lines={1}>
              Add to {card.label}
            </T>
            <T f={F.d8} s={52} ls={-2} center style={{ marginTop: 10 }}>
              {inr(amt)}
            </T>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {AMTS.map((v) => (
                <Press
                  key={v}
                  onPress={() => setAmt(v)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: v === amt }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderWidth: 2,
                    borderColor: C.ink,
                    borderRadius: 12,
                    backgroundColor: v === amt ? C.sun : '#fff',
                    boxShadow: v === amt ? '3px 3px 0 #111' : 'none',
                  }}>
                  <T f={F.m7} s={12.5}>
                    {inr(v)}
                  </T>
                </Press>
              ))}
            </View>
            <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={amt ? String(amt) : ''}
                onChangeText={(v) => setAmt(Math.min(10000000, Number(v.replace(/[^0-9]/g, '')) || 0))}
                keyboardType="number-pad"
                placeholder="₹ amount"
                placeholderTextColor="rgba(17,17,17,.35)"
                accessibilityLabel="Amount"
                style={{ width: 110, height: 44, borderWidth: 2, borderColor: C.ink, borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 12, fontFamily: F.m7, fontSize: 14, color: C.ink, outlineStyle: 'none' } as any}
              />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What was it? (optional)"
                placeholderTextColor="rgba(17,17,17,.35)"
                accessibilityLabel="What was it"
                style={{ flex: 1, height: 44, borderWidth: 2, borderColor: C.ink, borderRadius: 12, backgroundColor: '#fff', paddingHorizontal: 12, fontFamily: F.b6, fontSize: 14.5, color: C.ink, outlineStyle: 'none' } as any}
              />
            </View>
            <T f={F.m7} s={10} ls={1.2} style={{ marginTop: 16 }}>
              WHAT FOR?
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {KINDS.map(([label], k) => {
                const on = k === kind;
                return (
                  <Press
                    key={label}
                    onPress={() => setKind(k)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderWidth: 2,
                      borderColor: C.ink,
                      borderRadius: 999,
                      backgroundColor: on ? C.ink : '#fff',
                      transform: [{ rotate: on ? '-3deg' : '0deg' }],
                    }}>
                    <T f={F.b7} s={13.5} c={on ? '#fff' : C.ink}>
                      {label}
                    </T>
                  </Press>
                );
              })}
            </View>
            <Press
              onPress={add}
              disabled={amt <= 0}
              accessibilityRole="button"
              pressed={pushed(3, 1)}
              style={{
                marginTop: 18,
                height: 58,
                borderRadius: 18,
                backgroundColor: amt > 0 ? C.cobalt : '#9aa3d9',
                borderWidth: 2,
                borderColor: C.ink,
                alignItems: 'center',
                justifyContent: 'center',
                ...hard(4),
              }}>
              <T f={F.d8} s={18} c="#fff">
                Add {inr(amt)}
              </T>
            </Press>
          </A>
        </>
      ) : null}

      {toast ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 300, alignItems: 'center' }}>
          <A
            key={'t' + toast}
            style={[
              { borderWidth: 3, borderColor: C.tomato, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,.9)' },
              anim(gpStamp(), 0.45, 0, E.s13),
            ]}>
            <T f={F.m7} s={20} ls={2} c={C.tomato}>
              ADDED
            </T>
          </A>
        </View>
      ) : null}
    </Screen>
  );
}
