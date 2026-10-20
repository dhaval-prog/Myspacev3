// 05 Log in — intercom panel, LCD echoes typing, press BUZZ to get in.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg from 'react-native-svg';

import { useStore } from '@/state/store';
import { useAuth } from '@/v2/context/AuthContext';
import { anim, skBlink, skShake } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { DrawPath } from '@/ui/kit';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { GoogleG } from '@/ui/GoogleG';
import { Screen } from '@/ui/Screen';

type Buzz = 'idle' | 'check' | 'ok' | 'err';

const fill = { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const;

function Screw({ pos }: { pos: ViewStyle }) {
  return (
    <View
      style={
        {
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: C.ink,
          backgroundImage: 'radial-gradient(circle at 35% 30%, #fff, #a9adb6 60%, #6f737c)',
          alignItems: 'center',
          justifyContent: 'center',
          ...pos,
        } as ViewStyle
      }>
      <View style={{ width: 7, height: 1.5, backgroundColor: '#333', transform: [{ rotate: '35deg' }] }} />
    </View>
  );
}

function Toggle({ on }: { on: boolean }) {
  const x = useSharedValue(on ? 20 : 0);
  useEffect(() => {
    x.value = withTiming(on ? 20 : 0, { duration: 250, easing: Easing.bezier(0.2, 0.8, 0.3, 1.4) });
  }, [on, x]);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={
        {
          width: 50,
          height: 30,
          borderRadius: 15,
          borderWidth: 2,
          borderColor: C.ink,
          padding: 2,
          backgroundImage: on ? 'linear-gradient(180deg, #1d36d6, #4b66ff)' : 'linear-gradient(180deg, #d9d3c3, #efe9da)',
          boxShadow: 'inset 0 3px 5px rgba(0,0,0,.35)',
        } as ViewStyle
      }>
      <Animated.View
        style={[
          {
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: C.ink,
            backgroundImage: 'radial-gradient(circle at 35% 30%, #fff, #ececec 55%, #b8b8b8)',
            boxShadow: '0 3px 4px rgba(0,0,0,.35)',
          } as ViewStyle,
          st,
        ]}
      />
    </View>
  );
}

