// A chat bubble (Chat Thread · Sticker): lime for mine, white for theirs. Double-tap for a big heart
// and a ♥ chip, hold for the sticker reaction bar, drag right to reply.
import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { anim } from '@/theme/anim';
import { A, buzz, COBALT, COBALT_INK, ctBigHeart, ctHeartChip, ctPicker, ctPop, Heart, INK, LIME, SPRING } from './threadFx';

export const REACTIONS: [string, string][] = [
  ['♥', '#FFB4C8'],
  ['lol', '#FFD23F'],
  ['omg', '#C9EC5A'],
  ['aww', '#9EB3FF'],
  ['+1', '#FFFFFF'],
  ['?!', '#FF8A6B'],
];
const reactColor = (r: string) => REACTIONS.find((x) => x[0] === r)?.[1] ?? '#fff';

/** Reply quotes travel inside the message text as a first line: "↩ quoted text". */
export const QUOTE_PREFIX = '↩ ';
export function splitQuote(text: string): { quote: string | null; body: string } {
  if (text.startsWith(QUOTE_PREFIX)) {
    const nl = text.indexOf('\n');
    if (nl > 0) return { quote: text.slice(QUOTE_PREFIX.length, nl), body: text.slice(nl + 1) };
  }
  return { quote: null, body: text };
}

const PIN_ICON = 'M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z';

export interface ChatBubbleProps {
  mine: boolean;
  kind: 'text' | 'image' | 'location';
  text: string;
  attachmentUrl: string | null;
  night: boolean;
  reaction: string | null;
  pickerOpen: boolean;
  entrance: object | null;
  onReact: (r: string | null) => void;
  onOpenPicker: () => void;
  onReply: (quote: string) => void;
  onOpenPhoto?: (url: string) => void;
}

