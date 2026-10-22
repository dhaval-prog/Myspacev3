// The 1:1 chat thread (Chat Thread · Sticker spec): olive header with call + ⋮ menu, lime/white
// bubbles with reactions, double-tap hearts and swipe-to-reply, Throw letters as paper planes you
// catch and flick open, a + tray (photo / location / media), the streak flame and live receipts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { anim, loop } from '@/theme/anim';
import { noOutline } from '../../theme';
import { BottomSheet } from '../../components/expenses/BottomSheet';
import { ActionButton } from '../../components/account/rows';
import { MediaGalleryModal } from '../../components/chat/MediaGalleryModal';
import { FriendAvatar } from '../../components/friends/FriendAvatar';
import { RealFlame } from '../../components/throw/letterFxReal';
import { ChatBubble, QUOTE_PREFIX, splitQuote } from '../../components/chat/thread/ChatBubble';
import { LetterPlane } from '../../components/chat/thread/LetterPlane';
import { CatchLetterOverlay, type CatchLetter } from '../../components/chat/thread/CatchLetterOverlay';
import {
  A,
  buzz,
  ctDots,
  ctFlash,
  ctHeartUp,
  ctIn,
  ctJig,
  ctMine,
  ctPhone,
  ctPicker,
  ctPop,
  ctSendFly,
  ctStreak,
  ctTheirs,
  ctThrowIn,
  ctThrowMine,
  ctTray,
  ctTrayPop,
  Heart,
  INK,
  LIME,
  mono,
  OLIVE,
  PAPER,
  READ_GREEN,
  SEND_PATH,
  SPRING,
  Toast,
} from '../../components/chat/thread/threadFx';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { useFriends } from '../../context/FriendsContext';
import { useThrowColorMode } from '../../context/ThrowColorModeContext';
import { useFriendStreak } from '../../hooks/useFriendStreak';
import { useMessageSendStatus } from '../../hooks/useMessageSendStatus';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { markLetterOpened, sendLetterHugs, useThrowDetails } from '../../hooks/useThrowDetails';

const BACK = 'M15 5l-7 7 7 7';
const PHONE =
  'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z';
const PHOTO_ICON = 'M4 4h16v16H4z M4 16l5-5 4 4 2-2 5 5 M15.5 9.5a1.5 1.5 0 1 0 0-.01';
const PIN_ICON = 'M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z';
const GRID_ICON = 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z';
const PLANE_ICON = 'M22 2 11 13 M22 2l-7 20-4-9-9-4z';
const TRASH_ICON = 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 10.5v6.5M13.5 10.5v6.5';
const PERSON_X_ICON = 'M4 19c0-3.3 2.7-6 6-6s6 2.7 6 6M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17 8l4 4M21 8l-4 4';

const REACTIONS_KEY = 'myspace.chatReactions.v1';

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toUpperCase();
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'TODAY';
  if (d.toDateString() === y.toDateString()) return 'YESTERDAY';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase();
}
const STATUS: Record<string, string> = { thrown: 'Sent', landed: 'Delivered', read: 'Read' };