export default function Login() {
  const s = useStore();
  const { top } = useStatusBar();
  const [focus, setFocus] = useState<'email' | 'lpw' | null>(null);
  const [buzz, setBuzz] = useState<Buzz>('idle');
  const [shake, setShake] = useState(0);
  const [remember, setRemember] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const { signIn, resetPassword, signInWithOAuth } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleErr, setGoogleErr] = useState<string | null>(null);
  // Web: the browser leaves for Google and returns to this site; native: an in-app browser
  // session returns via the app's own myspacev3:// link. Either way the new session lands on Chats.
  const google = async () => {
    setGoogleErr(null);
    setGoogleBusy(true);
    const { error } = await signInWithOAuth('google');
    setGoogleBusy(false);
    if (error) setGoogleErr(error);
  };
  const [resetNote, setResetNote] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (t.current && clearTimeout(t.current)), []);

  const n = s.lpw.length;
  let lcd = 'WHO IS IT?';
  if (buzz === 'err') lcd = errMsg ? errMsg.toUpperCase() : 'HMM… WHO’S THERE?';
  else if (buzz === 'check') lcd = 'BZZZT… CHECKING';
  else if (buzz === 'ok') lcd = 'WELCOME BACK!';
  else if (focus === 'email') lcd = '> ' + s.email.slice(-18).toUpperCase();
  else if (focus === 'lpw') lcd = '> ' + '*'.repeat(Math.min(n, 16));
  const led = buzz === 'ok' ? '#3BE36A' : buzz === 'err' ? '#FF3B1F' : '#FFB020';

  const press = () => {
    if (buzz === 'check' || buzz === 'ok') return;
    if (t.current) clearTimeout(t.current);
    setErrMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(s.email) || n < 1) {
      setBuzz('err');
      setShake((x) => x + 1);
      t.current = setTimeout(() => setBuzz('idle'), 1600);
      return;
    }
    setBuzz('check');
    signIn(s.email, s.lpw).then(({ error }) => {
      if (error) {
        setErrMsg(error);
        setBuzz('err');
        setShake((x) => x + 1);
        t.current = setTimeout(() => setBuzz('idle'), 2200);
        return;
      }
      // The new session swaps in the signed-in app and lands on Chats.
      setBuzz('ok');
    });
  };

  const fields: ['email' | 'lpw', string][] = [
    ['email', 'EMAIL'],
    ['lpw', 'PASSWORD'],
  ];

  return (
    <Screen style={{ backgroundColor: C.sun }}>
      <View style={{ ...fill, backgroundImage: 'radial-gradient(circle at 80% 12%, rgba(255,255,255,.6), rgba(255,255,255,0) 40%)' } as ViewStyle} />
      <View style={{ ...fill, backgroundImage: 'radial-gradient(circle, rgba(17,17,17,.08) 1px, transparent 1px)', backgroundSize: '18px 18px' } as ViewStyle} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: top + 11, paddingHorizontal: 22, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Press
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))}
              accessibilityLabel="Back"
              pressed={pushed(2, 1)}
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(3) }}>
              <Icon d={ICON.back} size={18} sw={2.6} />
            </Press>
            <T f={F.cav7} s={22} style={{ transform: [{ rotate: '-4deg' }] }}>
              knock knock…
            </T>
          </View>
          <View style={{ marginTop: 18 }}>
            <T f={F.d8} s={46} lh={44} ls={-2}>
              Buzz yourself
            </T>
            <View style={{ alignSelf: 'flex-start', backgroundColor: C.ink, borderRadius: 14, paddingHorizontal: 10, transform: [{ rotate: '-2deg' }] }}>
              <T f={F.d8} s={46} lh={48} ls={-2} c={C.sun}>
                back in.
              </T>
            </View>
          </View>

          <A key={'sh' + shake} style={[{ marginTop: 22 }, shake && buzz === 'err' ? anim(skShake(10), 0.45) : null]}>
            <View
              style={
                {
                  borderWidth: 3,
                  borderColor: C.ink,
                  borderRadius: 26,
                  paddingTop: 18,
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                  backgroundImage: 'linear-gradient(180deg, #eef0f3, #c8ccd3 55%, #dde0e6)',
                  boxShadow: '6px 6px 0 #111, 0 26px 38px rgba(120,80,0,.32), inset 0 2px 0 rgba(255,255,255,.8)',
                } as ViewStyle
              }>
              <View
                pointerEvents="none"
                style={
                  {
                    ...fill,
                    borderRadius: 23,
                    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.22) 1px, rgba(0,0,0,.035) 1px)',
                    backgroundSize: '3px 100%',
                  } as ViewStyle
                }
              />
              <Screw pos={{ left: 9, top: 9 }} />
              <Screw pos={{ right: 9, top: 9 }} />
              <Screw pos={{ left: 9, bottom: 9 }} />
              <Screw pos={{ right: 9, bottom: 9 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                <View
                  style={
                    {
                      width: 86,
                      height: 26,
                      borderRadius: 8,
                      backgroundImage: 'radial-gradient(circle, #2a2c31 1.8px, rgba(0,0,0,0) 2.4px)',
                      backgroundSize: '8px 8px',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,.3)',
                    } as ViewStyle
                  }
                />
                <T f={F.m7} s={11} ls={2} c="#6a6e77" style={{ textShadowColor: '#fff', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 }}>
                  UNIT 214
                </T>
                <A
                  style={[
                    {
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: C.ink,
                      backgroundColor: led,
                      boxShadow: `0 0 10px 2px ${led}, inset 0 -2px 3px rgba(0,0,0,.3)`,
                    } as ViewStyle,
                    buzz === 'check' ? anim(skBlink(), 0.4, 0, 'linear', 'infinite') : null,
                  ]}
                />
              </View>
              <View
                style={
                  {
                    marginTop: 12,
                    height: 52,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: C.ink,
                    backgroundImage: 'radial-gradient(ellipse at 50% 40%, #1f3a22, #0f1d11)',
                    boxShadow: 'inset 0 3px 8px rgba(0,0,0,.6)',
                    overflow: 'hidden',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                  } as ViewStyle
                }>
                <View
                  pointerEvents="none"
                  style={{ ...fill, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,.25) 1px, rgba(0,0,0,0) 1px)', backgroundSize: '100% 3px' } as ViewStyle}
                />
                <T
                  f={F.m7}
                  s={16}
                  ls={1}
                  c="#A6FFA8"
                  lines={1}
                  style={{ flexShrink: 1, textShadowColor: 'rgba(120,255,140,.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }}>
                  {lcd}
                </T>
                <A
                  style={[
                    { width: 9, height: 18, marginLeft: 3, backgroundColor: '#A6FFA8', boxShadow: '0 0 8px rgba(120,255,140,.8)' },
                    anim(skBlink(), 1, 0, 'linear', 'infinite'),
                  ]}
                />
              </View>
              <View style={{ marginTop: 14, gap: 10 }}>
                {fields.map(([k, label]) => (
                  <View key={k}>
                    <T f={F.m7} s={10} ls={1.5} c="#5d616a" style={{ paddingLeft: 4, textShadowColor: 'rgba(255,255,255,.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 }}>
                      {label}
                    </T>
                    <TextInput
                      value={s[k]}
                      onChangeText={(v) => s.set({ [k]: v } as any)}
                      onFocus={() => setFocus(k)}
                      onBlur={() => setFocus(null)}
                      secureTextEntry={k === 'lpw'}
                      keyboardType={k === 'email' ? 'email-address' : 'default'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete={k === 'email' ? 'email' : 'current-password'}
                      onSubmitEditing={k === 'lpw' ? press : undefined}
                      accessibilityLabel={label.toLowerCase()}
                      style={
                        {
                          marginTop: 4,
                          borderWidth: 2,
                          borderColor: C.ink,
                          borderRadius: 12,
                          backgroundColor: focus === k ? '#EEF1FF' : '#fff',
                          boxShadow: 'inset 0 3px 5px rgba(0,0,0,.12), 0 1px 0 rgba(255,255,255,.8)',
                          fontFamily: F.d7,
                          fontSize: 18,
                          color: C.ink,
                          paddingVertical: 9,
                          paddingHorizontal: 12,
                          outlineStyle: 'none',
                        } as any
                      }
                    />
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
                <View style={{ gap: 10 }}>
                  <Press
                    onPress={() => setRemember((r) => !r)}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: remember }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <Toggle on={remember} />
                    <T f={F.b7} s={13.5}>
                      Remember me
                    </T>
                  </Press>
                  <Press
                    accessibilityRole="button"
                    onPress={() => {
                      if (!/^\S+@\S+\.\S+$/.test(s.email)) return setResetNote('Type your email first.');
                      resetPassword(s.email).then(({ error }) => setResetNote(error ?? 'Reset link sent — check your mail.'));
                    }}>
                    <T f={F.b7} s={13.5} style={{ textDecorationLine: 'underline' }}>
                      Forgot password?
                    </T>
                  </Press>
                  {resetNote ? (
                    <T f={F.b6} s={11.5} c="#5d616a" style={{ maxWidth: 150 }}>
                      {resetNote}
                    </T>
                  ) : null}
                </View>
                <View style={{ width: 96, height: 96 }}>
                  {buzz === 'check' ? (
                    <Svg width={170} height={110} viewBox="0 0 170 110" style={{ position: 'absolute', left: -37, top: -7 }} pointerEvents="none">
                      <DrawPath
                        d="M24 30 q-12 25 0 50 M10 20 q-18 35 0 70 M146 30 q12 25 0 50 M160 20 q18 35 0 70"
                        fill="none"
                        stroke={C.ink}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        len={80}
                        dur={0.8}
                      />
                    </Svg>
                  ) : null}
                  <View
                    style={
                      {
                        ...fill,
                        borderRadius: 48,
                        borderWidth: 2,
                        borderColor: C.ink,
                        backgroundImage: 'linear-gradient(180deg, #9a9ea7, #e3e5ea)',
                        boxShadow: 'inset 0 3px 6px rgba(0,0,0,.35)',
                      } as ViewStyle
                    }
                  />
                  <Press
                    onPress={press}
                    accessibilityRole="button"
                    accessibilityLabel="Buzz to log in"
                    pressed={{ transform: [{ translateY: 5 }], boxShadow: '0 0 0 #7d1a07, 0 3px 5px rgba(0,0,0,.35)' } as ViewStyle}
                    style={
                      {
                        position: 'absolute',
                        left: 9,
                        top: 9,
                        right: 9,
                        bottom: 9,
                        borderRadius: 39,
                        borderWidth: 2.5,
                        borderColor: C.ink,
                        backgroundImage: 'radial-gradient(circle at 34% 28%, #ff9a85, #FF4F2E 50%, #c3290d)',
                        boxShadow: '0 5px 0 #7d1a07, 0 9px 12px rgba(0,0,0,.35)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      } as ViewStyle
                    }>
                    <T f={F.d8} s={18} c="#fff" style={{ textShadowColor: 'rgba(0,0,0,.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0 }}>
                      BUZZ
                    </T>
                  </Press>
                </View>
              </View>
            </View>
          </A>
          <View style={{ marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 2, backgroundColor: 'rgba(17,17,17,.15)' }} />
            <T f={F.b7} s={13} c="rgba(17,17,17,.55)">
              or
            </T>
            <View style={{ flex: 1, height: 2, backgroundColor: 'rgba(17,17,17,.15)' }} />
          </View>
          <Press
            onPress={google}
            disabled={googleBusy}
            accessibilityRole="button"
            accessibilityLabel="Log in with Google"
            pressed={pushed(3, 1)}
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderRadius: 18,
              backgroundColor: '#fff',
              borderWidth: 2,
              borderColor: C.ink,
              paddingVertical: 15,
              opacity: googleBusy ? 0.7 : 1,
              ...hard(4),
            }}>
            <GoogleG />
            <T f={F.d8} s={17}>
              {googleBusy ? 'Opening Google…' : 'Log in with Google'}
            </T>
          </Press>
          {googleErr ? (
            <T f={F.b6} s={13} c="#C8391F" center style={{ marginTop: 8 }}>
              {googleErr}
            </T>
          ) : null}
          <View style={{ flex: 1, minHeight: 24 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <T s={14}>New here? </T>
            <Press onPress={() => router.replace('/signup')} accessibilityRole="link">
              <T f={F.b7} s={14} c={C.cobalt}>
                Make a space
              </T>
            </Press>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

