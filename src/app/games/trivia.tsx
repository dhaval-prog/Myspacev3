// G3 Trivia question — 15s timer, tap an answer: CORRECT stamp or NOPE + shake.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';

import { anim, E, gpPop, gpShake, gpStamp } from '@/theme/anim';
import { C, F, groupIN, hard } from '@/theme/tokens';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

// [category, question, answers, correct index] — mock data.
const QS: [string, string, string[], number][] = [
  ['GEOGRAPHY', 'Which city is known as the Pink City of India?', ['Udaipur', 'Jaipur', 'Jodhpur', 'Agra'], 1],
  ['SCIENCE', 'What gas do plants take in from the air?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], 2],
  ['MOVIES', 'Which film features the song “Naatu Naatu”?', ['RRR', 'Baahubali', 'KGF', 'Pushpa'], 0],
];

export default function Trivia() {
  const { top } = useStatusBar();
  const [q, setQ] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [tt, setTt] = useState(15);
  const [score, setScore] = useState(340);
  const answered = pick != null;

  useEffect(() => {
    if (answered) return;
    const iv = setInterval(() => setTt((x) => (x <= 0 ? 15 : x - 1)), 1000);
    return () => clearInterval(iv);
  }, [answered]);

  const [cat, text, answers, right] = QS[q % QS.length];
  const qNum = 4 + q;

  const choose = (i: number) => {
    if (answered) return;
    setPick(i);
    if (i === right) setScore((s) => s + 100 + tt * 10);
  };
  const next = () => {
    setQ((x) => (x + 1) % QS.length);
    setPick(null);
    setTt(15);
  };

  return (
    <Screen bar="#fff" style={{ backgroundColor: C.cobalt, paddingTop: top + 14 }}>
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Press onPress={() => (router.canGoBack() ? router.back() : router.replace('/games'))} accessibilityLabel="Leave game" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon d={ICON.close} size={12} sw={3} />
            <T f={F.m7} s={12} ls={1.4}>
              Q {qNum} / 10
            </T>
          </View>
        </Press>
        <View style={{ backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, transform: [{ rotate: '2deg' }], ...hard(2) }}>
          <T f={F.m7} s={12} ls={1}>
            {groupIN(score)} PTS
          </T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 5, paddingTop: 14, paddingHorizontal: 20 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderWidth: 2,
              borderColor: C.ink,
              borderRadius: 4,
              backgroundColor: i < qNum - 1 ? C.sun : i === qNum - 1 ? '#fff' : 'rgba(255,255,255,.25)',
            }}
          />
        ))}
      </View>

      <View
        style={{
          marginTop: 26,
          marginHorizontal: 20,
          backgroundColor: '#fff',
          borderWidth: 3,
          borderColor: C.ink,
          borderRadius: 24,
          paddingTop: 22,
          paddingHorizontal: 20,
          paddingBottom: 24,
          transform: [{ rotate: '-1.5deg' }],
          ...hard(6),
        }}>
        <View
          accessibilityLabel={`${tt} seconds left`}
          style={{
            position: 'absolute',
            right: 16,
            top: -16,
            width: 52,
            height: 52,
            borderRadius: 26,
            borderWidth: 2,
            borderColor: C.ink,
            backgroundColor: tt <= 5 ? C.tomato : C.lime,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <T f={F.m7} s={16}>
            {tt}
          </T>
        </View>
        <T f={F.m7} s={10.5} ls={1.3} c={C.tomato}>
          {cat}
        </T>
        <T f={F.d8} s={27} lh={30} ls={-0.8} style={{ marginTop: 8 }}>
          {text}
        </T>
      </View>

      <View style={{ gap: 12, paddingTop: 30, paddingHorizontal: 20 }}>
        {answers.map((label, i) => {
          const isRight = i === right;
          const mine = i === pick;
          const bg = answered ? (isRight ? C.lime : mine ? C.tomato : '#fff') : '#fff';
          return (
            <A key={`${q}-${i}`} style={[answered && mine && !isRight ? anim(gpShake(), 0.4) : null, { opacity: answered && !isRight && !mine ? 0.55 : 1 }]}>
              <Press
                onPress={() => choose(i)}
                accessibilityRole="button"
                accessibilityLabel={label}
                pressed={answered ? undefined : ({ transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: '2px 2px 0 #111' } as ViewStyle)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: bg,
                  borderWidth: 2,
                  borderColor: C.ink,
                  borderRadius: 18,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  ...hard(4),
                }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  <T f={F.m7} s={12}>
                    {'ABCD'[i]}
                  </T>
                </View>
                <T f={F.b7} s={16.5} style={{ flex: 1 }}>
                  {label}
                </T>
                {answered && (isRight || mine) ? (
                  <A style={[{ backgroundColor: C.ink, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 }, anim(gpStamp(), 0.4, 0, E.s13)]}>
                    <T f={F.m7} s={10.5} ls={1} c={isRight ? C.lime : C.tomato}>
                      {isRight ? 'CORRECT' : 'NOPE'}
                    </T>
                  </A>
                ) : null}
              </Press>
            </A>
          );
        })}
      </View>

      {answered ? (
        <A style={[{ position: 'absolute', left: 20, right: 20, bottom: 34 }, anim(gpPop(), 0.35, 0, E.s13)]}>
          <Press
            onPress={next}
            accessibilityRole="button"
            pressed={pushed(3, 1)}
            style={{ height: 60, borderRadius: 18, backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(4) }}>
            <T f={F.d8} s={19}>
              Next question →
            </T>
          </Press>
        </A>
      ) : null}
    </Screen>
  );
}
