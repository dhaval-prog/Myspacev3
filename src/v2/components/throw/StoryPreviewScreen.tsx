import React, { type ComponentRef, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AutoplayVideoFill } from '../AutoplayVideoFill';
import { throwFont } from '../../theme/throwTokens';
import type { StoryMediaType } from '../../types/story';

const FLIGHT_DURATION_MS = 480;
const MIN_SCALE = 0.12;
const MAX_TILT_DEG = 8;
// Used only until the real measurement below resolves, or as a last resort if flightTargetY is
// never given at all — same fallback ContactStoryStack's own flight distance has.
const DEFAULT_FLIGHT_DISTANCE = 260;

interface StoryPreviewScreenProps {
  localUri: string;
  mediaType: StoryMediaType;
  /** The selected contact's own ring in RecipientCarousel, in absolute screen coordinates (see
   * ThrowHomeScreen's own storyFlightTargetY) — the confirmed photo flies toward this exact point,
   * the same destination a consumed story card in ContactStoryStack flies to, so posting one reads
   * as "sending it up to the same place a story lives" rather than inventing a second effect. Falls
   * back to a fixed distance if omitted (tests, or before the first real layout pass resolves it). */
  flightTargetY?: number;
  /** Horizontal target for the flight (your face in the Add Status header); omit to fly straight up. */
  flightTargetX?: number;
  /** How far above the bottom the Post / Retake text sits (clears the menu bar). */
  controlsBottom?: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Shown right after the camera/gallery hands back a photo or short video, before it's actually
 * posted — replaces the compose letter in the same card, the same way StoryCaptureScreen/
 * ContactStoryStack do, rather than a separate full-screen takeover. Two pill buttons along the
 * bottom (per explicit request with its own reference screenshot): "Retake" on the left discards
 * immediately and reopens the camera (see ThrowHomeScreen's own onCancel wiring), "Add to status"
 * on the right is the only way to actually post — tapping it shrinks, tilts, and fades the photo
 * as it flies up toward the contact's ring, and only once that flight finishes does onConfirm
 * actually fire (see ThrowHomeScreen's own handleStoryPreviewConfirmed).
 */
export function StoryPreviewScreen({ localUri, mediaType, flightTargetY, flightTargetX, controlsBottom = 16, onCancel, onConfirm }: StoryPreviewScreenProps) {
  const [flying, setFlying] = useState(false);
  const wrapRef = useRef<ComponentRef<typeof View>>(null);
  const flight = useRef(new Animated.Value(0)).current;
  // Read inside handleConfirm without needing to rebuild it on every relayout.
  const flightDistanceRef = useRef(DEFAULT_FLIGHT_DISTANCE);
  const flightDxRef = useRef(0);

  const onLayout = () => {
    if (flightTargetY == null) return;
    requestAnimationFrame(() => {
      wrapRef.current?.measureInWindow((x, y, width, height) => {
        const ownCenterY = y + height / 2;
        flightDistanceRef.current = Math.max(140, ownCenterY - flightTargetY);
        if (flightTargetX != null) flightDxRef.current = flightTargetX - (x + width / 2);
      });
    });
  };

  const handleConfirm = () => {
    setFlying(true);
    Animated.timing(flight, {
      toValue: -flightDistanceRef.current,
      duration: FLIGHT_DURATION_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onConfirm());
  };

  const flightDistance = Math.max(1, flightDistanceRef.current);
  const mediaStyle = {
    transform: [
      { translateX: flight.interpolate({ inputRange: [-flightDistance, 0], outputRange: [flightDxRef.current, 0], extrapolate: 'clamp' as const }) },
      { translateY: flight },
      { scale: flight.interpolate({ inputRange: [-flightDistance, 0], outputRange: [MIN_SCALE, 1], extrapolate: 'clamp' as const }) },
      { rotate: flight.interpolate({ inputRange: [-flightDistance, 0], outputRange: [`-${MAX_TILT_DEG}deg`, '0deg'], extrapolate: 'clamp' as const }) },
    ],
    opacity: flight.interpolate({ inputRange: [-flightDistance, -flightDistance * 0.82, 0], outputRange: [0, 1, 1], extrapolate: 'clamp' as const }),
  };

  return (
    <View ref={wrapRef} onLayout={onLayout} style={styles.root}>
      <Animated.View style={[styles.card, mediaStyle]}>
        {mediaType === 'photo' ? (
          <Image source={{ uri: localUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <AutoplayVideoFill uri={localUri} />
        )}
      </Animated.View>

      {!flying && (
        // Naked: two plain words over the photo, no pills.
        <View style={[styles.bottomRow, { bottom: controlsBottom }]}>
          <Pressable onPress={onCancel} hitSlop={14} accessibilityRole="button" accessibilityLabel="Retake">
            {({ pressed }) => <Text style={[styles.retakeText, pressed && styles.pressed]}>Retake</Text>}
          </Pressable>

          <Pressable onPress={handleConfirm} hitSlop={14} accessibilityRole="button" accessibilityLabel="Post status">
            {({ pressed }) => <Text style={[styles.confirmText, pressed && styles.pressed]}>Post</Text>}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const halo = { textShadowColor: 'rgba(0,0,0,.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 };

const styles = StyleSheet.create({
  // No overflow constraint here — the card needs to be able to visually travel up past its own
  // resting bounds toward the contact's ring once confirmed; `card` itself (individually rounded)
  // clips only its own photo content.
  root: { flex: 1, position: 'relative' },
  card: { ...StyleSheet.absoluteFill, borderRadius: 28, overflow: 'hidden', backgroundColor: '#000000' },
  bottomRow: {
    position: 'absolute',
    left: 28,
    right: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retakeText: { color: 'rgba(255,255,255,.85)', fontSize: 17, fontFamily: throwFont.ui600, ...halo },
  confirmText: { color: '#FFFFFF', fontSize: 22, fontFamily: throwFont.ui700, letterSpacing: -0.3, ...halo },
  pressed: { opacity: 0.6 },
});
