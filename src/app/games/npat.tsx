// G2 NPAT round — 60s clock, answers starting with the letter get an OK stamp.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, type ViewStyle } from 'react-native';

import { anim, E, gpStamp } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { Fill } from '@/ui/kit';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

const LETTER = 'M';
const CATS = ['Name', 'Place', 'Animal', 'Thing'] as const;
type Cat = (typeof CATS)[number];

export default function Npat() {
  const { top } = useStatusBar();
  const [t, setT] = useState(60);
  const [locked, setLocked] = useState(false);
  const [ans, setAns] = useState<Record<Cat, string>>({ Name: 'Meera', Place: 'Mumbai', Animal: '', Thing: '' });

  useEffect(() => {
    if (locked) return;
    const iv = setInterval(() => setT((x) => (x <= 0 ? 60 : x - 1)), 1000);
    return () => clearInterval(iv);
  }, [locked]);

  const ok = (v: string) => new RegExp(`^${LETTER}.`, 'i').test(v.trim());
  const okN = CATS.filter((k) => ok(ans[k])).length;
  const low = t <= 10;
  const players: [string, string, boolean][] = [
    ['AK', C.tomato, true],
    ['PS', '#fff', true],
    ['MI', C.lime, false],
    ['YO', C.cobalt, locked],
  ];

  return (
    <Screen style={{ backgroundColor: C.sun }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: top + 14, paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Press
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/games'))}
              accessibilityLabel="Leave round"
              pressed={pushed(2, 0)}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(2) }}>
              <Icon d={ICON.close} size={18} sw={2.4} />
            </Press>
            <View style={{ backgroundColor: C.ink, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 }}>
              <T f={F.m7} s={12} ls={1.4} c={C.sun}>
                ROUND 2 / 5
              </T>
            </View>
            <View
              accessibilityLabel={`${t} seconds left`}
              style={{
                minWidth: 64,
                height: 42,
                borderRadius: 999,
                backgroundColor: low ? C.tomato : '#fff',
                borderWidth: 2,
                borderColor: C.ink,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 10,
                ...hard(2),
              }}>
              <T f={F.m7} s={15} c={low ? '#fff' : C.ink}>
                0:{String(t).padStart(2, '0')}
              </T>
            </View>
          </View>
          <View style={{ marginTop: 12, marginHorizontal: 20, height: 12, borderWidth: 2, borderColor: C.ink, borderRadius: 999, backgroundColor: '#fff', overflow: 'hidden' }}>
            <Fill pct={Math.round((t / 60) * 100)} color={C.tomato} ms={1000} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 22, paddingHorizontal: 20 }}>
            <View
              style={{
                width: 96,
                height: 112,
                borderWidth: 3,
                borderColor: C.ink,
                borderRadius: 18,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: '-5deg' }],
                ...hard(6),
              }}>
              <T f={F.d8} s={76} lh={90}>
                {LETTER}
              </T>
            </View>
            <View style={{ flex: 1 }}>
              <T f={F.m7} s={10.5} ls={1.3}>
                THIS ROUND’S LETTER
              </T>
              <T f={F.d8} s={26} ls={-0.8} lh={27} style={{ marginTop: 4 }}>
                Everything starts with {LETTER}
              </T>
            </View>
          </View>

          <View style={{ gap: 12, paddingTop: 24, paddingHorizontal: 20 }}>
            {CATS.map((k) => {
              const v = ans[k];
              const good = ok(v);
              return (
                <View
                  key={k}
                  style={
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      backgroundColor: '#fff',
                      borderWidth: 2,
                      borderColor: C.ink,
                      borderRadius: 18,
                      boxShadow: good ? '4px 4px 0 #111' : '2px 2px 0 #111',
                      paddingVertical: 6,
                      paddingRight: 6,
                      paddingLeft: 14,
                    } as ViewStyle
                  }>
                  <T f={F.m7} s={10.5} ls={1} style={{ width: 62 }}>
                    {k.toUpperCase()}
                  </T>
                  <TextInput
                    value={v}
                    onChangeText={(x) => setAns((a) => ({ ...a, [k]: x }))}
                    placeholder={`${LETTER}…`}
                    placeholderTextColor="rgba(17,17,17,.35)"
                    editable={!locked}
                    autoCapitalize="words"
                    autoCorrect={false}
                    accessibilityLabel={k}
                    style={{ flex: 1, minWidth: 0, height: 42, fontFamily: F.b7, fontSize: 17, color: C.ink, outlineStyle: 'none' } as any}
                  />
                  {good ? (
                    <A style={[{ backgroundColor: C.lime, borderWidth: 2, borderColor: C.ink, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 7 }, anim(gpStamp(), 0.4, 0, E.s13)]}>
                      <T f={F.m7} s={10} ls={1}>
                        OK ✓
                      </T>
                    </A>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={{ paddingTop: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {players.map(([ini, bg, done]) => (
              <View key={ini} style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: C.ink, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <T f={F.b8} s={12}>
                  {ini}
                </T>
                {done ? (
                  <View style={{ position: 'absolute', right: -5, bottom: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
                    <T f={F.b7} s={10} c={C.lime}>
                      ✓
                    </T>
                  </View>
                ) : null}
              </View>
            ))}
            <T f={F.b6} s={12.5}>
              {locked ? 3 : 2} of 4 locked in
            </T>
          </View>

          <View style={{ flex: 1, minHeight: 24 }} />
          <View style={{ paddingHorizontal: 20 }}>
            <Press
              onPress={() => setLocked((l) => !l)}
              accessibilityRole="button"
              pressed={pushed(3, 1)}
              style={{
                height: 60,
                borderRadius: 18,
                backgroundColor: locked ? C.lime : C.ink,
                borderWidth: 2,
                borderColor: C.ink,
                alignItems: 'center',
                justifyContent: 'center',
                ...hard(4),
              }}>
              <T f={F.d8} s={19} ls={0.3} c={locked ? C.ink : '#fff'}>
                {locked ? 'Locked ✓ waiting for others' : `Lock it in · ${okN}/4`}
              </T>
            </Press>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
