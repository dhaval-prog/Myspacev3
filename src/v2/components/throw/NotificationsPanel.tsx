// Naked Notifications: a bare list straight on the Throw map — no panel, no cards, no dividers.
// Each row is one line ("Priya posted a status · 2m") with a face, a blue dot while unread and
// inline text actions. Plain-text filters (Status · Letters · Friends) with a dot under the active
// one, small Today / Yesterday / Earlier labels, swipe a row left to clear it.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FriendAvatar } from '../friends/FriendAvatar';
import { useNotifications, type AppNotification } from '../../context/NotificationsContext';
import { useFriends } from '../../context/FriendsContext';
import { targetForNotification, type NotificationTarget } from '../../utils/notify';

const BLUE = '#3D7BFF';

type Filter = 'status' | 'letters' | 'friends';

const FILTERS: { id: Filter; label: string; categories: string[] }[] = [
  { id: 'status', label: 'Status', categories: ['status_posted'] },
  { id: 'letters', label: 'Letters', categories: ['throw', 'chat_message'] },
  { id: 'friends', label: 'Friends', categories: ['friend_requests'] },
];

/** "2m" / "3h" / "4d" — no "ago". */
function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function dayGroup(iso: string): 'Today' | 'Yesterday' | 'Earlier' {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  return d.toDateString() === y.toDateString() ? 'Yesterday' : 'Earlier';
}

interface NotificationsPanelProps {
  /** Jumps to whatever this notification is about (a chat, a throw, a contact). */
  onNavigate?: (target: NotificationTarget) => void;
  /** Night map: light text with a dark halo instead of ink with a white one. */
  isNight?: boolean;
}

export function NotificationsPanel({ onNavigate, isNight = false }: NotificationsPanelProps) {
  const { notifications, unreadCount, acknowledge, clearAll, dismiss } = useNotifications();
  const { friends, receivedRequests, sentRequests, acceptRequest, declineRequest } = useFriends();
  // Opens on Status (there's no "All").
  const [filter, setFilter] = useState<Filter>('status');
  const t = isNight ? night : day;

  const avatarFor = (userId: string | null): { name: string; avatarUrl: string | null } | null => {
    if (!userId) return null;
    const f = friends.find((x) => x.userId === userId);
    if (f) return { name: f.name, avatarUrl: f.avatarUrl };
    const r = receivedRequests.find((x) => x.userId === userId) ?? sentRequests.find((x) => x.userId === userId);
    return r ? { name: r.name, avatarUrl: r.avatarUrl } : null;
  };

  const groups = useMemo(() => {
    const cats = FILTERS.find((f) => f.id === filter)!.categories;
    const list = notifications.filter((n) => cats.includes(n.category));
    const out: { label: string; items: AppNotification[] }[] = [];
    for (const n of list) {
      const label = dayGroup(n.createdAt);
      const g = out.find((x) => x.label === label);
      if (g) g.items.push(n);
      else out.push({ label, items: [n] });
    }
    return out;
  }, [notifications, filter]);

  const open = (n: AppNotification) => {
    acknowledge(n.id);
    onNavigate?.(targetForNotification(n));
  };

  const renderRow = (n: AppNotification) => {
    const avatar = avatarFor(n.relatedUserId);
    const pendingRequest = n.category === 'friend_requests' && receivedRequests.some((r) => r.connectionId === n.entityId);
    const phrase = n.body.split('\n')[0];
    return (
      <SwipeToClear key={n.id} onClear={() => dismiss(n.id)}>
        <Pressable
          onPress={() => open(n)}
          accessibilityRole="button"
          accessibilityLabel={`${n.title} ${phrase}`}
          style={({ pressed }) => [styles.row, n.read && styles.read, pressed && { opacity: 0.6 }]}
        >
          <FriendAvatar userId={n.relatedUserId ?? n.id} name={avatar?.name ?? n.title} avatarUrl={avatar?.avatarUrl} size={32} />
          <Text style={styles.line} numberOfLines={1}>
            <Text style={[styles.name, t.text]}>{n.title}</Text>
            <Text style={[styles.phrase, t.text]}> {phrase}</Text>
            <Text style={[styles.time, t.faint]}> · {ago(n.createdAt)}</Text>
          </Text>
          {pendingRequest ? (
            <View style={styles.actions}>
              <TextAction label="Accept" color={BLUE} onPress={() => { acknowledge(n.id); acceptRequest(n.entityId!); }} halo={t.halo} />
              <TextAction label="Ignore" color={t.faintColor} onPress={() => { acknowledge(n.id); declineRequest(n.entityId!); }} halo={t.halo} />
            </View>
          ) : n.category === 'throw' ? (
            <TextAction label="Open" color={BLUE} onPress={() => open(n)} halo={t.halo} />
          ) : null}
          {!n.read ? <View style={styles.dot} /> : null}
        </Pressable>
      </SwipeToClear>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const active = f.id === filter;
            return (
              <Pressable key={f.id} onPress={() => setFilter(f.id)} hitSlop={8} accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={f.label} style={styles.filter}>
                <Text style={[styles.filterLabel, t.text, !active && styles.filterIdle]}>{f.label}</Text>
                <View style={[styles.filterDot, { backgroundColor: active ? t.inkColor : 'transparent' }]} />
              </Pressable>
            );
          })}
        </View>
        {unreadCount > 0 ? <TextAction label="Mark all read" color={t.inkColor} onPress={clearAll} halo={t.halo} underline /> : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {groups.length === 0 ? (
          <Text style={[styles.empty, t.faint]}>You&apos;re all caught up.</Text>
        ) : (
          groups.map((g) => (
            <View key={g.label}>
              <Text style={[styles.group, t.faint]}>{g.label}</Text>
              {g.items.map(renderRow)}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TextAction({ label, color, onPress, halo, underline }: { label: string; color: string; onPress: () => void; halo: object; underline?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => <Text style={[styles.action, halo, { color }, underline && { textDecorationLine: 'underline' }, pressed && { opacity: 0.5 }]}>{label}</Text>}
    </Pressable>
  );
}

const CLEAR_AT = 96;

/** Drag a row left past CLEAR_AT and let go: it slides away and is cleared. */
function SwipeToClear({ onClear, children }: { onClear: () => void; children: React.ReactNode }) {
  const x = useSharedValue(0);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-14, 14])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      x.set(Math.min(0, e.translationX));
    })
    .onEnd((e) => {
      if (x.get() < -CLEAR_AT || e.velocityX < -700) {
        x.set(withTiming(-480, { duration: 200 }));
        setTimeout(onClear, 200);
      } else {
        x.set(withTiming(0, { duration: 180 }));
      }
    });
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }], opacity: 1 + Math.max(-0.8, x.get() / 300) }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={st}>{children}</Animated.View>
    </GestureDetector>
  );
}

