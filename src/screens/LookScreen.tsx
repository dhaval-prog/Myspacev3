// 04 Pick your look — add a photo, pick a colour; the die-cut sticker re-paints.
// mode 'signup': last onboarding step, creates the account.
// mode 'edit': change your colour/photo any time after sign-up (saved to your profile).
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { backToTab } from '@/ui/nav';
import { useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useSetOwnAvatarColor } from '@/state/avatarColors';
import { saveAvatarColor, uploadAvatar, useMyProfile } from '@/state/profile';
import { SWATCH_NAMES, SWATCHES, useStore } from '@/state/store';
import { useAuth } from '@/v2/context/AuthContext';
import { supabase } from '@/v2/lib/supabase';
import { AvatarFace } from '@/ui/AvatarFace';
import { anim, E, loop, skRepaint, skTwinkle } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { DrawPath, Sheen, Spinner } from '@/ui/kit';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

export function LookScreen({ mode }: { mode: 'signup' | 'edit' }) {
  const edit = mode === 'edit';
  const s = useStore();
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const setOwnColor = useSetOwnAvatarColor();
  // Edit mode keeps its own draft, seeded from the saved profile.
  const [draft, setDraft] = useState<{ av: number; photo: string | null } | null>(null);
  const cur = edit ? (draft ?? { av: profile?.avatarColor ?? 0, photo: profile?.avatarUrl ?? null }) : { av: s.av, photo: s.photo };
  const setLook = (patch: Partial<{ av: number; photo: string | null }>) => (edit ? setDraft({ ...cur, ...patch }) : s.set(patch));
  const [saved, setSaved] = useState(false);
  const { top } = useStatusBar();
  const [rp, setRp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avBg] = SWATCHES[cur.av];

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!res.canceled && res.assets[0]) setLook({ photo: res.assets[0].uri });
  };
  // Creates the real account. With email confirmation on, there's no session yet and we go to
  // "Check mail"; otherwise the new session takes over and the app lands on the pass (/success).
  const save = async () => {
    if (!user || loading) return;
    setLoading(true);
    setError(null);
    let avatarUrl: string | null | undefined;
    if (cur.photo !== (profile?.avatarUrl ?? null)) {
      if (cur.photo) {
        const up = await uploadAvatar(user.id, cur.photo);
        if (up.error) {
          setLoading(false);
          return setError(up.error);
        }
        avatarUrl = up.url;
      } else avatarUrl = null;
    }
    const { error: err } = await supabase
      .from('profiles')
      .update({ avatar_color: cur.av, ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}) })
      .eq('id', user.id);
    if (!err) await saveAvatarColor(cur.av);
    setLoading(false);
    if (err) return setError(err.message);
    setOwnColor(user.id, cur.av);
    setSaved(true);
    setTimeout(() => (router.canGoBack() ? router.back() : backToTab('/chat')), 450);
  };

  const submit = async () => {
    if (edit) return save();
    if (loading) return;
    if (!s.name.trim() || !s.email.trim() || s.pw.length < 8) {
      setError('Finish the sign-up steps first.');
      return;
    }
    setLoading(true);
    setError(null);
    s.set({ afterAuth: '/success' });
    const { data, error: err } = await supabase.auth.signUp({
      email: s.email.trim(),
      password: s.pw,
      options: { data: { full_name: s.name.trim(), avatar_color: s.av } },
    });
    setLoading(false);
    if (err) {
      s.set({ afterAuth: null });
      setError(err.message);
      return;
    }
    if (!data.session) router.push('/verify');
  };

  return (
    <Screen style={{ paddingTop: top + 11, paddingHorizontal: 22, paddingBottom: 24 }}>
      <View
        pointerEvents="none"
        style={
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(17,17,17,.07) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          } as ViewStyle
        }
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Press
          onPress={() => (router.canGoBack() ? router.back() : router.replace(edit ? '/chat' : '/signup'))}
          accessibilityLabel="Back"
          pressed={pushed(2, 1)}
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, alignItems: 'center', justifyContent: 'center', ...hard(3) }}>
          <Icon d={ICON.back} size={18} sw={2.6} />
        </Press>
        <View style={{ backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 }}>
          <T f={F.m7} s={12}>
            {edit ? 'YOUR LOOK' : 'STEP 2/2'}
          </T>
        </View>
      </View>
      <View style={{ marginTop: 22 }}>
        <T f={F.d8} s={42} lh={41} ls={-1.8}>
          Pick your
        </T>
        <T f={F.d8} s={42} lh={41} ls={-1.8} c={C.tomato}>
          sticker.
        </T>
      </View>
      <T s={14.5} lh={20} c={C.ink62} style={{ marginTop: 6 }}>
        Add a photo, pick a colour. It&apos;s how friends spot you on chats and the map.
      </T>

      {/* sticker */}
      <View style={{ marginTop: 20, alignSelf: 'center', width: 200, height: 200 }}>
        <Svg width={260} height={250} viewBox="0 0 260 250" style={{ position: 'absolute', left: -30, top: -22 }} pointerEvents="none">
          <DrawPath
            d="M14 196 c10 -14 22 6 32 -8 s22 6 32 -8"
            fill="none"
            stroke={C.ink}
            strokeWidth={3.5}
            strokeLinecap="round"
            len={110}
            dur={3.6}
            delay={0.3}
          />
          <Path d="M20 40 l10 10 M36 28 l2 14 M8 60 l14 2" fill="none" stroke={C.tomato} strokeWidth={3.5} strokeLinecap="round" />
        </Svg>
        <A pointerEvents="none" style={[{ position: 'absolute', left: 166, top: -10, width: 36, height: 36 }, loop(skTwinkle(), 2)]}>
          <Svg width={36} height={36} viewBox="196 34 36 36">
            <Path d="M214 34 q4 15 18 18 q-14 4 -18 18 q-4 -14 -18 -18 q14 -3 18 -18z" fill={avBg} stroke={C.ink} strokeWidth={2.5} />
          </Svg>
        </A>
        <A pointerEvents="none" style={[{ position: 'absolute', left: 201, top: 62, width: 18, height: 18 }, loop(skTwinkle(), 2, 0.7)]}>
          <Svg width={18} height={18} viewBox="231 84 18 18">
            <Path d="M240 84 q2 8 9 9 q-7 2 -9 9 q-2 -7 -9 -9 q7 -1 9 -9z" fill="#fff" stroke={C.ink} strokeWidth={2} />
          </Svg>
        </A>
        <A key={'rp' + rp} style={[{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }, anim(skRepaint(), 0.5, 0, E.s13)]}>
          <View
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: '#fff',
              padding: 10,
              boxShadow: '0 0 0 3px #111, 7px 8px 0 3px #111, 0 22px 34px rgba(17,17,17,.3)',
              overflow: 'hidden',
            }}>
            <AvatarFace size={180} ring={7} font={64} color={cur.av} photo={cur.photo} name={edit ? profile?.name : undefined} />
            <Sheen w={68} h={280} top={-40} dur={3.6} delay={1} />
            <View
              pointerEvents="none"
              style={
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 100,
                  backgroundImage: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,.45), rgba(255,255,255,0) 38%)',
                } as ViewStyle
              }
            />
          </View>
          <View
            style={{
              position: 'absolute',
              right: -18,
              bottom: 16,
              backgroundColor: C.ink,
              borderRadius: 10,
              paddingVertical: 5,
              paddingHorizontal: 10,
              transform: [{ rotate: '8deg' }],
              ...hard(3, 3, avBg),
            }}>
            <T f={F.m7} s={11} ls={1} c="#fff">
              {SWATCH_NAMES[cur.av]}
            </T>
          </View>
        </A>
      </View>

      <View style={{ marginTop: 26, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
        <Press
          onPress={pick}
          accessibilityRole="button"
          pressed={pushed(2, 1)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            borderRadius: 999,
            backgroundColor: '#fff',
            borderWidth: 2,
            borderColor: C.ink,
            paddingVertical: 11,
            paddingHorizontal: 18,
            ...hard(3),
          }}>
          <Icon d={ICON.camera} size={18} sw={2.4} />
          <T f={F.b7} s={14.5}>
            {cur.photo ? 'Change photo' : 'Add your photo'}
          </T>
        </Press>
        {cur.photo ? (
          <Press
            onPress={() => setLook({ photo: null })}
            accessibilityRole="button"
            style={{ justifyContent: 'center', borderRadius: 999, borderWidth: 2, borderColor: C.ink, paddingVertical: 11, paddingHorizontal: 16 }}>
            <T f={F.b7} s={14.5}>
              Remove
            </T>
          </Press>
        ) : null}
      </View>

      <View style={{ marginTop: 22, flexDirection: 'row', gap: 8 }}>
        {SWATCHES.map(([bg, fg], i) => {
          const on = i === cur.av;
          return (
            <Press
              key={i}
              onPress={() => {
                setLook({ av: i });
                setRp((x) => x + 1);
              }}
              accessibilityLabel={`Colour ${SWATCH_NAMES[i].toLowerCase()}`}
              accessibilityState={{ selected: on }}
              style={
                {
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: 999,
                  backgroundColor: bg,
                  backgroundImage:
                    'radial-gradient(circle at 32% 28%, rgba(255,255,255,.8) 0%, rgba(255,255,255,.8) 9%, rgba(255,255,255,0) 40%), radial-gradient(circle at 70% 80%, rgba(0,0,0,.18), rgba(0,0,0,0) 55%)',
                  borderWidth: 2,
                  borderColor: C.ink,
                  boxShadow: on ? '3px 3px 0 #111' : '1px 1px 0 #111',
                  transform: on ? [{ translateX: -2 }, { translateY: -3 }, { scale: 1.12 }] : [],
                  alignItems: 'center',
                  justifyContent: 'center',
                } as ViewStyle
              }>
              {on ? <Icon d={ICON.check} size={16} color={fg} sw={3.4} /> : null}
            </Press>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      {edit ? (
        <Press onPress={() => router.push('/account')} accessibilityRole="link" style={{ alignSelf: 'center', paddingVertical: 10, marginBottom: 4 }}>
          <T f={F.b7} s={14} style={{ textDecorationLine: 'underline' }}>
            Account settings →
          </T>
        </Press>
      ) : null}
      {error ? (
        <T f={F.b6} s={13.5} c="#C8391F" center style={{ marginBottom: 10 }}>
          {error}
        </T>
      ) : null}
      <Press
        onPress={submit}
        accessibilityRole="button"
        pressed={pushed(4, 1, C.tomato)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          borderRadius: 20,
          backgroundColor: C.ink,
          borderWidth: 2,
          borderColor: C.ink,
          paddingVertical: 18,
          ...hard(5, 5, C.tomato),
        }}>
        {loading ? <Spinner /> : null}
        <T f={F.d8} s={20} c={C.sun}>
          {edit ? (saved ? 'Saved ✓' : loading ? 'Saving…' : 'Save my look') : loading ? 'Creating…' : 'Create my space'}
        </T>
      </Press>
    </Screen>
  );
}
