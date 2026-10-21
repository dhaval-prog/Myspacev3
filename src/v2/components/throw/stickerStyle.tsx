// v3 "sticker" look for Throw's panels and slot circles, matching the rest of the app
// (Chats, Map, Pocket): cream cards with an ink outline and a hard offset shadow.
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';

export const S = {
  ink: '#16210C',
  lime: '#C3EA4F',
  tomato: '#FF4F2E',
  paper: '#F4EFE3',
  sky: '#9EB3FF',
  blue: '#2B4BFF',
  faint: 'rgba(22,33,12,.55)',
};

const CARD_RADIUS = 26;

/** Cream glass card: see-through cream over a blur, ink outline, hard shadow. Put <GlassFill /> first inside it. */
export const stickerCard: ViewStyle = {
  backgroundColor: 'rgba(244,239,227,.58)',
  borderWidth: 2,
  borderColor: S.ink,
  borderRadius: CARD_RADIUS,
  boxShadow: `4px 4px 0 ${S.ink}`,
} as ViewStyle;

/** The frosted layer behind a stickerCard's content (blurs whatever is underneath: map, weather). */
export function GlassFill() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: CARD_RADIUS - 2, overflow: 'hidden' }]}>
      <BlurView intensity={36} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(250,246,236,.35)' }]} />
    </View>
  );
}

/** Black pill, white text, white offset — the main action (black/white only, no lime, in Throw's cards). */
export const stickerPrimary: ViewStyle = {
  backgroundColor: S.ink,
  borderWidth: 2,
  borderColor: S.ink,
  boxShadow: `3px 3px 0 #FFFFFF, 3px 3px 0 1.5px ${S.ink}`,
} as ViewStyle;

/** White pill with a black outline, shadow and text — the inverse of the main action. */
export const stickerSecondary: ViewStyle = {
  backgroundColor: '#FFFFFF',
  borderWidth: 2,
  borderColor: S.ink,
  boxShadow: `3px 3px 0 ${S.ink}`,
} as ViewStyle;

/** White field with an ink outline (search boxes, chips). */
export const stickerField: ViewStyle = { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: S.ink } as ViewStyle;

export const monoLabel: TextStyle = { fontFamily: 'SpaceMono_700Bold', fontSize: 10.5, letterSpacing: 1, color: S.faint, textTransform: 'uppercase' };
export const pressedPush: ViewStyle = { transform: [{ translateX: 2 }, { translateY: 2 }] };
