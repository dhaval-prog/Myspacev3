// A list row you can drag left to reveal a delete button on its right (Chats list).
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const REVEAL = 84;
const TRASH = 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 10.5v6.5M13.5 10.5v6.5';
const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

export function SwipeRow({
  open,
  onOpenChange,
  onDelete,
  onPress,
  label,
  children,
}: {
  /** Tapping the row (ignored right after a swipe, so a drag never also opens it). */
  onPress: () => void;
  /** Whether the delete button is showing (only one row is open at a time — the list owns this). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  /** What's being deleted, for the button's accessibility label. */
  label: string;
  children: ReactNode;
}) {
  const x = useSharedValue(0);
  // Set once the drag turns into a swipe, so the tap that ends it doesn't also open the row.
  const swiped = useSharedValue(false);
  useEffect(() => {
    x.set(withSpring(open ? -REVEAL : 0, SPRING));
  }, [open, x]);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      swiped.set(false);
    })
    .onStart(() => {
      swiped.set(true);
    })
    .onUpdate((e) => {
      x.set(Math.max(-REVEAL - 24, Math.min(0, (open ? -REVEAL : 0) + e.translationX)));
    })
    .onEnd((e) => {
      const shouldOpen = x.get() < -REVEAL / 2 || e.velocityX < -500;
      x.set(withSpring(shouldOpen ? -REVEAL : 0, SPRING));
      if (shouldOpen !== open) onOpenChange(shouldOpen);
    });

  const front = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const back = useAnimatedStyle(() => {
    const p = Math.min(1, -x.get() / REVEAL);
    return { opacity: p, transform: [{ scale: 0.6 + 0.4 * p }] };
  });

  return (
    <View>
      <Animated.View style={[styles.deleteWrap, back]}>
        <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel={`Delete ${label}`} style={({ pressed }) => [styles.deleteBtn, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d={TRASH} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={front}>
          <Pressable
            onPress={() => {
              if (swiped.get()) {
                swiped.set(false);
                return;
              }
              onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => pressed && { opacity: 0.85 }}
          >
            {children}
          </Pressable>
          {/* While open, a tap on the row just closes it instead of opening the chat. */}
          {open ? <Pressable style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} accessibilityLabel="Close" /> : null}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  deleteWrap: { position: 'absolute', top: 0, bottom: 0, right: 0, width: REVEAL, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E0452B', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#16210C', boxShadow: '2px 2px 0 #16210C' },
});
