// P1 Pocket cards — stacked budget cards; tap one to lift it and open it.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View, type ViewStyle } from 'react-native';

import { initialsOf, usePocket, useStore } from '@/state/store';
import { E } from '@/theme/anim';
import { C, dots, F, hard, inr } from '@/theme/tokens';
import { A, Press, T, useStatusBar, useY } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';

export default function Pocket() {
  const { top } = useStatusBar();
  const y = useY();
  const s = useStore();
  const cards = usePocket();
  const [sel, setSel] = useState(0);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (t.current && clearTimeout(t.current)), []);
  const total = cards.reduce((a, c) => a + c.spent, 0);

  const open = (i: number) => {
    setSel(i);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => router.push({ pathname: '/pocket/[id]', params: { id: String(i) } }), 350);
  };

  return (
    <Screen style={{ backgroundColor: C.paper, ...(dots(0.07, 16) as ViewStyle) }}>
      <View style={{ paddingTop: top + 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T f={F.d8} s={36} ls={-1.4}>
          Pocket
        </T>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: C.tomato,
            borderWidth: 2,
            borderColor: C.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...hard(2),
          }}>
          <T f={F.b8} s={14} c="#fff">
            {initialsOf(s.name || 'Friend')}
          </T>
        </View>
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
            SPENT THIS MONTH
          </T>
          <T f={F.d8} s={22} ls={-0.6}>
            {inr(total)}
          </T>
        </View>
        <View style={{ backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9 }}>
          <T f={F.m7} s={10}>
            {cards.length} CARDS
          </T>
        </View>
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, top: y(204) }}>
        {cards.map((c, i) => {
          const on = i === sel;
          return (
            <A
              key={c.label}
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
                  backgroundColor: c.bg,
                  overflow: 'hidden',
                  boxShadow: on ? '6px 6px 0 #111' : '0 -3px 0 rgba(17,17,17,.12)',
                  transform: on ? [{ translateY: -14 }, { rotate: '-1.5deg' }] : [{ translateY: 0 }, { rotate: '0deg' }],
                  transitionProperty: ['transform', 'boxShadow'],
                  transitionDuration: ['350ms', '200ms'],
                  transitionTimingFunction: [E.s14, 'ease'],
                } as any
              }>
              <Press onPress={() => open(i)} accessibilityRole="button" accessibilityLabel={`${c.label}, ${inr(c.left)} remaining`} style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 18 }}>
                <View style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: C.ink, backgroundColor: c.art }} />
                <T f={F.d8} s={19} ls={-0.4} c={c.ink}>
                  {c.label}
                </T>
                <T f={F.b6} s={12.5} c={c.ink} style={{ marginTop: 2 }}>
                  {c.meta}
                </T>
                <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <View>
                    <T f={F.m4} s={10} ls={1} c={c.ink}>
                      REMAINING
                    </T>
                    <T f={F.d8} s={28} ls={-0.8} c={c.ink}>
                      {inr(c.left)}
                    </T>
                  </View>
                  <T f={F.b7} s={13} c={c.ink}>
                    of {inr(c.budget)}
                  </T>
                </View>
              </Press>
            </A>
          );
        })}
      </View>

      <Press
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
          ADD EXPENSE CARD
        </T>
      </Press>
      <TabBar active="pocket" tone="ink" delay={0.2} />
    </Screen>
  );
}

