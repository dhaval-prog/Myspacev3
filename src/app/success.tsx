// 07 Your pass — the pass drops on a lanyard, holo foil, tilt it to shine.
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useMyProfile } from '@/state/profile';
import { useStore } from '@/state/store';
import { useAuth } from '@/v2/context/AuthContext';
import { useFriends } from '@/v2/context/FriendsContext';
import { useGameStats } from '@/v2/context/GameStatsContext';
import { supabase } from '@/v2/lib/supabase';
import { anim, E, skDrop, skFall, skSlide, skStamp, skSwing, skUp } from '@/theme/anim';
import { C, F, hard } from '@/theme/tokens';
import { AvatarFace } from '@/ui/AvatarFace';
import { Barcode, Sheen, Stripes } from '@/ui/kit';
import { A, Press, pushed, Stage, T, useStatusBar, useY } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 31 + 9) % 370,
  s: 12 + (i % 3) * 6,
  round: i % 2 === 1,
  bg: [C.sun, C.tomato, '#fff', C.sky][i % 4],
  d: 3.5 + (i % 4) * 0.6,
  del: (i % 7) * 0.4,
}));

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function Pass() {
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const { friends } = useFriends();
  const { statsFor } = useGameStats();
  const [letters, setLetters] = useState(0);
  useEffect(() => {
    if (!user) return;
    supabase
      .from('throws')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .then(({ count }) => setLetters(count ?? 0));
  }, [user]);
  const since = profile?.createdAt ? new Date(profile.createdAt) : new Date();
  const games = user ? statsFor(user.id).gamesPlayed : 0;
  const memberNo = '#' + (user?.id.replace(/[^0-9]/g, '').slice(0, 6).padEnd(6, '0') ?? '000000');
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const [size, setSize] = useState({ w: 290, h: 300 });
  const tilt = Gesture.Pan()
    .minDistance(0)
    .onUpdate((e) => {
      const x = e.x / size.w - 0.5;
      const y = e.y / size.h - 0.5;
      rx.value = withTiming(-y * 16, { duration: 200 });
      ry.value = withTiming(x * 18, { duration: 200 });
    })
    .onFinalize(() => {
      rx.value = withTiming(0, { duration: 200 });
      ry.value = withTiming(0, { duration: 200 });
    });
  const st = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }],
  }));
  const onSize = (w: number, h: number) => setSize({ w, h });

  return (
    <GestureDetector gesture={tilt}>
      <Animated.View style={[{ marginTop: -12 }, st]} onLayout={(e) => onSize(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}>
        <View
          style={
            {
              backgroundImage: 'linear-gradient(160deg, #FBF8F1, #F4EFE3 60%, #E9E2D2)',
              borderWidth: 3,
              borderColor: C.ink,
              borderRadius: 24,
              boxShadow: '8px 8px 0 #111, 0 30px 50px rgba(0,0,0,.35)',
              overflow: 'hidden',
            } as ViewStyle
          }>
          {/* holo foil header */}
          <View
            style={{
              height: 66,
              borderBottomWidth: 3,
              borderColor: C.ink,
              overflow: 'hidden',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingHorizontal: 16,
              paddingBottom: 10,
            }}>
            <A
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 568,
                  backgroundImage: 'linear-gradient(115deg, #FFD23F, #FFB4C8, #9EB3FF, #7FE0A6, #FFD23F, #FFB4C8)',
                } as ViewStyle,
                anim(skSlide(0, -284), 5, 0, 'linear', 'infinite'),
              ]}
            />
            <Stripes angle={45} color="rgba(255,255,255,.28)" width={2} gap={4} />
            <View
              style={{
                position: 'absolute',
                left: '50%',
                top: 9,
                marginLeft: -24,
                width: 48,
                height: 11,
                borderRadius: 6,
                backgroundColor: C.cobalt,
                borderWidth: 2,
                borderColor: C.ink,
                boxShadow: 'inset 0 2px 3px rgba(0,0,0,.4)',
              }}
            />
            <T f={F.d8} s={21} ls={-0.4}>
              myspace pass
            </T>
            <T f={F.m7} s={11}>
              {memberNo}
            </T>
          </View>
          <View style={{ paddingTop: 18, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                backgroundColor: '#fff',
                padding: 6,
                boxShadow: '0 0 0 2px #111, 0 8px 14px rgba(17,17,17,.25)',
                transform: [{ rotate: '-6deg' }],
              }}>
              <AvatarFace size={80} ring={4} font={30} name={profile?.name} color={profile?.avatarColor} photo={profile?.avatarUrl ?? null} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <T f={F.d8} s={23} lh={25} ls={-0.8}>
                {profile?.name ?? ' '}
              </T>
              <T f={F.m4} s={12} style={{ marginTop: 4 }}>
                {profile?.username ? '@' + profile.username : profile?.friendCode ? 'CODE ' + profile.friendCode : ''}
              </T>
              <T f={F.m4} s={10.5} c={C.ink60} style={{ marginTop: 3 }}>
                MEMBER SINCE {MONTHS[since.getMonth()]} {since.getFullYear()}
              </T>
            </View>
          </View>
          <View
            style={{
              borderTopWidth: 2,
              borderStyle: 'dashed',
              borderColor: C.ink,
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            {[`FRIENDS ${friends.length}`, `LETTERS ${letters}`, `GAMES ${games}`].map((x) => (
              <T key={x} f={F.m7} s={11}>
                {x}
              </T>
            ))}
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 14, opacity: 0.85 }}>
            <Barcode height={30} />
          </View>
          <Sheen w={87} h={480} top={-90} dur={4} delay={1.4} alpha={0.5} />
        </View>
        <A
          style={[
            {
              position: 'absolute',
              right: -16,
              top: 52,
              width: 66,
              height: 66,
              borderRadius: 33,
              backgroundColor: C.tomato,
              borderWidth: 2,
              borderColor: C.ink,
              alignItems: 'center',
              justifyContent: 'center',
              ...hard(3),
            },
            anim(skStamp(12), 0.55, 1.3, E.out),
          ]}>
          <T f={F.d8} s={19} c="#fff">
            NEW!
          </T>
        </A>
      </Animated.View>
    </GestureDetector>
  );
}