const day = {
  inkColor: '#16210C',
  faintColor: 'rgba(22,33,12,.55)',
  halo: { textShadowColor: 'rgba(255,255,255,.95)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  text: { color: '#16210C', textShadowColor: 'rgba(255,255,255,.95)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  faint: { color: 'rgba(22,33,12,.55)', textShadowColor: 'rgba(255,255,255,.95)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
};
const night = {
  inkColor: '#FFFFFF',
  faintColor: 'rgba(255,255,255,.6)',
  halo: { textShadowColor: 'rgba(0,0,0,.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  text: { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
  faint: { color: 'rgba(255,255,255,.6)', textShadowColor: 'rgba(0,0,0,.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 6 },
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 6 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  filter: { alignItems: 'center', gap: 4 },
  filterLabel: { fontFamily: 'Figtree_700Bold', fontSize: 15 },
  filterIdle: { opacity: 0.55 },
  filterDot: { width: 5, height: 5, borderRadius: 3 },
  list: { paddingBottom: 24 },
  group: { fontFamily: 'Figtree_600SemiBold', fontSize: 12, letterSpacing: 0.3, marginTop: 14, marginBottom: 4, paddingHorizontal: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 6 },
  read: { opacity: 0.55 },
  line: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'Figtree_700Bold', fontSize: 14 },
  phrase: { fontFamily: 'Figtree_500Medium', fontSize: 14 },
  time: { fontFamily: 'Figtree_500Medium', fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  action: { fontFamily: 'Figtree_700Bold', fontSize: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  empty: { fontFamily: 'Figtree_600SemiBold', fontSize: 14, textAlign: 'center', paddingVertical: 28 },
});
