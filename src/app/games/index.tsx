// G1 Games hub — leaderboard, points card, tap a game card to open Create / Join.
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { anim, E, skPop } from '@/theme/anim';
import { C, dots, F, hard } from '@/theme/tokens';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';

const TOP: [string, string, number, string, string, string][] = [
  ['Aarav', 'AK', 1, '1,420', C.tomato, '#fff'],
  ['You', 'YO', 2, '1,240', C.lime, C.ink],
  ['Priya', 'PS', 3, '980', '#fff', C.ink],
];

function PointsRing({ pct }: { pct: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={80} height={80} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Circle cx={40} cy={40} r={r} fill="none" stroke={C.sun} strokeWidth={40} strokeDasharray={[c * pct, c]} transform="rotate(-90 40 40)" />
      </Svg>
      <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <T f={F.d8} s={19} ls={-0.8}>
          1,240
        </T>
        <T f={F.m4} s={7.5} ls={1}>
          POINTS
        </T>
      </View>
    </View>
  );
}

function Bar({ label, pct, color, val }: { label: string; pct: number; color: string; val: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <T f={F.m4} s={9.5} c="#fff" style={{ width: 44 }}>
        {label}
      </T>
      <View style={{ flex: 1, height: 10, borderWidth: 2, borderColor: C.ink, borderRadius: 999, backgroundColor: '#fff', overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
      </View>
      <T f={F.m4} s={10} c="#fff">
        {val}
      </T>
    </View>
  );
}

function GameCard({
  open,
  bg,
  tilt,
  onToggle,
  head,
  primary,
  onCreate,
}: {
  open: boolean;
  bg: string;
  tilt: number;
  onToggle: () => void;
  head: ReactNode;
  primary: [string, string];
  onCreate: () => void;
}) {
  return (
    <A
      style={
        {
          backgroundColor: bg,
          borderWidth: 2,
          borderColor: C.ink,
          borderRadius: 22,
          overflow: 'hidden',
          boxShadow: open ? '6px 6px 0 #111' : '3px 3px 0 #111',
          transform: [{ rotate: open ? `${tilt}deg` : '0deg' }],
          transitionProperty: ['transform', 'boxShadow'],
          transitionDuration: ['300ms', '200ms'],
          transitionTimingFunction: [E.s14, 'ease'],
        } as any
      }>
      <Press onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        {head}
      </Press>
      {open ? (
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
          <Press
            onPress={onCreate}
            accessibilityRole="button"
            pressed={pushed(2, 1)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: primary[0], borderWidth: 2, borderColor: C.ink, ...hard(3) }}>
            <T f={F.b8} s={14} c={primary[1]}>
              Create a game
            </T>
          </Press>
          <Press
            onPress={onCreate}
            accessibilityRole="button"
            style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink }}>
            <T f={F.b7} s={14}>
              Join with code
            </T>
          </Press>
        </View>
      ) : null}
    </A>
  );
}

const TILE: [string, string, number][] = [
  ['N', C.sun, -8],
  ['P', '#fff', 5],
  ['A', C.lime, -4],
  ['T', '#fff', 6],
];

