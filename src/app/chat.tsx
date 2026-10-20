// 09 Home · Chats — real friends, groups and messages from Supabase. Tap a row to open the thread.
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { firstOf } from '@/state/store';
import { anim, E, loop, skBob, skPin, skPop, skRing, skSlap, skSlideIn, skUp } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { Person } from '@/ui/Person';
import { A, Icon, ICON, Plane, Press, T, useStatusBar } from '@/ui/primitives';
import { Screen, TabBar } from '@/ui/Screen';
import { useAuth } from '@/v2/context/AuthContext';
import { useFriends } from '@/v2/context/FriendsContext';
import type { DirectMessage } from '@/v2/types/friends';
import type { GroupMessage } from '@/v2/types/groups';
import { timeAgo } from '@/v2/utils/relativeTime';

const I = C.deep;

function preview(m: DirectMessage | GroupMessage | undefined, mine: boolean): string {
  if (!m) return 'Say hi 👋';
  const you = mine ? 'You: ' : '';
  switch (m.kind) {
    case 'image':
      return `${you}📷 Photo`;
    case 'location':
      return `${you}📍 Location`;
    case 'letter':
      return mine ? 'You threw a letter ✈︎' : 'Sent you a letter ✈︎';
    case 'poll':
      return `${you}📊 Poll`;
    default:
      return you + (m.text || '…');
  }
}

const shortAgo = (iso?: string) => (iso ? timeAgo(iso).replace('Just now', 'now') : '');

