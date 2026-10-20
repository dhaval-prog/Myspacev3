// P2 Card detail — remaining budget, recent spends, add an expense from a sheet.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { usePocket, useStore } from '@/state/store';
import { anim, E, gpPop, gpStamp, gpUp, skFade } from '@/theme/anim';
import { C, F, hard, inr } from '@/theme/tokens';
import { Fill } from '@/ui/kit';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

const TBG = [C.sun, C.lime, C.tomato, '#fff'];
const AMTS = [200, 500, 1000, 2000];
const KINDS = ['Food', 'Travel', 'Bills', 'Other'];

export default function PocketCard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const idx = Math.max(0, Math.min(4, Number(id) || 0));
  const { top } = useStatusBar();
  const s = useStore();
  const c = usePocket()[idx];
  const [sheet, setSheet] = useState(false);
  const [amt, setAmt] = useState(500);
  const [kind, setKind] = useState('Food');
  const [toast, setToast] = useState(0);
  const [fresh, setFresh] = useState(false);
  const tm = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (tm.current && clearTimeout(tm.current)), []);

  const pct = Math.min(100, Math.round((c.spent / c.budget) * 100));

  const add = () => {
    s.addTx(idx, [kind, 'You', amt, 'Just now']);
    setSheet(false);
    setFresh(true);
    setToast((n) => n + 1);
    if (tm.current) clearTimeout(tm.current);
    tm.current = setTimeout(() => setToast(0), 1100);
  };

  const round = { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(2) } as const;

  return (
    <Screen style={{ backgroundColor: C.paper }}>
      <View style={{ paddingTop: top + 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Press onPress={() => (router.canGoBack() ? router.back() : router.replace('/pocket'))} accessibilityLabel="Back" pressed={pushed(2, 0)} style={round}>
          <Icon d={ICON.back2} size={18} sw={2.4} />
        </Press>
        <T f={F.m7} s={11} ls={1.3}>
          {c.meta}
        </T>
        <View style={round} accessibilityLabel="More">
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Circle cx={5} cy={12} r={2} fill={C.ink} />
            <Circle cx={12} cy={12} r={2} fill={C.ink} />
            <Circle cx={19} cy={12} r={2} fill={C.ink} />
          </Svg>
        </View>
      </View>

      <View
        style={{
          marginTop: 18,
          marginHorizontal: 20,
          height: 190,
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 24,
          backgroundColor: c.bg,
          padding: 18,
          overflow: 'hidden',
          transform: [{ rotate: '-1deg' }],
          ...hard(6),
        }}>
        <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: C.ink, backgroundColor: c.art }} />
        <T f={F.d8} s={22} ls={-0.5} c={c.ink}>
          {c.label}
        </T>
        <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <T f={F.m4} s={10} ls={1} c={c.ink}>
                REMAINING
              </T>
              <T f={F.d8} s={36} lh={38} ls={-1.2} c={c.ink}>
                {inr(c.left)}
              </T>
            </View>
            <T f={F.b7} s={13} c={c.ink}>
              of {inr(c.budget)}
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
          {inr(c.spent)} spent
        </T>
      </View>
      <ScrollView style={{ flex: 1, marginBottom: 108 }} contentContainerStyle={{ gap: 9, paddingHorizontal: 20, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        {c.all.map((t, i) => {
          const isNew = fresh && i === 0;
          return (
            <A
              key={`${c.all.length - i}`}
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
                  {t[0][0]}
                </T>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T f={F.b7} s={14.5}>
                  {t[0]}
                </T>
                <T s={12} c={C.ink60}>
                  {t[1]} · {t[3]}
                </T>
              </View>
              <T f={F.m7} s={13}>
                −{inr(t[2])}
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
              anim(gpUp(460), 0.35, 0, E.out),
            ]}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.ink, alignSelf: 'center' }} />
            <T f={F.d8} s={22} ls={-0.5} style={{ marginTop: 14 }}>
              Add to {c.label}
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
            <T f={F.m7} s={10} ls={1.2} style={{ marginTop: 16 }}>
              WHAT FOR?
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {KINDS.map((k) => {
                const on = k === kind;
                return (
                  <Press
                    key={k}
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
                      {k}
                    </T>
                  </Press>
                );
              })}
            </View>
            <Press
              onPress={add}
              accessibilityRole="button"
              pressed={pushed(3, 1)}
              style={{ marginTop: 18, height: 58, borderRadius: 18, backgroundColor: C.cobalt, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(4) }}>
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