export default function Games() {
  const { top } = useStatusBar();
  const [open, setOpen] = useState<'npat' | 'trivia' | null>('npat');
  return (
    <Screen style={{ backgroundColor: C.paper, ...(dots(0.07, 16) as ViewStyle) }}>
      <ScrollView contentContainerStyle={{ paddingTop: top + 18, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T f={F.d8} s={36} ls={-1.4}>
            Games
          </T>
          <View style={{ backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, transform: [{ rotate: '3deg' }], ...hard(2) }}>
            <T f={F.m7} s={10.5} ls={1}>
              6 SEATED
            </T>
          </View>
        </View>

        {/* leaderboard */}
        <View style={{ marginTop: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16, ...hard(4) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <T f={F.m7} s={10} ls={1.3}>
              LEADERBOARD · THIS WEEK
            </T>
            <T f={F.b7} s={12} c={C.cobalt}>
              See all
            </T>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {TOP.map(([name, ini, rank, pts, bg, fg], i) => (
              <A key={name} style={[{ flex: 1, alignItems: 'center', gap: 5 }, anim(skPop(), 0.4, 0.1 + i * 0.06, E.s14)]}>
                <View style={{ width: 54, height: 54 }}>
                  <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: C.ink, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                    <T f={F.b8} s={16} c={fg}>
                      {ini}
                    </T>
                  </View>
                  <View
                    style={{
                      position: 'absolute',
                      left: -4,
                      top: -4,
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      borderWidth: 2,
                      borderColor: C.ink,
                      backgroundColor: C.sun,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [{ rotate: '-8deg' }],
                    }}>
                    <T f={F.m7} s={10}>
                      {rank}
                    </T>
                  </View>
                </View>
                <T f={name === 'You' ? F.b8 : F.b6} s={12}>
                  {name}
                </T>
                <T f={F.m4} s={10} c={C.ink60} style={{ marginTop: -3 }}>
                  {pts}
                </T>
              </A>
            ))}
            <Press onPress={() => router.push('/friends')} accessibilityLabel="Invite" style={{ flex: 1, alignItems: 'center', gap: 5 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderStyle: 'dashed', borderColor: C.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICON.plus} size={20} sw={2.4} />
              </View>
              <T f={F.m7} s={10} ls={1}>
                INVITE
              </T>
            </Press>
          </View>
        </View>

        {/* points */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: C.cobalt,
            borderWidth: 2,
            borderColor: C.ink,
            borderRadius: 22,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            transform: [{ rotate: '-1deg' }],
            ...hard(4),
          }}>
          <PointsRing pct={0.72} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <T f={F.d8} s={20} c="#fff">
                Rank #2
              </T>
              <View style={{ backgroundColor: C.lime, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 1, paddingHorizontal: 7 }}>
                <T f={F.m7} s={10}>
                  ▲ 1
                </T>
              </View>
            </View>
            <T f={F.m4} s={10} ls={0.8} c="#fff">
              180 PTS TO #1
            </T>
            <Bar label="NPAT" pct={62} color={C.tomato} val="770" />
            <Bar label="TRIVIA" pct={38} color={C.sun} val="470" />
          </View>
        </View>

        <T f={F.m7} s={10} ls={1.3} style={{ marginTop: 20, marginBottom: 10 }}>
          PLAY A GAME
        </T>
        <View style={{ gap: 14 }}>
          <GameCard
            open={open === 'npat'}
            bg={C.tomato}
            tilt={-1.5}
            onToggle={() => setOpen((o) => (o === 'npat' ? null : 'npat'))}
            primary={[C.sun, C.ink]}
            onCreate={() => router.push('/games/npat')}
            head={
              <>
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  {TILE.map(([ch, bg, r]) => (
                    <View
                      key={ch}
                      style={{ width: 22, height: 28, borderWidth: 2, borderColor: C.ink, borderRadius: 6, backgroundColor: bg, transform: [{ rotate: `${r}deg` }], alignItems: 'center', justifyContent: 'center' }}>
                      <T f={F.d8} s={13}>
                        {ch}
                      </T>
                    </View>
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <T f={F.d8} s={17} ls={-0.3} c="#fff">
                    Name, Place, Animal, Thing
                  </T>
                  <T s={12} c="#fff" style={{ marginTop: 2 }}>
                    5 rounds · 60s each
                  </T>
                </View>
              </>
            }
          />
          <GameCard
            open={open === 'trivia'}
            bg={C.sun}
            tilt={1.5}
            onToggle={() => setOpen((o) => (o === 'trivia' ? null : 'trivia'))}
            primary={[C.cobalt, '#fff']}
            onCreate={() => router.push('/games/trivia')}
            head={
              <>
                <View
                  style={{ width: 46, height: 46, borderWidth: 2, borderColor: C.ink, borderRadius: 23, backgroundColor: C.cobalt, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-10deg' }] }}>
                  <T f={F.d8} s={26} c="#fff">
                    ?
                  </T>
                </View>
                <View style={{ flex: 1 }}>
                  <T f={F.d8} s={17} ls={-0.3}>
                    Trivia Night
                  </T>
                  <T s={12} style={{ marginTop: 2 }}>
                    10 questions · think fast
                  </T>
                </View>
              </>
            }
          />
        </View>
      </ScrollView>
      <TabBar active="games" tone="ink" delay={0.2} />
    </Screen>
  );
}
