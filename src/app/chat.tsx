// 09 Home · Chats — new friends land in the rail, tap a row to read it.
import { router } from 'expo-router';
import { ScrollView, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { firstOf, initialsOf, PEOPLE, useStore } from '@/state/store';
import { anim, E, loop, skBob, skPin, skPop, skRing, skSlap, skSlideIn, skUp } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { A, Icon, ICON, Plane, Press, T, useStatusBar } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';

const I = C.deep;
const SK = [C.lime, C.ice, C.coral];
const GOA = 'Goa Trip ’26';

// [name, preview, time, unread count]
const BASE: [string, string, string, number][] = [
  ['Priya Sharma', 'Haha yes, see you at 8!', '2m', 3],
  ['Aarav Kapoor', 'Sent you a letter ✈︎', '18m', 1],
  [GOA, 'Aarav: booked the villa!', '1h', 0],
  ['Meera Iyer', 'Typing…', '1h', 0],
  ['Rohan Das', 'That movie was wild', '3h', 0],
  ['Ananya Rao', 'See you Sunday', '1d', 0],
];

function UnreadPill({ n }: { n: number | string }) {
  return (
    <A style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: I }, anim(skPop(), 0.3)]}>
      <Plane size={11} />
      <T f={F.b6} s={11.5} c={C.lime}>
        {n}
      </T>
    </A>
  );
}

function rowStyle(unread: boolean): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: unread ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.6)',
    borderWidth: unread ? 1.5 : 1,
    borderColor: unread ? I : 'rgba(255,255,255,.5)',
    boxShadow: unread ? `3px 3px 0 ${I}` : 'none',
  } as ViewStyle;
}