export function ChatThreadScreen({ onOpenThrow }: { onOpenThrow?: (contactId?: string) => void }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { focusedFriend, messages, sendMessage, sendPhoto, sendLocation, goChats, removeFriend, clearChat, isOnline, isTyping, notifyTyping } = useFriends();
  const { startCall } = useCall();
  const { isDay } = useThrowColorMode();
  const night = !isDay;
  const reduceMotion = useReducedMotion();
  const { statusFor } = useMessageSendStatus(messages, user?.id, reduceMotion);
  const letterDetails = useThrowDetails(messages.filter((x) => x.kind === 'letter').map((x) => x.throwId));
  const streak = useFriendStreak(user?.id, focusedFriend?.userId);

  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [tray, setTray] = useState(false);
  const [picker, setPicker] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<{ text: string; k: number } | null>(null);
  const [sendNope, setSendNope] = useState(0);
  const [launch, setLaunch] = useState(0);
  const [flash, setFlash] = useState(0);
  const [sendingAttachment, setSendingAttachment] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [catching, setCatching] = useState<{ letter: CatchLetter; read: boolean; throwId: string | null } | null>(null);
  const [, bump] = useState(0);
  const [flameTaps, setFlameTaps] = useState(0);
  const [flameHearts, setFlameHearts] = useState<{ k: number; r: number }[]>([]);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialIds = useRef<Set<string> | null>(null);
  if (initialIds.current === null) initialIds.current = new Set(messages.map((m) => m.id));

  useEffect(() => {
    AsyncStorage.getItem(REACTIONS_KEY)
      .then((raw) => raw && setReactions(JSON.parse(raw)))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length]);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const toast = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg({ text, k: Date.now() });
    toastTimer.current = setTimeout(() => setToastMsg(null), 2000);
  };

  const theirTyping = focusedFriend ? isTyping(focusedFriend.connectionId) : false;
  useEffect(() => {
    if (theirTyping) scrollRef.current?.scrollToEnd({ animated: true });
  }, [theirTyping]);

  const rows = useMemo(() => {
    const out: ({ kind: 'day'; key: string; label: string } | { kind: 'msg'; key: string; idx: number })[] = [];
    let lastDay = '';
    messages.forEach((m, idx) => {
      const d = dayLabel(m.createdAt);
      if (d !== lastDay) {
        out.push({ kind: 'day', key: 'day-' + m.id, label: d });
        lastDay = d;
      }
      out.push({ kind: 'msg', key: m.id, idx });
    });
    return out;
  }, [messages]);

  if (!focusedFriend) return null;
  const first = focusedFriend.name.trim().split(/\s+/)[0] || focusedFriend.name;
  const online = isOnline(focusedFriend.userId);

  const setReaction = (id: string, r: string | null) => {
    setPicker(null);
    setReactions((prev) => {
      const next = { ...prev };
      if (r) next[id] = r;
      else delete next[id];
      AsyncStorage.setItem(REACTIONS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const send = () => {
    const body = draft.trim();
    if (!body) {
      buzz();
      setSendNope((n) => n + 1);
      return;
    }
    buzz();
    sendMessage(reply ? `${QUOTE_PREFIX}${reply.replace(/\n/g, ' ')}\n${body}` : body);
    setDraft('');
    setReply(null);
    setLaunch((n) => n + 1);
  };
  const changeDraft = (next: string) => {
    setDraft(next);
    if (next.trim()) notifyTyping(focusedFriend.connectionId);
  };

  const pickPhoto = async () => {
    setTray(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return toast('Photo access is needed to share a photo');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7, allowsEditing: true });
    if (result.canceled || !result.assets[0]) return;
    setFlash((n) => n + 1);
    setSendingAttachment(true);
    const { error } = await sendPhoto(result.assets[0].uri);
    setSendingAttachment(false);
    if (error) toast(error);
  };
  const shareLocation = async () => {
    setTray(false);
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return toast('Location access is needed to share where you are');
    setSendingAttachment(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { error } = await sendLocation(pos.coords.latitude, pos.coords.longitude);
      if (error) toast(error);
    } catch {
      toast('Could not get your location');
    } finally {
      setSendingAttachment(false);
    }
  };
  const startVideoCall = () => {
    buzz();
    startCall({
      kind: 'dm',
      title: focusedFriend.name,
      memberIds: [focusedFriend.userId],
      participantNames: { [focusedFriend.userId]: focusedFriend.name },
      contextId: focusedFriend.connectionId,
    });
  };
  const throwLetter = () => {
    setMenu(false);
    onOpenThrow?.(focusedFriend.userId);
  };
  const tapFlame = () => {
    buzz();
    const n = flameTaps + 1;
    setFlameTaps(n);
    if (n % 4 === 0) {
      setFlameHearts((h) => [...h, { k: n, r: Math.round(Math.random() * 30 - 15) }]);
      toast(`${streak}-day streak with ${first} ♥`);
      setTimeout(() => setFlameHearts([]), 1300);
    }
  };

  const mediaItems = messages
    .filter((m) => m.kind === 'image' && m.attachmentUrl)
    .map((m) => ({ id: m.id, url: m.attachmentUrl!, senderId: m.senderId }))
    .reverse();

  const hasText = !!draft.trim();
  const showFlame = streak > 0 && !tray;
  const bg = night ? ['#26331C', '#141C0E'] : ['#E3F0DF', '#F2F0E2'];

  return (
    <LinearGradient colors={bg as [string, string]} style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* header */}
        <View style={[styles.header, night && styles.headerNight, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={goChats} accessibilityRole="button" accessibilityLabel="Back" style={({ pressed }) => [styles.headBtn, pressed && styles.pressedSmall]}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path d={BACK} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Pressable
            onPress={() => toast(`${focusedFriend.name}${focusedFriend.username ? ' · @' + focusedFriend.username : ''}`)}
            accessibilityRole="button"
            accessibilityLabel={`${focusedFriend.name} profile`}
            style={({ pressed }) => [styles.avatarWrap, pressed && { transform: [{ scale: 0.9 }, { rotate: '-8deg' }] }]}
          >
            <FriendAvatar userId={focusedFriend.userId} name={focusedFriend.name} size={44} avatarUrl={focusedFriend.avatarUrl} />
            {online ? <View style={styles.onlineDot} /> : null}
          </Pressable>
          <View style={styles.headText}>
            <Text style={styles.headName} numberOfLines={1}>
              {focusedFriend.name}
            </Text>
            <Text style={[styles.headStatus, theirTyping && { color: LIME }]}>{theirTyping ? 'typing…' : online ? 'online now' : 'offline'}</Text>
          </View>
          <Pressable onPress={startVideoCall} accessibilityRole="button" accessibilityLabel="Start a call" style={({ pressed }) => [styles.headBtn, pressed && styles.pressedSmall]}>
            <A style={anim(ctPhone(), 1.2, 2, 'ease-in-out')}>
              <Svg width={19} height={19} viewBox="0 0 24 24">
                <Path d={PHONE} fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </A>
          </Pressable>
          <Pressable
            onPress={() => setMenu((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={({ pressed }) => [styles.headBtn, menu && { backgroundColor: 'rgba(255,255,255,.3)' }, pressed && styles.pressedSmall]}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Circle cx={12} cy={5} r={2} fill="#fff" />
              <Circle cx={12} cy={12} r={2} fill="#fff" />
              <Circle cx={12} cy={19} r={2} fill="#fff" />
            </Svg>
          </Pressable>
        </View>

        {/* messages */}
        <View style={styles.flex}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[styles.list, { paddingBottom: showFlame ? 104 : 16 }]}
            // Late-loading letters/photos grow the list after the first scroll; keep the newest in view.
            onContentSizeChange={() => !picker && scrollRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => picker && setPicker(null)}
            keyboardShouldPersistTaps="handled"
          >
            {picker ? <Pressable style={StyleSheet.absoluteFill} onPress={() => setPicker(null)} accessibilityLabel="Close reactions" /> : null}
            {messages.length === 0 ? <Text style={[styles.empty, night && { color: 'rgba(255,255,255,.6)' }]}>No messages yet. Say hi.</Text> : null}
            {rows.map((row) => {
              if (row.kind === 'day') {
                return (
                  <View key={row.key} style={[styles.dayChip, night && styles.dayChipNight]}>
                    <Text style={mono(10.5, night ? 'rgba(255,255,255,.75)' : INK, 1.4)}>{row.label}</Text>
                  </View>
                );
              }
              const m = messages[row.idx];
              const prev = messages[row.idx - 1];
              const next = messages[row.idx + 1];
              const mine = m.senderId === user?.id;
              const isNew = !initialIds.current!.has(m.id);
              const mt = !prev ? 0 : prev.senderId !== m.senderId ? 14 : m.kind === 'letter' ? 10 : 2;
              const order = Math.max(0, row.idx - (messages.length - 12));
              const calm = reduceMotion ? null : anim(ctIn(), 0.45, Math.min(order * 0.05, 0.6), 'ease-out');

              if (m.kind === 'system') {
                return (
                  <View key={m.id} style={[styles.dayChip, night && styles.dayChipNight, { marginTop: 8 }]}>
                    <Text style={mono(10.5, night ? 'rgba(255,255,255,.75)' : INK, 0.6)}>{m.text}</Text>
                  </View>
                );
              }
              if (m.kind === 'letter') {
                const detail = m.throwId ? letterDetails[m.throwId] : undefined;
                const opened = !!detail?.readAt;
                const entrance = reduceMotion ? null : isNew ? anim(mine ? ctThrowMine() : ctThrowIn(), mine ? 0.8 : 0.9, 0, SPRING) : calm;
                return (
                  <View key={m.id} style={{ marginTop: mt }}>
                    <LetterPlane
                      mine={mine}
                      night={night}
                      hugs={detail?.hugCount ?? 0}
                      hint={(mine ? (opened ? 'Opened' : 'Delivered · unopened') : opened ? 'Opened' : 'Unopened')}
                      hintGreen={opened && mine}
                      time={timeLabel(m.createdAt)}
                      entrance={entrance}
                      onPress={() => {
                        buzz();
                        setCatching({
                          read: mine || opened,
                          throwId: m.throwId ?? null,
                          letter: { id: m.id, mine, friendName: focusedFriend.name, city: m.attachmentUrl, time: timeLabel(m.createdAt), text: detail?.messageText?.trim() || m.text, media: detail?.media ?? [], hugs: detail?.hugCount ?? 0 },
                        });
                      }}
                    />
                  </View>
                );
              }

              const status = statusFor(m.id, m.senderId);
              const showMeta = !next || next.senderId !== m.senderId || next.kind === 'letter' || next.kind === 'system';
              const entrance = reduceMotion ? null : isNew ? anim(mine ? ctMine() : ctTheirs(), 0.45, 0, SPRING) : calm;
              return (
                <View key={m.id} style={[{ marginTop: mt, alignItems: mine ? 'flex-end' : 'flex-start', gap: 4 }, picker === m.id && { zIndex: 10 }]}>
                  <ChatBubble
                    mine={mine}
                    night={night}
                    kind={m.kind === 'image' ? 'image' : m.kind === 'location' ? 'location' : 'text'}
                    text={m.text}
                    attachmentUrl={m.attachmentUrl}
                    reaction={reactions[m.id] ?? null}
                    pickerOpen={picker === m.id}
                    entrance={entrance}
                    onReact={(r) => setReaction(m.id, r)}
                    onOpenPicker={() => setPicker(m.id)}
                    onReply={(q) => setReply(q)}
                    onOpenPhoto={setPhoto}
                  />
                  {showMeta ? (
                    <View style={styles.meta}>
                      <Text style={mono(11.5, night ? 'rgba(255,255,255,.5)' : 'rgba(17,17,17,.6)', 0)}>{timeLabel(m.createdAt)}</Text>
                      {mine && status ? (
                        <>
                          <Text style={mono(11.5, night ? 'rgba(255,255,255,.5)' : 'rgba(17,17,17,.6)', 0)}>·</Text>
                          <Svg width={12} height={12} viewBox="0 0 24 24">
                            <Path d={SEND_PATH} fill={status === 'read' ? READ_GREEN : 'rgba(17,17,17,.5)'} />
                          </Svg>
                          <Text style={[mono(11.5, status === 'read' ? READ_GREEN : 'rgba(17,17,17,.5)', 0), { fontFamily: 'SpaceMono_700Bold' }]}>{STATUS[status]}</Text>
                        </>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
            {sendingAttachment ? (
              <View style={[styles.typing, { alignSelf: 'flex-end', backgroundColor: LIME, borderWidth: 0 }]}>
                <ActivityIndicator size="small" color={INK} />
              </View>
            ) : null}
            {theirTyping ? (
              <A style={[styles.typing, night && styles.typingNight, anim(ctTheirs(), 0.3, 0, 'ease-out')]}>
                {[0, 0.15, 0.3].map((d) => (
                  <A key={d} style={[styles.typingDot, loop(ctDots(), 1, d, 'ease-in-out')]} />
                ))}
              </A>
            ) : null}
          </ScrollView>

          {/* streak flame */}
          {showFlame ? (
            <Pressable onPress={tapFlame} accessibilityRole="button" accessibilityLabel={`${streak} day streak with ${first}`} style={({ pressed }) => [styles.flame, pressed && { transform: [{ scale: 0.94 }] }]}>
              <View style={{ width: 46, height: 60, alignItems: 'center', justifyContent: 'flex-end' }}>
                <RealFlame size={58} />
                {flameHearts.map((h) => (
                  <A key={h.k} pointerEvents="none" style={[{ position: 'absolute', left: 12, bottom: 46 }, anim(ctHeartUp(h.r, 1), 1.2, 0, 'ease-out')]}>
                    <Heart size={22} />
                  </A>
                ))}
              </View>
              <View style={{ paddingBottom: 4 }}>
                <A key={flameTaps} style={flameTaps ? anim(ctStreak(flameTaps % 2 ? 'A' : 'B'), 0.4, 0, 'ease-out') : null}>
                  <Text style={[styles.streakNum, night && { color: '#F2F4EC' }]}>{streak}</Text>
                </A>
                <Text style={mono(9.5, night ? 'rgba(255,255,255,.55)' : 'rgba(17,17,17,.5)', 1.2)}>DAY STREAK</Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        {/* reply bar */}
        {reply ? (
          <A style={[styles.replyBar, anim(ctTray(), 0.3, 0, 'ease-out')]}>
            <View style={styles.replyBody}>
              <Text style={mono(10, '#2440C8', 1)}>REPLYING TO {first.toUpperCase()}</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {splitQuote(reply).body}
              </Text>
            </View>
            <Pressable onPress={() => setReply(null)} accessibilityRole="button" accessibilityLabel="Cancel reply" style={styles.replyX}>
              <Svg width={11} height={11} viewBox="0 0 24 24">
                <Path d="M6 6l12 12 M18 6 6 18" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
              </Svg>
            </Pressable>
          </A>
        ) : null}

        {/* composer */}
        <A
          key={'jig' + sendNope}
          style={[styles.composer, night && styles.composerNight, { marginBottom: Math.max(insets.bottom, 14) }, sendNope ? anim(ctJig(sendNope % 2 ? 'A' : 'B'), 0.4, 0, 'ease-out') : null]}
        >
          <Pressable
            onPress={() => {
              buzz();
              setTray((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityLabel="Share a photo, your location or media"
            style={styles.plusBtn}
          >
            <View style={[{ transform: [{ rotate: tray ? '135deg' : '0deg' }] }, styles.plusSpin]}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path d="M12 5v14 M5 12h14" fill="none" stroke={night ? '#F2F4EC' : INK} strokeWidth={2.2} strokeLinecap="round" />
              </Svg>
            </View>
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={changeDraft}
            placeholder={`Message ${first}…`}
            placeholderTextColor={night ? 'rgba(255,255,255,.4)' : 'rgba(17,17,17,.4)'}
            style={[styles.input, night && { color: '#F2F4EC' }, noOutline]}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={({ pressed }) => [styles.sendBtn, { backgroundColor: hasText ? LIME : '#1C2414', transform: [{ scale: pressed ? 0.85 : hasText ? 1.06 : 1 }, { rotate: pressed ? '-15deg' : '0deg' }] }]}
          >
            <View style={{ transform: [{ rotate: '45deg' }, { translateX: -1 }, { translateY: 1 }] }}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d={SEND_PATH} fill={hasText ? '#1C2414' : LIME} />
              </Svg>
            </View>
            {launch ? (
              <A key={launch} pointerEvents="none" style={[{ position: 'absolute', left: 13, top: 13 }, anim(ctSendFly(), 0.7, 0, 'ease-in-out')]}>
                <Svg width={22} height={22} viewBox="0 0 24 24">
                  <Path d={SEND_PATH} fill={LIME} stroke={INK} strokeWidth={1.2} />
                </Svg>
              </A>
            ) : null}
          </Pressable>
        </A>
      </KeyboardAvoidingView>

      {/* + tray */}
      {tray ? (
        <>
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 8 }]} onPress={() => setTray(false)} accessibilityLabel="Close menu" />
          <A style={[styles.tray, { bottom: Math.max(insets.bottom, 14) + 74 }, anim(ctTrayPop(), 0.32, 0, SPRING)]}>
            {(
              [
                ['Photo', PHOTO_ICON, pickPhoto],
                ['Current location', PIN_ICON, shareLocation],
                [
                  'Media',
                  GRID_ICON,
                  () => {
                    setTray(false);
                    setMediaOpen(true);
                  },
                ],
              ] as [string, string, () => void][]
            ).map(([label, icon, go], i) => (
              <A key={label} style={anim(ctTray(), 0.3, 0.04 + i * 0.05, SPRING)}>
                <Pressable
                  onPress={() => {
                    buzz();
                    go();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  style={({ pressed }) => [styles.trayRow, pressed && { backgroundColor: '#F6F6F4', transform: [{ scale: 0.97 }] }]}
                >
                  <View style={styles.trayIcon}>
                    <Svg width={22} height={22} viewBox="0 0 24 24">
                      <Path d={icon} fill="none" stroke="#1C2414" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={styles.trayLabel}>{label}</Text>
                </Pressable>
              </A>
            ))}
          </A>
        </>
      ) : null}

      {/* ⋮ menu */}
      {menu ? (
        <>
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 11 }]} onPress={() => setMenu(false)} accessibilityLabel="Close menu" />
          <A style={[styles.menu, { top: insets.top + 64 }, anim(ctPicker(), 0.25, 0, SPRING)]}>
            {(
              [
                ['Throw a letter', PLANE_ICON, throwLetter, false],
                [
                  'Media',
                  GRID_ICON,
                  () => {
                    setMenu(false);
                    setMediaOpen(true);
                  },
                  false,
                ],
                [
                  'Delete chat',
                  TRASH_ICON,
                  () => {
                    setMenu(false);
                    setConfirmClear(true);
                  },
                  false,
                ],
                [
                  'Remove friend',
                  PERSON_X_ICON,
                  () => {
                    setMenu(false);
                    setConfirmRemove(true);
                  },
                  true,
                ],
              ] as [string, string, () => void, boolean][]
            ).map(([label, icon, go, danger]) => (
              <Pressable key={label} onPress={go} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: 'rgba(17,17,17,.06)' }]}>
                <Svg width={17} height={17} viewBox="0 0 24 24">
                  <Path d={icon} fill="none" stroke={danger ? '#E0452B' : INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={[styles.menuText, danger && { color: '#E0452B' }]}>{label}</Text>
              </Pressable>
            ))}
          </A>
        </>
      ) : null}

      {catching ? (
        <CatchLetterOverlay
          letter={catching.letter}
          startRead={catching.read}
          topInset={insets.top}
          toast={toast}
          onClose={() => setCatching(null)}
          onUnfolded={() => {
            if (catching.throwId) {
              markLetterOpened(catching.throwId).then(() => bump((n) => n + 1));
              bump((n) => n + 1);
            }
          }}
          onHugs={(n) => {
            if (catching.throwId) sendLetterHugs(catching.throwId, n).then(() => bump((x) => x + 1));
          }}
          onWriteBack={() => {
            setCatching(null);
            onOpenThrow?.(focusedFriend.userId);
          }}
        />
      ) : null}

      {photo ? (
        <Pressable onPress={() => setPhoto(null)} accessibilityRole="button" accessibilityLabel="Close photo" style={[StyleSheet.absoluteFill, styles.lightbox]}>
          <A style={[styles.lightboxCard, anim(ctPop('B'), 0.4, 0, SPRING)]}>
            <Image source={{ uri: photo }} style={{ width: '100%', height: 300 }} resizeMode="cover" />
          </A>
          <Text style={mono(11, 'rgba(255,255,255,.7)', 1.4)}>TAP ANYWHERE TO CLOSE</Text>
        </Pressable>
      ) : null}

      {flash ? <A key={flash} pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 40, backgroundColor: '#fff' }, anim(ctFlash(), 0.4, 0, 'ease-out')]} /> : null}
      {toastMsg ? <Toast key={toastMsg.k} text={toastMsg.text} top={insets.top + 76} /> : null}

      <MediaGalleryModal
        visible={mediaOpen}
        onClose={() => setMediaOpen(false)}
        title="Media"
        bannerCaption={focusedFriend.name}
        items={mediaItems}
        senderNameFor={(id: string) => (id === user?.id ? 'You' : focusedFriend.name)}
      />
      <BottomSheet visible={confirmClear} onClose={() => setConfirmClear(false)}>
        <Text style={styles.sheetTitle}>Delete chat</Text>
        <Text style={styles.sheetBody}>Delete every message with {focusedFriend.name}? This can't be undone.</Text>
        <View style={styles.sheetActions}>
          <View style={styles.flex}>
            <ActionButton label="Cancel" variant="secondary" onPress={() => setConfirmClear(false)} />
          </View>
          <View style={styles.flex}>
            <ActionButton
              label="Delete chat"
              variant="destructive"
              onPress={() => {
                setConfirmClear(false);
                clearChat(focusedFriend.connectionId);
              }}
            />
          </View>
        </View>
      </BottomSheet>
      <BottomSheet visible={confirmRemove} onClose={() => setConfirmRemove(false)}>
        <Text style={styles.sheetTitle}>Remove friend</Text>
        <Text style={styles.sheetBody}>Remove {focusedFriend.name}? This deletes your chat history too.</Text>
        <View style={styles.sheetActions}>
          <View style={styles.flex}>
            <ActionButton label="Cancel" variant="secondary" onPress={() => setConfirmRemove(false)} />
          </View>
          <View style={styles.flex}>
            <ActionButton
              label="Remove"
              variant="destructive"
              onPress={() => {
                setConfirmRemove(false);
                removeFriend(focusedFriend.connectionId);
              }}
            />
          </View>
        </View>
      </BottomSheet>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    zIndex: 10,
    backgroundColor: OLIVE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    boxShadow: '0 6px 18px rgba(30,40,20,.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 14,
  } as ViewStyle,
  headerNight: { backgroundColor: '#36432F' },
  headBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  pressedSmall: { transform: [{ scale: 0.88 }] },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff' },
  onlineDot: { position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#7BE07A', borderWidth: 2, borderColor: OLIVE },
  headText: { flex: 1, minWidth: 0 },
  headName: { fontFamily: 'Figtree_800ExtraBold', fontSize: 17, color: '#fff' },
  headStatus: { fontFamily: 'Figtree_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,.7)' },
  list: { paddingTop: 14, paddingHorizontal: 16, gap: 6 },
  empty: { alignSelf: 'center', marginTop: 24, fontFamily: 'Figtree_600SemiBold', fontSize: 14, color: 'rgba(17,17,17,.5)' },
  dayChip: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.7)', borderWidth: 1.5, borderColor: 'rgba(17,17,17,.15)', marginVertical: 6 },
  dayChipNight: { backgroundColor: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.15)' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  typing: { alignSelf: 'flex-start', marginTop: 6, flexDirection: 'row', gap: 5, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 20, borderBottomLeftRadius: 6, backgroundColor: '#fff', borderWidth: 2, borderColor: 'rgba(17,17,17,.12)' },
  typingNight: { backgroundColor: '#2A3324', borderColor: 'rgba(255,255,255,.08)' },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: OLIVE },
  flame: { position: 'absolute', left: 16, bottom: 8, zIndex: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  streakNum: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, lineHeight: 30, letterSpacing: -1, color: '#1C2414' },
  replyBar: { marginHorizontal: 18, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingRight: 8, paddingLeft: 14, backgroundColor: PAPER, borderWidth: 2, borderColor: INK, borderRadius: 16, boxShadow: `3px 3px 0 ${INK}` } as ViewStyle,
  replyBody: { flex: 1, minWidth: 0, borderLeftWidth: 3, borderLeftColor: '#2F6BFF', paddingLeft: 8 },
  replyText: { fontFamily: 'Figtree_600SemiBold', fontSize: 13, color: INK },
  replyX: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(17,17,17,.08)', alignItems: 'center', justifyContent: 'center' },
  composer: { marginHorizontal: 14, height: 64, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 10, paddingRight: 8, borderRadius: 32, backgroundColor: PAPER, boxShadow: '0 8px 24px rgba(30,40,20,.18)' } as ViewStyle,
  composerNight: { backgroundColor: '#222B1C' },
  plusBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  plusSpin: { transitionProperty: 'transform', transitionDuration: '0.4s', transitionTimingFunction: SPRING } as unknown as ViewStyle,
  input: { flex: 1, minWidth: 0, fontFamily: 'Figtree_600SemiBold', fontSize: 16, color: INK },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', transitionProperty: 'background-color, transform', transitionDuration: '0.25s' } as unknown as ViewStyle,
  tray: { position: 'absolute', left: 14, zIndex: 9, width: 250, padding: 10, borderRadius: 26, backgroundColor: '#fff', boxShadow: '0 14px 34px rgba(20,24,16,.18)', gap: 2, transformOrigin: '24px 100%' } as ViewStyle,
  trayRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8, paddingLeft: 6, paddingRight: 10, borderRadius: 18 },
  trayIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F3F3F1', alignItems: 'center', justifyContent: 'center' },
  trayLabel: { fontFamily: 'Figtree_700Bold', fontSize: 18, letterSpacing: -0.2, color: '#1C2414' },
  menu: { position: 'absolute', right: 14, zIndex: 12, width: 210, padding: 6, backgroundColor: PAPER, borderWidth: 2.5, borderColor: INK, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}`, transformOrigin: '90% 0%' } as ViewStyle,
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12 },
  menuText: { fontFamily: 'Figtree_700Bold', fontSize: 14, color: INK },
  lightbox: { zIndex: 38, backgroundColor: 'rgba(17,17,17,.82)', alignItems: 'center', justifyContent: 'center', gap: 18 },
  lightboxCard: { width: 310, padding: 10, paddingBottom: 40, backgroundColor: '#fff', transform: [{ rotate: '-2deg' }] },
  sheetTitle: { fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 22, color: INK, marginBottom: 6 },
  sheetBody: { fontFamily: 'Figtree_500Medium', fontSize: 14.5, lineHeight: 20, color: 'rgba(17,17,17,.7)', marginBottom: 16 },
  sheetActions: { flexDirection: 'row', gap: 10 },
});
