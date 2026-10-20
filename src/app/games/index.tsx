// G1 Games hub — leaderboard, points card, tap a game card to open Create / Join.
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { anim, E, skPop } from '@/theme/anim';
import { firstOf } from '@/state/store';
import { C, dots, F, groupIN, hard } from '@/theme/tokens';
import { Person } from '@/ui/Person';
import { useGameStats } from '@/v2/context/GameStatsContext';
import { A, Icon, ICON, Press, pushed, T, useStatusBar } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';

function PointsRing({ pct, points }: { pct: number; points: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={80} height={80} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Circle cx={40} cy={40} r={r} fill="none" stroke={C.sun} strokeWidth={40} strokeDasharray={[c * pct, c]} transform="rotate(-90 40 40)" />
      </Svg>
      <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: C.ink, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <T f={F.d8} s={19} ls={-0.8}>
          {groupIN(points)}
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
  onJoin,
}: {
  open: boolean;
  bg: string;
  tilt: number;
  onToggle: () => void;
  head: ReactNode;
  primary: [string, string];
  onCreate: () => void;
  onJoin: () => void;
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
            onPress={onJoin}
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
  const { leaderboard, myEntry, myRankDelta, breakdown, circle } = useGameStats();
  const podium = leaderboard.slice(0, 3);
  const myPts = myEntry?.stats.totalPoints ?? 0;
  const top1 = leaderboard[0]?.stats.totalPoints ?? 0;
  const toFirst = Math.max(0, top1 - myPts);
  const net = (type: string) => breakdown.find((b) => b.gameType === type)?.net ?? 0;
  const npatPts = Math.max(0, net('NPAT'));
  const trivPts = Math.max(0, net('TRIVIA'));
  const barMax = Math.max(1, npatPts + trivPts);
  const BADGE = [C.tomato, C.lime, '#fff'];
  return (
    <Screen style={{ backgroundColor: C.paper, ...(dots(0.07, 16) as ViewStyle) }}>
      <ScrollView contentContainerStyle={{ paddingTop: top + 18, paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T f={F.d8} s={36} ls={-1.4}>
            Games
          </T>
          <View style={{ backgroundColor: C.sun, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, transform: [{ rotate: '3deg' }], ...hard(2) }}>
            <T f={F.m7} s={10.5} ls={1}>
              {circle.length} SEATED
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
            {podium.map((e, i) => (
              <A key={e.userId} style={[{ flex: 1, alignItems: 'center', gap: 5 }, anim(skPop(), 0.4, 0.1 + i * 0.06, E.s14)]}>
                <View style={{ width: 54, height: 54 }}>
                  <Person
                    id={e.userId}
                    name={e.isSelf ? 'You' : e.name}
                    avatarUrl={e.avatarUrl}
                    size={54}
                    font={16}
                    ink={i === 0 ? '#fff' : C.ink}
                    bg={BADGE[i]}
                    style={{ borderWidth: 2, borderColor: C.ink }}
                  />
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
                      {e.rank}
                    </T>
                  </View>
                </View>
                <T f={e.isSelf ? F.b8 : F.b6} s={12} lines={1}>
                  {e.isSelf ? 'You' : firstOf(e.name)}
                </T>
                <T f={F.m4} s={10} c={C.ink60} style={{ marginTop: -3 }}>
                  {groupIN(e.stats.totalPoints)}
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
          <PointsRing pct={top1 ? Math.min(1, myPts / top1) : 0} points={myPts} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <T f={F.d8} s={20} c="#fff">
                Rank #{myEntry?.rank ?? '–'}
              </T>
              {myRankDelta ? (
                <View style={{ backgroundColor: myRankDelta > 0 ? C.lime : C.tomato, borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 1, paddingHorizontal: 7 }}>
                  <T f={F.m7} s={10}>
                    {myRankDelta > 0 ? '▲' : '▼'} {Math.abs(myRankDelta)}
                  </T>
                </View>
              ) : null}
            </View>
            <T f={F.m4} s={10} ls={0.8} c="#fff">
              {myEntry?.rank === 1 ? 'TOP OF YOUR CIRCLE' : `${groupIN(toFirst)} PTS TO #1`}
            </T>
            <Bar label="NPAT" pct={(npatPts / barMax) * 100} color={C.tomato} val={groupIN(npatPts)} />
            <Bar label="TRIVIA" pct={(trivPts / barMax) * 100} color={C.sun} val={groupIN(trivPts)} />
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
            onCreate={() => router.push({ pathname: '/games/npat', params: { tab: 'create' } })}
            onJoin={() => router.push({ pathname: '/games/npat', params: { tab: 'join' } })}
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
            onCreate={() => router.push({ pathname: '/games/trivia', params: { tab: 'create' } })}
            onJoin={() => router.push({ pathname: '/games/trivia', params: { tab: 'join' } })}
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
