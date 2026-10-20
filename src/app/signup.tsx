// 03 Sign up — one question at a time, editable answer chips, password strength.
import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View, type ViewStyle } from 'react-native';

import { useStore } from '@/state/store';
import { useAuth } from '@/v2/context/AuthContext';
import { anim, E, loop, skNudge, skPop, skPopR, skShake, skStep } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { Fill } from '@/ui/kit';
import { GoogleG } from '@/ui/GoogleG';
import { A, Icon, ICON, Press, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

const I = C.deep;
const Lm = C.lime;
const KEYS = ['name', 'email', 'pw'] as const;
const VALID = [(v: string) => v.trim().length > 1, (v: string) => /^\S+@\S+\.\S+$/.test(v), (v: string) => v.length >= 8];
const Q: [string, string, string, string, string][] = [
  ['STEP 1 · NAME', 'What should friends call you?', 'Your name', 'This is how you’ll show up in chats.', 'Add at least two letters.'],
  ['STEP 2 · EMAIL', 'What’s your email?', 'you@email.com', 'We’ll send a magic link to check it’s you.', 'That doesn’t look like an email yet.'],
  ['STEP 3 · PASSWORD', 'Pick a password', '8+ characters', 'Make it sneaky. You can change it later.', 'Needs at least 8 characters.'],
];
const STRENGTH_C = ['#FF8A6B', '#FFB020', '#8FCB3A', Lm];
const STRENGTH_T = ['', 'TOO SHORT', 'OKAY', 'STRONG', 'SNEAKY'];

function strength(pw: string) {
  if (!pw) return 0;
  let sc = [pw.length >= 8, /[A-Z]/.test(pw) && /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  if (pw.length < 8 || !sc) sc = 1;
  return sc;
}

export default function Signup() {
  const s = useStore();
  const { signInWithOAuth } = useAuth();
  const [oauthErr, setOauthErr] = useState<string | null>(null);
  const { top } = useStatusBar();
  const [st, setSt] = useState(0);
  const [k, setK] = useState(0); // step-change counter (restarts the slide-in)
  const [shake, setShake] = useState(0);
  const [err, setErr] = useState(false);
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const key = KEYS[st];
  const val = s[key] || '';
  const ok = VALID[st](val);
  const q = Q[st];
  const sc = strength(s.pw);

  const goStep = (n: number) => {
    setSt(n);
    setK((x) => x + 1);
    setErr(false);
    setShow(false);
  };
  const next = () => {
    if (!ok) {
      setShake((x) => x + 1);
      setErr(true);
      return;
    }
    if (st < 2) goStep(st + 1);
    else router.push('/avatar');
  };
  const back = () => (st > 0 ? goStep(st - 1) : router.canGoBack() ? router.back() : router.replace('/welcome'));

  const boxBorder = ok || focus ? I : 'rgba(22,33,12,.12)';
  const boxShadow = ok ? `3px 3px 0 ${I}` : focus ? '0 0 0 4px rgba(195,234,79,.55)' : '0 6px 16px rgba(22,33,12,.06)';

  return (
    <Screen bar={I} style={{ backgroundColor: '#EDF2EA' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, paddingTop: top + 7, paddingHorizontal: 24, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Press
            onPress={back}
            accessibilityLabel="Back"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,.8)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON.back} size={18} color={I} sw={2} />
          </Press>
          <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(22,33,12,.1)', overflow: 'hidden' }}>
                <Fill pct={i < st ? 100 : i === st ? (ok ? 100 : 30) : 0} color={I} style={{ borderRadius: 4 }} />
              </View>
            ))}
          </View>
          <T f={F.dm5} s={12} c="rgba(22,33,12,.6)">
            {st + 1} / 3
          </T>
        </View>

        {/* answered chips */}
        <View style={{ marginTop: 18, minHeight: 34, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[0, 1, 2].slice(0, st).map((i) => {
            const r = [-2, 1.5, -1][i];
            return (
              <A key={i} style={anim(skPopR(r), 0.35, 0, E.s14)}>
                <Press
                  onPress={() => goStep(i)}
                  accessibilityLabel={`Edit ${['name', 'email', 'password'][i]}`}
                  pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: `0 0 0 ${I}` } as ViewStyle}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderRadius: 999,
                    backgroundColor: '#fff',
                    borderWidth: 1.5,
                    borderColor: I,
                    boxShadow: `2px 2px 0 ${I}`,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}>
                  <T f={F.dm4} s={10} ls={1} c="rgba(22,33,12,.55)">
                    {['NAME', 'EMAIL', 'PASS'][i]}
                  </T>
                  <T f={F.b6} s={13} c={I}>
                    {i === 2 ? '••••••' : s[KEYS[i]]}
                  </T>
                  <Icon d={ICON.pencil} size={12} color={I} sw={2.4} />
                </Press>
              </A>
            );
          })}
        </View>

        <A key={'step' + k} style={[{ marginTop: 26 }, anim(skStep(), 0.4, 0, E.out)]}>
          <T f={F.dm5} s={11} ls={1.5} c="rgba(22,33,12,.5)">
            {q[0]}
          </T>
          <T f={F.b7} s={31} lh={34} ls={-0.9} c={I} style={{ marginTop: 8 }}>
            {q[1]}
          </T>
          <A
            key={'sh' + shake}
            style={[
              {
                marginTop: 22,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: '#fff',
                borderRadius: 24,
                paddingVertical: 6,
                paddingLeft: 20,
                paddingRight: 8,
                borderWidth: 1.5,
                borderColor: boxBorder,
                boxShadow,
              } as ViewStyle,
              shake ? anim(skShake(10), 0.4) : null,
            ]}>
            <TextInput
              ref={input}
              value={val}
              onChangeText={(v) => {
                s.set({ [key]: v } as any);
                setErr(false);
              }}
              onSubmitEditing={next}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              placeholder={q[2]}
              placeholderTextColor="rgba(17,17,17,.35)"
              secureTextEntry={st === 2 && !show}
              keyboardType={st === 1 ? 'email-address' : 'default'}
              autoCapitalize={st === 0 ? 'words' : 'none'}
              autoCorrect={false}
              autoComplete={st === 0 ? 'name' : st === 1 ? 'email' : 'new-password'}
              returnKeyType="next"
              accessibilityLabel={q[1]}
              style={{ flex: 1, minWidth: 0, height: 54, fontFamily: F.b6, fontSize: 20, color: I, outlineStyle: 'none' } as any}
            />
            {st === 2 && (
              <Press
                onPress={() => setShow((x) => !x)}
                accessibilityLabel={show ? 'Hide password' : 'Show password'}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(22,33,12,.06)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={show ? ICON.eyeOff : ICON.eye} size={20} color={I} sw={1.9} />
              </Press>
            )}
            {ok && (
              <A
                style={[
                  { width: 42, height: 42, borderRadius: 21, backgroundColor: Lm, borderWidth: 1.5, borderColor: I, alignItems: 'center', justifyContent: 'center' },
                  anim(skPop(), 0.3, 0, E.s15),
                ]}>
                <Icon d={ICON.check} size={18} color={I} sw={2.8} />
              </A>
            )}
          </A>
          {st === 2 && (
            <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, flexDirection: 'row', gap: 5 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < sc ? STRENGTH_C[sc - 1] : 'rgba(22,33,12,.1)' }} />
                ))}
              </View>
              <T f={F.dm5} s={11} ls={1} c={I} style={{ minWidth: 62, textAlign: 'right' }}>
                {STRENGTH_T[sc]}
              </T>
            </View>
          )}
          <T s={13.5} lh={19} f={F.b5} c={err && !ok ? '#C8391F' : 'rgba(22,33,12,.55)'} style={{ marginTop: 12 }}>
            {err && !ok ? q[4] : q[3]}
          </T>
          {oauthErr ? (
            <T s={13} c="#C8391F" style={{ marginTop: 6 }}>
              {oauthErr}
            </T>
          ) : null}
        </A>

        <View style={{ flex: 1 }} />
        <Press
          onPress={next}
          accessibilityRole="button"
          pressed={{ transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `0 0 0 ${I}` } as ViewStyle}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderRadius: 999,
            backgroundColor: ok ? Lm : 'rgba(22,33,12,.08)',
            borderWidth: 1.5,
            borderColor: ok ? I : 'transparent',
            boxShadow: ok ? `3px 3px 0 ${I}` : 'none',
            paddingVertical: 18,
          }}>
          <T f={F.b7} s={16.5} c={ok ? I : 'rgba(22,33,12,.4)'}>
            {st < 2 ? 'Continue' : 'Create my space'}
          </T>
          <A style={ok ? loop(skNudge(), 1.2) : null}>
            <Icon d={ICON.arrow} size={18} color={ok ? I : 'rgba(22,33,12,.4)'} sw={2.4} />
          </A>
        </Press>
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(22,33,12,.12)' }} />
          <T s={12.5} c="rgba(22,33,12,.5)">
            or
          </T>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(22,33,12,.12)' }} />
        </View>
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
          {[
            [
              'Use Google',
              () => {
                s.set({ afterAuth: '/success' });
                signInWithOAuth('google').then(({ error }) => {
                  if (error) {
                    setOauthErr(error);
                    s.set({ afterAuth: null });
                  }
                });
              },
              true,
            ],
            ['I have an account', () => router.push('/login'), false],
          ].map(([label, fn, g]) => (
            <Press
              key={label as string}
              onPress={fn as () => void}
              accessibilityRole="button"
              pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }] }}
              style={{
                flex: 1,
                height: 50,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,.75)',
                borderWidth: 1.5,
                borderColor: I,
              }}>
              {g ? <GoogleG /> : null}
              <T f={F.b6} s={14.5} c={I}>
                {label as string}
              </T>
            </Press>
          ))}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
