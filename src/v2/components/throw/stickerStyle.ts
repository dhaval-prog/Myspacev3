// v3 "sticker" look for Throw's panels and slot circles, matching the rest of the app
// (Chats, Map, Pocket): cream cards with an ink outline and a hard offset shadow.
import type { TextStyle, ViewStyle } from 'react-native';

export const S = {
  ink: '#16210C',
  lime: '#C3EA4F',
  tomato: '#FF4F2E',
  paper: '#F4EFE3',
  faint: 'rgba(22,33,12,.55)',
};

export const stickerCard: ViewStyle = {
  backgroundColor: S.paper,
  borderWidth: 2,
  borderColor: S.ink,
  borderRadius: 26,
  boxShadow: `4px 4px 0 ${S.ink}`,
} as ViewStyle;

/** Dark pill with a lime offset — the main action (like the Chats screen's add button). */
export const stickerPrimary: ViewStyle = {
  backgroundColor: S.ink,
  borderWidth: 2,
  borderColor: S.ink,
  boxShadow: `3px 3px 0 ${S.lime}`,
} as ViewStyle;

/** Lime pill with an ink outline and shadow — a secondary action. */
export const stickerSecondary: ViewStyle = {
  backgroundColor: S.lime,
  borderWidth: 2,
  borderColor: S.ink,
  boxShadow: `3px 3px 0 ${S.ink}`,
} as ViewStyle;

/** White field with an ink outline (search boxes, chips). */
export const stickerField: ViewStyle = { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: S.ink } as ViewStyle;

export const monoLabel: TextStyle = { fontFamily: 'SpaceMono_700Bold', fontSize: 10.5, letterSpacing: 1, color: S.faint, textTransform: 'uppercase' };
export const pressedPush: ViewStyle = { transform: [{ translateX: 2 }, { translateY: 2 }] };