export default function Success() {
  const { afterAuth, set } = useStore();
  // We've landed here after sign-up; next launch should go straight to Chats.
  useEffect(() => {
    if (afterAuth) set({ afterAuth: null });
  }, [afterAuth, set]);
  const { top } = useStatusBar();
  const y = useY();
  return (
    <Screen bar="#fff" style={{ backgroundColor: C.cobalt, paddingTop: top + 11, paddingHorizontal: 22, paddingBottom: 24, alignItems: 'center' }}>
      <View
        pointerEvents="none"
        style={
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          } as ViewStyle
        }
      />
      <Stage>
        {CONFETTI.map((c, i) => (
          <A
            key={i}
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: c.x,
                top: -40,
                width: c.s,
                height: c.s,
                borderRadius: c.round ? c.s / 2 : 4,
                backgroundColor: c.bg,
                borderWidth: 2,
                borderColor: C.ink,
              },
              anim(skFall(), c.d, c.del, 'linear', 'infinite'),
            ]}
          />
        ))}
        {/* lanyard + pass: drops in, then swings */}
        <A
          style={
            {
              position: 'absolute',
              left: 50,
              top: y(-60),
              width: 290,
              zIndex: 2,
              transformOrigin: '50% 0%',
              animationName: [skDrop(), skSwing()],
              animationDuration: ['1s', '4.5s'],
              animationDelay: ['0.15s', '1.15s'],
              animationTimingFunction: [E.out, 'ease-in-out'],
              animationIterationCount: [1, 'infinite'],
              animationFillMode: ['both', 'none'],
            } as any
          }>
          <View
            style={
              {
                alignSelf: 'center',
                width: 34,
                height: 170,
                borderLeftWidth: 2,
                borderRightWidth: 2,
                borderColor: C.ink,
                backgroundImage: 'linear-gradient(90deg, #d63c1f, #FF4F2E 30%, #ff6a4d 50%, #FF4F2E 70%, #d63c1f)',
                overflow: 'hidden',
              } as ViewStyle
            }>
            <View
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,.1) 1px, rgba(0,0,0,0) 1px)', backgroundSize: '100% 3px' } as ViewStyle}
            />
            <View style={{ position: 'absolute', left: (30 - 160) / 2, top: (170 - 30) / 2, width: 160, height: 30, justifyContent: 'center', transform: [{ rotate: '-90deg' }] }}>
              <T f={F.m7} s={10} ls={2} c="#fff" style={{ paddingLeft: 10 }}>
                MYSPACE ✦ MYSPACE
              </T>
            </View>
          </View>
          <View
            style={
              {
                alignSelf: 'center',
                marginTop: -2,
                width: 44,
                height: 28,
                borderWidth: 2,
                borderColor: C.ink,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                backgroundImage: 'linear-gradient(180deg, #f4f5f7, #b9bcc4 45%, #e7e9ee 60%, #8d9099)',
                boxShadow: '0 4px 6px rgba(0,0,0,.3)',
                zIndex: 2,
              } as ViewStyle
            }
          />
          <Pass />
        </A>
        <A style={[{ position: 'absolute', left: 18, top: y(150), zIndex: 3 }, anim(skUp(), 0.5, 1.4)]}>
          <T
            f={F.cav7}
            s={30}
            c={C.sun}
            style={{ transform: [{ rotate: '-12deg' }], textShadowColor: C.ink, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 }}>
            yay!
          </T>
        </A>
      </Stage>
      <View style={{ height: 416 }} />
      <A style={[{ marginTop: 22 }, anim(skUp(), 0.5, 1)]}>
        <T f={F.d8} s={38} lh={38} ls={-1.6} c="#fff" center>
          {'Your space\nis live!'}
        </T>
      </A>
      <View style={{ flex: 1 }} />
      <A style={[{ alignSelf: 'stretch' }, anim(skUp(), 0.5, 1.2)]}>
        <Press
          onPress={() => router.push('/friends')}
          accessibilityRole="button"
          pressed={pushed(4, 1)}
          style={{ borderRadius: 20, backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, paddingVertical: 18, alignItems: 'center', ...hard(5) }}>
          <T f={F.d8} s={20}>
            Add my first friend
          </T>
        </Press>
      </A>
    </Screen>
  );
}