export function ChatBubble({ mine, kind, text, attachmentUrl, night, reaction, pickerOpen, entrance, onReact, onOpenPicker, onReply, onOpenPhoto }: ChatBubbleProps) {
  const { quote, body } = splitQuote(text);
  const dx = useSharedValue(0);
  const [swipe, setSwipe] = useState(0);
  const [heartKey, setHeartKey] = useState(0);

  const replyText = kind === 'image' ? 'Photo' : kind === 'location' ? '📍 Location' : body;

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX(12)
    .failOffsetX(-12)
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const d = Math.max(0, Math.min(90, e.translationX));
      dx.set(d);
      setSwipe(d);
    })
    .onEnd(() => {
      if (dx.get() > 60) {
        buzz();
        onReply(replyText);
      }
      dx.set(withSpring(0, { damping: 14, stiffness: 220 }));
      setSwipe(0);
    });
  const doubleTap = Gesture.Tap()
    .runOnJS(true)
    .numberOfTaps(2)
    .maxDelay(260)
    .onEnd((_e, ok) => {
      if (!ok) return;
      buzz();
      onReact('♥');
      setHeartKey((k) => k + 1);
    });
  const singleTap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((_e, ok) => {
      if (!ok) return;
      if (kind === 'location' && attachmentUrl) Linking.openURL(attachmentUrl).catch(() => {});
      if (kind === 'image' && attachmentUrl) onOpenPhoto?.(attachmentUrl);
    });
  const hold = Gesture.LongPress()
    .runOnJS(true)
    .minDuration(480)
    .onStart(() => {
      buzz();
      onOpenPicker();
    });
  const gesture = Gesture.Simultaneous(pan, Gesture.Exclusive(hold, doubleTap, singleTap));
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: dx.get() }] }));

  const bubbleStyle: ViewStyle[] = [
    styles.bubble,
    mine ? styles.mine : night ? styles.theirsNight : styles.theirs,
    kind === 'image' ? styles.photoPad : styles.textPad,
  ];

  return (
    <View style={[styles.col, { alignItems: mine ? 'flex-end' : 'flex-start' }]}>
      {pickerOpen ? (
        <A style={[styles.picker, mine ? { right: 0 } : { left: 0 }, anim(ctPicker(), 0.3, 0, SPRING)]}>
          {REACTIONS.map(([r, c], i) => (
            <A key={r} style={anim(ctPop('A'), 0.3, i * 0.03, 'ease-out')}>
              <Pressable
                onPress={() => {
                  buzz();
                  onReact(reaction === r ? null : r);
                }}
                accessibilityRole="button"
                accessibilityLabel={`React ${r}`}
                style={({ pressed }) => [styles.pick, { backgroundColor: c }, pressed && { transform: [{ translateY: -4 }, { scale: 1.15 }] }]}
              >
                <Text style={styles.pickText}>{r}</Text>
              </Pressable>
            </A>
          ))}
        </A>
      ) : null}
      {quote ? (
        <View style={[styles.quote, night && styles.quoteNight]}>
          <Text style={[styles.quoteText, night && { color: 'rgba(255,255,255,.7)' }]} numberOfLines={1}>
            ↩ {quote}
          </Text>
        </View>
      ) : null}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[slide, entrance]}>
          <View style={bubbleStyle}>
            {kind === 'image' && attachmentUrl ? (
              <Image source={{ uri: attachmentUrl }} style={styles.photo} resizeMode="cover" />
            ) : kind === 'location' ? (
              <View style={styles.locRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d={PIN_ICON} fill="none" stroke={mine ? INK : night ? LIME : COBALT_INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={[styles.text, mine ? styles.textMine : night ? styles.textNight : null]}>{body.trim() || 'Location shared · Open in Maps'}</Text>
              </View>
            ) : (
              <Text style={[styles.text, mine ? styles.textMine : night ? styles.textNight : null]}>{body}</Text>
            )}
            {heartKey ? (
              <A key={heartKey} pointerEvents="none" style={[styles.bigHeart, anim(ctBigHeart(), 0.8, 0, 'ease-out')]}>
                <Heart size={60} />
              </A>
            ) : null}
          </View>
          {swipe > 8 ? (
            <View style={[styles.swipeHint, { opacity: Math.min(1, swipe / 70) }]}>
              <Svg width={13} height={13} viewBox="0 0 24 24">
                <Path d="M9 14 4 9l5-5 M4 9h11a5 5 0 0 1 0 10h-3" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          ) : null}
        </Animated.View>
      </GestureDetector>
      {reaction ? (
        <A key={reaction} style={[styles.react, mine ? { marginRight: 8 } : { marginLeft: 8 }, { backgroundColor: reactColor(reaction) }, anim(ctHeartChip(), 0.45, 0, SPRING)]}>
          <Text style={styles.reactText}>{reaction}</Text>
        </A>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { position: 'relative', maxWidth: '78%' },
  bubble: { position: 'relative', boxShadow: '0 3px 0 rgba(30,40,20,.08)' } as ViewStyle,
  textPad: { paddingVertical: 12, paddingHorizontal: 18 },
  photoPad: { padding: 6 },
  mine: { backgroundColor: LIME, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomRightRadius: 6, borderBottomLeftRadius: 22 },
  theirs: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: 'rgba(17,17,17,.1)', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomRightRadius: 22, borderBottomLeftRadius: 6 },
  theirsNight: { backgroundColor: '#2A3324', borderWidth: 2, borderColor: 'rgba(255,255,255,.08)', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomRightRadius: 22, borderBottomLeftRadius: 6 },
  text: { fontFamily: 'Figtree_600SemiBold', fontSize: 16, lineHeight: 21, color: INK },
  textMine: { color: INK },
  textNight: { color: '#F2F4EC' },
  photo: { width: 180, height: 130, borderRadius: 14 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quote: { marginBottom: 3, paddingVertical: 4, paddingHorizontal: 10, borderLeftWidth: 3, borderLeftColor: COBALT, backgroundColor: 'rgba(255,255,255,.6)', borderRadius: 8, maxWidth: '100%' },
  quoteNight: { backgroundColor: 'rgba(255,255,255,.08)' },
  quoteText: { fontFamily: 'Figtree_600SemiBold', fontSize: 12, color: 'rgba(17,17,17,.6)' },
  bigHeart: { position: 'absolute', left: '50%', top: '50%', marginLeft: -30, marginTop: -30 },
  swipeHint: { position: 'absolute', left: -36, top: '50%', marginTop: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: COBALT, alignItems: 'center', justifyContent: 'center' },
  react: { marginTop: -8, zIndex: 2, height: 26, paddingHorizontal: 8, borderRadius: 999, borderWidth: 2, borderColor: INK, justifyContent: 'center' },
  reactText: { fontFamily: 'Caveat_700Bold', fontSize: 16, color: INK },
  picker: { position: 'absolute', bottom: '100%', marginBottom: 6, zIndex: 5, flexDirection: 'row', gap: 4, padding: 5, backgroundColor: '#FAF8F2', borderWidth: 2.5, borderColor: INK, borderRadius: 999, boxShadow: `3px 3px 0 ${INK}` } as ViewStyle,
  pick: { height: 34, minWidth: 34, paddingHorizontal: 8, borderRadius: 999, borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  pickText: { fontFamily: 'Caveat_700Bold', fontSize: 18, color: INK },
});