export default function Chat() {
  const s = useStore();
  const { top } = useStatusBar();

  const added = PEOPLE.filter((_, i) => s.fadd[i]);
  const fresh = added.filter((u) => !BASE.some((b) => b[0] === u[0])).map((u) => [u[0], 'say hi to your new friend!', 'now', 1] as [string, string, string, number]);
  const rows = [...fresh, ...BASE].map(([name, preview, time, count]) => ({ name, preview, time, count, unread: count > 0 && !s.readMap[name] }));
  const people = rows.filter((r) => r.name !== GOA);
  const gU = !s.readMap[GOA];
  const showLocked = !added.some((u) => u[0] === 'Kabir Shah');

  return (
    <Screen bar={I} style={{ backgroundColor: '#F6F5DF' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: top + 3 + 8, paddingHorizontal: 22, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <A style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, anim(skUp(), 0.45)]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <A style={loop(skBob(), 2.6)}>
              <Svg width={34} height={34} viewBox="0 0 64 64">
                <Path d="M8 52 C14 34 28 52 34 34" fill="none" stroke={I} strokeWidth={4.5} strokeLinecap="round" strokeDasharray="1 8" />
                <Path d="M4 30 L60 8 L38 58 L30 36 Z" transform="translate(28 6) scale(.48)" fill={I} stroke={I} strokeWidth={5} strokeLinejoin="round" />
                <Path d="M30 36 L60 8 L22 40 Z" transform="translate(28 6) scale(.48)" fill={C.coral} />
              </Svg>
            </A>
            <T f={F.b7} s={30} ls={-0.9} c={I}>
              Chats
            </T>
          </View>
          <A style={anim(skPop(), 0.45, 0.2, E.s14)}>
            <Press
              onPress={() => router.push('/friends')}
              accessibilityLabel="New chat"
              pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }] }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: I,
                borderWidth: 1.5,
                borderColor: I,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '3px 3px 0 #C3EA4F, 0 10px 22px rgba(22,33,12,.26)',
              }}>
              <Icon d={ICON.chatPlus} size={22} color={C.lime} sw={1.9} />
            </Press>
          </A>
        </A>

        <T f={F.dm5} s={10.5} ls={1.5} c="rgba(22,33,12,.5)" style={{ marginTop: 22 }}>
          IN THE AIR
        </T>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, marginRight: -22, overflow: 'visible' }}
          contentContainerStyle={{ gap: 14, paddingTop: 10, paddingBottom: 4, paddingRight: 22 }}>
          <View style={{ alignItems: 'center', gap: 7, width: 62 }}>
            <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(22,33,12,.3)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.groups} size={22} color="rgba(22,33,12,.5)" sw={1.8} />
            </View>
            <T s={11.5} c={C.deep55}>
              Groups
            </T>
          </View>
          {people.map((c, i) => {
            const isNew = c.time === 'now';
            return (
              <A
                key={c.name}
                style={[{ width: 62 }, isNew ? anim(skPin(), 0.7, 0.15 + i * 0.12, E.out) : anim(skPop(), 0.4, 0.12 + i * 0.06, E.s14)]}>
                <Press onPress={() => s.markRead(c.name)} accessibilityLabel={c.name} style={{ alignItems: 'center', gap: 7 }}>
                  <View
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 31,
                      borderWidth: 2,
                      borderStyle: isNew ? 'solid' : 'dashed',
                      borderColor: isNew ? I : 'rgba(22,33,12,.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: SK[i % 3], alignItems: 'center', justifyContent: 'center' }}>
                      <T f={F.b7} s={16} c={I}>
                        {initialsOf(c.name)}
                      </T>
                    </View>
                    {c.unread && !isNew ? (
                      <View style={{ position: 'absolute', right: -4, top: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: I, alignItems: 'center', justifyContent: 'center' }}>
                        <Plane size={12} />
                      </View>
                    ) : null}
                    {isNew ? (
                      <View
                        style={{
                          position: 'absolute',
                          right: -10,
                          top: -8,
                          backgroundColor: C.lime,
                          borderWidth: 1.5,
                          borderColor: I,
                          borderRadius: 7,
                          paddingHorizontal: 4,
                          transform: [{ rotate: '12deg' }],
                          boxShadow: `1.5px 1.5px 0 ${I}`,
                        }}>
                        <T f={F.dm5} s={9.5} c={I}>
                          NEW
                        </T>
                      </View>
                    ) : null}
                  </View>
                  <T f={c.unread ? F.b8 : F.b6} s={11.5} c="rgba(22,33,12,.7)">
                    {firstOf(c.name)}
                  </T>
                </Press>
              </A>
            );
          })}
        </ScrollView>

        {/* group chat */}
        <A style={[{ marginTop: 22 }, anim(skSlideIn(), 0.45, 0.25, E.out)]}>
          <Press onPress={() => s.markRead(GOA)} pressed={{ opacity: 0.85 }} style={rowStyle(gU)} accessibilityLabel={GOA}>
            <View style={{ width: 48, height: 48 }}>
              {[
                ['PS', C.coral, { left: 0, top: 0 }],
                ['AK', C.lime, { right: 0, bottom: 0 }],
              ].map(([ini, bg, pos]) => (
                <View
                  key={ini as string}
                  style={{
                    position: 'absolute',
                    ...(pos as object),
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: bg as string,
                    borderWidth: 2,
                    borderColor: '#F6F5DF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <T f={F.b7} s={11} c={I}>
                    {ini as string}
                  </T>
                </View>
              ))}
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <T f={F.b6} s={15.5} c={I}>
                  {GOA}
                </T>
                <T f={F.dm5} s={11.5} c="rgba(22,33,12,.45)">
                  12m
                </T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <T f={gU ? F.b7 : F.b4} s={13} c={gU ? I : C.deep55} lines={1} style={{ flex: 1 }}>
                  Aarav: booked the villa 🎉
                </T>
                {gU ? <UnreadPill n={4} /> : null}
              </View>
            </View>
          </Press>
        </A>

        <View style={{ marginTop: 14, gap: 6 }}>
          {people.map((c, i) => {
            const isNew = c.time === 'now';
            const online = i % 2 === 0;
            return (
              <A
                key={c.name}
                style={isNew ? anim(skSlap(0), 0.5, 0.3 + i * 0.08, E.s12) : anim(skSlideIn(), 0.45, 0.3 + i * 0.07, E.out)}>
                <Press onPress={() => s.markRead(c.name)} pressed={{ opacity: 0.85 }} style={rowStyle(c.unread)} accessibilityLabel={c.name}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: SK[i % 3], alignItems: 'center', justifyContent: 'center' }}>
                    <T f={F.b7} s={16} c={I}>
                      {initialsOf(c.name)}
                    </T>
                    {online ? (
                      <View style={{ position: 'absolute', right: 0, bottom: 0, width: 13, height: 13 }}>
                        <A style={[{ position: 'absolute', left: 0, top: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: 'rgba(91,196,106,.65)' }, anim(skRing(), 1.6, 0, 'ease-out', 'infinite')]} />
                        <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: '#5BC46A', borderWidth: 2, borderColor: '#F6F5DF' }} />
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <T f={F.b6} s={15.5} c={I}>
                        {c.name}
                      </T>
                      <T f={F.dm5} s={11.5} c="rgba(22,33,12,.45)">
                        {c.time}
                      </T>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <T
                        f={c.preview === 'Typing…' ? F.b4i : c.unread ? F.b7 : F.b4}
                        s={13}
                        c={c.unread ? I : C.deep55}
                        lines={1}
                        style={{ flex: 1 }}>
                        {c.preview}
                      </T>
                      {c.unread ? <UnreadPill n={c.count} /> : null}
                    </View>
                  </View>
                </Press>
              </A>
            );
          })}
        </View>

        {showLocked ? (
          <A
            style={[
              { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(22,33,12,.22)', paddingVertical: 14, paddingHorizontal: 18 },
              anim(skUp(), 0.5, 0.8),
            ]}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(22,33,12,.06)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.lock} size={18} color="rgba(22,33,12,.5)" sw={1.7} />
            </View>
            <T s={13} lh={18} c={C.deep55} style={{ flex: 1 }}>
              <T f={F.b6} s={13} c="rgba(22,33,12,.75)">
                Kabir Shah
              </T>{' '}
              — chat opens when they accept your request.
            </T>
          </A>
        ) : null}
      </ScrollView>
      <TabBar active="chat" delay={0.35} />
    </Screen>
  );
}
