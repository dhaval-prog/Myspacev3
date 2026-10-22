// A Throw letter in the chat thread: a paper plane gliding in place (Chat Thread · Sticker). Tap it
// to catch it (unopened letter from them) or to read it again.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { anim, loop } from '@/theme/anim';
import { A, ctGlide, mono, PaperPlaneArt, READ_GREEN } from './threadFx';

export function LetterPlane({
  mine,
  hint,
  hintGreen,
  time,
  entrance,
  night,
  onPress,
}: {
  mine: boolean;
  hint: string;
  hintGreen?: boolean;
  time: string;
  entrance: object | null;
  night: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: 4 }}>
      <A style={entrance}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={mine ? `Your letter, ${hint}` : hint === 'Unopened' ? 'Unopened letter — tap to catch it' : 'Letter — tap to read it again'}
          style={({ pressed }) => [styles.tap, { alignItems: mine ? 'flex-end' : 'flex-start' }, pressed && { transform: [{ scale: 0.96 }] }]}
        >
          <A style={[styles.plane, loop(ctGlide(), 3)]}>
            <View style={{ transform: [{ rotate: `${mine ? -10 : 30}deg` }] }}>
              <PaperPlaneArt width={96} />
            </View>
          </A>
          <Text style={[styles.hint, night && { color: 'rgba(255,255,255,.55)' }, hintGreen && { color: READ_GREEN }]}>{hint}</Text>
        </Pressable>
      </A>
      <Text style={[mono(11.5, night ? 'rgba(255,255,255,.5)' : 'rgba(17,17,17,.55)', 0), { paddingHorizontal: 6 }]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tap: { paddingTop: 6, paddingHorizontal: 6, gap: 2 },
  plane: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: 'Figtree_600SemiBold', fontSize: 13, color: 'rgba(17,17,17,.45)' },
});
