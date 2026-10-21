// Throw map pin — the same sticker pin as the Map screen: a teardrop with the person's avatar
// (their photo or chosen colour + initials), ink outline and hard shadow, with a small name tag.
// The teardrop's tip sits exactly on the location.
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Person } from '@/ui/Person';

const INK = '#16210C';
/** Teardrop size (the rotated square's side), regular and selected. */
export const PIN_SIZE = 40;
export const PIN_SIZE_SELECTED = 50;
/** Distance from the top of the glyph to the teardrop's tip: half the side plus half the diagonal. */
export const pinTipOffset = (size: number) => size * 1.207;

interface LocationPinGlyphProps {
  label: string;
  /** The person's id and photo, for their avatar. */
  userId?: string;
  avatarUrl?: string | null;
  /** Full name for the avatar's initials (the tag shows `label`). */
  fullName?: string;
  isSelf?: boolean;
  /** The currently-selected recipient — bigger, with a stronger shadow. */
  selected?: boolean;
  /** A friend who isn't the current selection — faded so the selected one reads clearly. */
  dimmed?: boolean;
  /** Night map (unused: the sticker pin reads on both basemaps). */
  isNight?: boolean;
}

/** The pin's visual with no positioning of its own — a native map Marker's child, and inside `LocationPin` on web. */
export function LocationPinGlyph({ label, userId, avatarUrl, fullName, isSelf, selected, dimmed }: LocationPinGlyphProps) {
  const size = selected ? PIN_SIZE_SELECTED : PIN_SIZE;
  const inner = size - 10;
  return (
    <View style={[styles.stack, dimmed && styles.dimmed]}>
      <View
        style={[
          styles.drop,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderBottomLeftRadius: 4,
            backgroundColor: '#FFFFFF',
            boxShadow: selected ? `4px 4px 0 ${INK}` : `2px 2px 0 ${INK}`,
          } as ViewStyle,
        ]}>
        <View style={{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', transform: [{ rotate: '45deg' }] }}>
          <Person id={userId ?? label} name={fullName || label} avatarUrl={avatarUrl} size={inner} font={Math.round(inner * 0.36)} ink={INK} />
        </View>
      </View>
      <View style={[styles.tag, { marginTop: Math.round(size * 0.21) + 3 }, isSelf && styles.tagSelf, selected && styles.tagSelected]}>
        <Text style={[styles.tagText, (isSelf || selected) && styles.tagTextOn]} numberOfLines={1}>
          {isSelf ? 'YOU' : label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

interface LocationPinProps extends LocationPinGlyphProps {
  x: number;
  y: number;
  onPress?: () => void;
}

/** A pin absolutely positioned over the web map by pixel x/y, its tip on the point. */
export function LocationPin({ x, y, onPress, ...glyph }: LocationPinProps) {
  const size = glyph.selected ? PIN_SIZE_SELECTED : PIN_SIZE;
  const content = <LocationPinGlyph {...glyph} />;
  return (
    <View style={[styles.wrap, { left: x - 45, top: y - pinTipOffset(size), zIndex: glyph.selected ? 2 : 1 }]} pointerEvents={onPress ? 'box-none' : 'none'}>
      {onPress ? (
        <Pressable onPress={onPress} hitSlop={8}>
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: 90, alignItems: 'center' },
  stack: { alignItems: 'center' },
  dimmed: { opacity: 0.55 },
  drop: { transform: [{ rotate: '-45deg' }], borderWidth: 2, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  tag: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: INK, borderRadius: 6, paddingVertical: 1, paddingHorizontal: 6, maxWidth: 90 },
  tagSelf: { backgroundColor: INK },
  tagSelected: { backgroundColor: INK },
  tagText: { fontFamily: 'SpaceMono_700Bold', fontSize: 9.5, letterSpacing: 0.6, color: INK },
  tagTextOn: { color: '#FFFFFF' },
});
