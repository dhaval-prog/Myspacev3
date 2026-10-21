import { Image } from 'expo-image';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { fontFamily } from '../../theme';

const STRIPE_BLUE = '#2F6BFF';
const CREAM = '#F6F1E6';
// react-native-svg's web typings omit `children` on Defs/Pattern (a typing gap, not a runtime
// issue) — cast once, same as FriendsGlow's own DefsAny.
const DefsAny = Defs as unknown as React.ComponentType<{ children?: React.ReactNode }>;
const PatternAny = Pattern as unknown as React.ComponentType<{ children?: React.ReactNode } & Record<string, unknown>>;

/** The handoff's repeating-linear-gradient(135deg,#2F6BFF 0 8px,#F6F1E6 8px 16px) airmail stripe —
 * RN has no repeating-gradient primitive, so this tiles two rects through an SVG pattern instead. */
function AirmailStripe() {
  return (
    <Svg style={[styles.stripeSvg]} width="100%" height="100%">
      <DefsAny>
        <PatternAny id="airmailStripe" width={22.6} height={22.6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect x={0} y={0} width={22.6} height={11.3} fill={STRIPE_BLUE} />
          <Rect x={0} y={11.3} width={22.6} height={11.3} fill={CREAM} />
        </PatternAny>
      </DefsAny>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#airmailStripe)" />
    </Svg>
  );
}

/**
 * The airmail "letter card" a thrown Throw letter shows up as in Chats — the MySpace Chats Throw
 * handoff's own blue/cream diagonal-stripe border, Caveat title, dashed postmark place tag, and
 * "Break seal" button. Shared by the group thread (a letter-kind group message) and the 1:1
 * thread (Throw's own sendThrow posts one into the DM thread instead of a plain system note).
 * Identical in day and night (the handoff never themes it), so there's no isDay variant here.
 */
export function LetterThrownCard({
  title,
  place,
  toLabel,
  timeLabel,
  onBreakSeal,
  body,
  media,
}: {
  title: string;
  /** The letter's full text (replaces the short title when loaded). */
  body?: string | null;
  /** Photos/videos thrown with the letter. */
  media?: string[];
  place: string | null;
  /** The "TO ..." line's destination — a group's name, or a friend's name in a 1:1 thread. */
  toLabel: string;
  timeLabel: string;
  onBreakSeal: () => void;
}) {
  return (
    <View style={styles.stripeFrame}>
      <AirmailStripe />
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <View style={styles.topText}>
            <Text style={styles.kicker}>PAR AVION · TO {toLabel.toUpperCase()}</Text>
            <Text style={styles.title} numberOfLines={body ? undefined : 2}>
              {body?.trim() || title}
            </Text>
          </View>
          {place ? (
            <View style={styles.postmark}>
              <Text style={styles.postmarkText} numberOfLines={1}>
                {place}
              </Text>
            </View>
          ) : null}
        </View>
        {media?.length ? <LetterMedia urls={media} /> : null}
        <View style={styles.bottomRow}>
          <Text style={styles.time}>{timeLabel}</Text>
          <Pressable onPress={onBreakSeal} style={styles.breakSeal} accessibilityRole="button" accessibilityLabel="Break seal">
            <View style={styles.breakSealDot} />
            <Text style={styles.breakSealText}>Break seal</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const isVideo = (url: string) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);

/** The letter's photos (and videos) — one large, or a two-up grid when there are several. */
function LetterMedia({ urls }: { urls: string[] }) {
  const one = urls.length === 1;
  return (
    <View style={styles.mediaGrid}>
      {urls.slice(0, 4).map((url, i) => {
        const more = i === 3 && urls.length > 4 ? urls.length - 4 : 0;
        return (
          <Pressable key={url + i} onPress={() => Linking.openURL(url)} accessibilityRole="imagebutton" accessibilityLabel={isVideo(url) ? 'Open video' : 'Open photo'} style={[styles.mediaTile, one ? styles.mediaOne : styles.mediaHalf]}>
            {isVideo(url) ? (
              <View style={styles.videoTile}>
                <Text style={styles.videoGlyph}>▶</Text>
              </View>
            ) : (
              <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            )}
            {more ? (
              <View style={styles.moreTile}>
                <Text style={styles.moreText}>+{more}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mediaTile: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#E6DFD0', borderWidth: 1.5, borderColor: '#16210C' },
  mediaOne: { width: '100%', aspectRatio: 4 / 3 },
  mediaHalf: { width: '48%', aspectRatio: 1 },
  videoTile: { flex: 1, backgroundColor: '#16210C', alignItems: 'center', justifyContent: 'center' },
  videoGlyph: { color: '#C3EA4F', fontSize: 22 },
  moreTile: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(22,33,12,.55)', alignItems: 'center', justifyContent: 'center' },
  moreText: { color: '#fff', fontFamily: 'SpaceMono_700Bold', fontSize: 16 },
  stripeSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stripeFrame: {
    width: 236,
    borderRadius: 18,
    borderBottomLeftRadius: 7,
    padding: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  inner: {
    borderRadius: 13,
    borderBottomLeftRadius: 4,
    backgroundColor: CREAM,
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  topText: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    fontFamily: fontFamily.mono500,
    fontSize: 8.5,
    letterSpacing: 1,
    color: '#8A8A8A',
  },
  title: {
    fontFamily: 'Caveat_600SemiBold',
    fontSize: 22,
    lineHeight: 24,
    color: '#2346C8',
  },
  postmark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(47,107,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
    flexShrink: 0,
  },
  postmarkText: {
    fontFamily: fontFamily.mono500,
    fontSize: 6.5,
    color: STRIPE_BLUE,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontFamily: fontFamily.mono500,
    fontSize: 10.5,
    color: '#8A8A8A',
  },
  breakSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: STRIPE_BLUE,
  },
  breakSealDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  breakSealText: {
    fontFamily: fontFamily.sans700,
    fontSize: 12,
    color: '#FFFFFF',
  },
});