function UnreadPill({ n }: { n: number }) {
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

type Row =
  | { kind: 'dm'; id: string; userId: string; name: string; avatarUrl: string | null; last?: DirectMessage; unread: number; at: string; isNew: boolean }
  | { kind: 'group'; id: string; name: string; members: string[]; last?: GroupMessage; at: string };

export default function Chat() {
  const { top } = useStatusBar();
  const f = useFriends();
  const { user } = useAuth();
  const justIds = new Set(f.justAccepted.map((x) => x.connectionId));

  const rows: Row[] = [
    ...f.friends.map((fr) => {
      const last = f.lastMessageFor(fr.connectionId);
      return {
        kind: 'dm' as const,
        id: fr.connectionId,
        userId: fr.userId,
        name: fr.name,
        avatarUrl: fr.avatarUrl,
        last,
        unread: f.unreadCountFor(fr.connectionId),
        at: last?.createdAt ?? fr.acceptedAt ?? '',
        isNew: justIds.has(fr.connectionId),
      };
    }),
    ...f.groups.map((g) => {
      const last = f.lastGroupMessageFor(g.id);
      return { kind: 'group' as const, id: g.id, name: g.name, members: f.groupMemberNamesFor(g.id), last, at: last?.createdAt ?? g.createdAt };
    }),
  ].sort((a, b) => (b.at || '').localeCompare(a.at || ''));

  const rail = [...f.friends].sort((a, b) => Number(f.isOnline(b.userId)) - Number(f.isOnline(a.userId)));

  const openDm = (id: string) => {
    f.openChat(id);
    router.push('/thread');
  };
  const openGroup = (id: string) => {
    f.openGroupChat(id);
    router.push('/thread');
  };

  return (
    <Screen bar={I} style={{ backgroundColor: '#F6F5DF' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: top + 11, paddingHorizontal: 22, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
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
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <A style={anim(skPop(), 0.45, 0.15, E.s14)}>
              <Press
                onPress={() => {
                  f.goCreateGroup();
                  router.push('/thread');
                }}
                accessibilityLabel="New group"
                pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }] }}
                style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,.8)', borderWidth: 1.5, borderColor: I, alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICON.groups} size={21} color={I} sw={1.9} />
              </Press>
            </A>
            <A style={anim(skPop(), 0.45, 0.2, E.s14)}>
              <Press
                onPress={() => router.push('/friends')}
                accessibilityLabel="Add a friend"
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
          </View>
        </A>

        {f.receivedRequests.length ? (
          <A style={[{ marginTop: 18 }, anim(skSlap(-1), 0.5, 0.3, E.s12)]}>
            <Press
              onPress={() => {
                f.goRequests();
                router.push('/thread');
              }}
              accessibilityRole="button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: C.lime,
                borderWidth: 1.5,
                borderColor: I,
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 14,
                boxShadow: `3px 3px 0 ${I}`,
                transform: [{ rotate: '-1deg' }],
              }}>
              <View style={{ flexDirection: 'row' }}>
                {f.receivedRequests.slice(0, 3).map((r, i) => (
                  <Person key={r.connectionId} id={r.userId} name={r.name} avatarUrl={r.avatarUrl} size={32} style={{ marginLeft: i ? -10 : 0, borderWidth: 2, borderColor: C.lime }} />
                ))}
              </View>
              <T f={F.b7} s={14} c={I} style={{ flex: 1 }}>
                {f.receivedRequests.length === 1 ? `${firstOf(f.receivedRequests[0].name)} wants to be friends` : `${f.receivedRequests.length} friend requests`}
              </T>
              <Icon d={ICON.arrow} size={18} color={I} sw={2.4} />
            </Press>
          </A>
        ) : null}

        <T f={F.dm5} s={10.5} ls={1.5} c="rgba(22,33,12,.5)" style={{ marginTop: 22 }}>
          IN THE AIR
        </T>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, marginRight: -22, overflow: 'visible' }}
          contentContainerStyle={{ gap: 14, paddingTop: 10, paddingBottom: 4, paddingRight: 22 }}>
          <Press
            onPress={() => {
              f.goCreateGroup();
              router.push('/thread');
            }}
            accessibilityLabel="New group"
            style={{ alignItems: 'center', gap: 7, width: 62 }}>
            <View style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(22,33,12,.3)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.groups} size={22} color="rgba(22,33,12,.5)" sw={1.8} />
            </View>
            <T s={11.5} c={C.deep55}>
              Groups
            </T>
          </Press>
          {rail.map((fr, i) => {
            const isNew = justIds.has(fr.connectionId);
            const unread = f.unreadCountFor(fr.connectionId);
            return (
              <A key={fr.connectionId} style={[{ width: 62 }, isNew ? anim(skPin(), 0.7, 0.15 + i * 0.12, E.out) : anim(skPop(), 0.4, 0.12 + i * 0.06, E.s14)]}>
                <Press onPress={() => openDm(fr.connectionId)} accessibilityLabel={fr.name} style={{ alignItems: 'center', gap: 7 }}>
                  <View
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 31,
                      borderWidth: 2,
                      borderStyle: isNew || f.isOnline(fr.userId) ? 'solid' : 'dashed',
                      borderColor: isNew ? I : f.isOnline(fr.userId) ? '#5BC46A' : 'rgba(22,33,12,.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Person id={fr.userId} name={fr.name} avatarUrl={fr.avatarUrl} size={50} font={16} />
                    {unread && !isNew ? (
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
                  <T f={unread ? F.b8 : F.b6} s={11.5} c="rgba(22,33,12,.7)" lines={1}>
                    {firstOf(fr.name)}
                  </T>
                </Press>
              </A>
            );
          })}
        </ScrollView>

        {f.loading && !rows.length ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color={I} />
          </View>
        ) : null}

        {!f.loading && !rows.length ? (
          <A style={[{ marginTop: 22 }, anim(skUp(), 0.45, 0.2)]}>
            <Press
              onPress={() => router.push('/friends')}
              accessibilityRole="button"
              style={{ borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(22,33,12,.35)', paddingVertical: 26, paddingHorizontal: 20, alignItems: 'center', gap: 6 }}>
              <T f={F.b7} s={16} c={I}>
                No chats yet
              </T>
              <T s={13.5} c={C.deep55} center>
                Add a friend with their six-character code to start talking.
              </T>
            </Press>
          </A>
        ) : null}

        <View style={{ marginTop: 18, gap: 6 }}>
          {rows.map((r, i) => {
            if (r.kind === 'group') {
              const mine = !!r.last && r.last.senderId === user?.id;
              return (
                <A key={'g' + r.id} style={anim(skSlideIn(), 0.45, 0.25 + i * 0.06, E.out)}>
                  <Press onPress={() => openGroup(r.id)} pressed={{ opacity: 0.85 }} style={rowStyle(false)} accessibilityLabel={r.name}>
                    <View style={{ width: 48, height: 48 }}>
                      {r.members.slice(0, 2).map((m, k) => (
                        <View key={k} style={{ position: 'absolute', ...(k ? { right: 0, bottom: 0 } : { left: 0, top: 0 }) }}>
                          <Person id={r.id + m} name={m} size={32} font={11} style={{ borderWidth: 2, borderColor: '#F6F5DF' }} />
                        </View>
                      ))}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <T f={F.b6} s={15.5} c={I} lines={1} style={{ flexShrink: 1 }}>
                          {r.name}
                        </T>
                        <T f={F.dm5} s={11.5} c="rgba(22,33,12,.45)">
                          {shortAgo(r.last?.createdAt)}
                        </T>
                      </View>
                      <T f={F.b4} s={13} c={C.deep55} lines={1}>
                        {preview(r.last, !!mine)}
                      </T>
                    </View>
                  </Press>
                </A>
              );
            }
            const unread = r.unread > 0;
            const typing = f.isTyping(r.id);
            const online = f.isOnline(r.userId);
            const mine = !!r.last && r.last.senderId === user?.id;
            return (
              <A key={r.id} style={r.isNew ? anim(skSlap(0), 0.5, 0.3 + i * 0.08, E.s12) : anim(skSlideIn(), 0.45, 0.25 + i * 0.06, E.out)}>
                <Press onPress={() => openDm(r.id)} pressed={{ opacity: 0.85 }} style={rowStyle(unread)} accessibilityLabel={r.name}>
                  <View>
                    <Person id={r.userId} name={r.name} avatarUrl={r.avatarUrl} size={48} font={16} />
                    {online ? (
                      <View style={{ position: 'absolute', right: 0, bottom: 0, width: 13, height: 13 }}>
                        <A style={[{ position: 'absolute', left: 0, top: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: 'rgba(91,196,106,.65)' }, anim(skRing(), 1.6, 0, 'ease-out', 'infinite')]} />
                        <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: '#5BC46A', borderWidth: 2, borderColor: '#F6F5DF' }} />
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <T f={F.b6} s={15.5} c={I} lines={1} style={{ flexShrink: 1 }}>
                        {r.name}
                      </T>
                      <T f={F.dm5} s={11.5} c="rgba(22,33,12,.45)">
                        {shortAgo(r.last?.createdAt)}
                      </T>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <T f={typing ? F.b4i : unread ? F.b7 : F.b4} s={13} c={unread ? I : C.deep55} lines={1} style={{ flex: 1 }}>
                        {typing ? 'Typing…' : preview(r.last, mine)}
                      </T>
                      {unread ? <UnreadPill n={r.unread} /> : null}
                    </View>
                  </View>
                </Press>
              </A>
            );
          })}
        </View>

        {f.sentRequests.map((r, i) => (
          <A
            key={r.connectionId}
            style={[
              { marginTop: i ? 8 : 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(22,33,12,.22)', paddingVertical: 14, paddingHorizontal: 18 },
              anim(skUp(), 0.5, 0.8),
            ]}>
            <Press
              onPress={() => {
                f.openChat(r.connectionId);
                router.push('/thread');
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(22,33,12,.06)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICON.lock} size={18} color="rgba(22,33,12,.5)" sw={1.7} />
              </View>
              <T s={13} lh={18} c={C.deep55} style={{ flex: 1 }}>
                <T f={F.b6} s={13} c="rgba(22,33,12,.75)">
                  {r.name}
                </T>{' '}
                — chat opens when they accept your request.
              </T>
            </Press>
          </A>
        ))}
      </ScrollView>
      <TabBar active="chat" delay={0.35} />
    </Screen>
  );
}
