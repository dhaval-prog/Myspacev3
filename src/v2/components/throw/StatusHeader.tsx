// Naked Add Status header: one plain line over the camera — your face (with its status ring),
// "You · Pune · 3 friends · status posted today", a tiny thumbnail of your current status (tap to
// watch, hold to delete) and an "Add friend" text link. No card, no box.
import React, { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AutoplayVideoFill } from '../AutoplayVideoFill';
import { FriendAvatar } from '../friends/FriendAvatar';
import { StoryRing } from './StoryRing';

const FACE = 30;

interface StatusHeaderProps {
  userId: string;
  /** Your real name, for the avatar's initials. */
  name: string;
  avatarUrl: string | null;
  city: string | null;
  friendCount: number;
  storyCount: number;
  status: { uri: string; isVideo: boolean; trimStartMs?: number | null; trimEndMs?: number | null } | null;
  onViewStatus: () => void;
  onDeleteStatus: () => void;
  onAddFriend: () => void;
  /** Reports where your face sits on screen, so a posted photo can fly into it. */
  onFaceCenter?: (p: { x: number; y: number }) => void;
}

export function StatusHeader({ userId, name, avatarUrl, city, friendCount, storyCount, status, onViewStatus, onDeleteStatus, onAddFriend, onFaceCenter }: StatusHeaderProps) {
  const faceRef = useRef<ComponentRef<typeof View>>(null);
  // Holding the thumbnail swaps it for a "Delete" word; tapping that deletes, or it times out.
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3500);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const measureFace = () => {
    if (!onFaceCenter) return;
    requestAnimationFrame(() => {
      faceRef.current?.measureInWindow((x, y, w, h) => onFaceCenter({ x: x + w / 2, y: y + h / 2 }));
    });
  };

  const facts = [city, `${friendCount} friend${friendCount === 1 ? '' : 's'}`, storyCount > 0 ? 'status posted today' : 'no status today'].filter(Boolean).join(' · ');

  return (
    <View style={styles.row} pointerEvents="box-none">
      <View ref={faceRef} onLayout={measureFace} style={styles.face}>
        <StoryRing count={storyCount} size={FACE}>
          <FriendAvatar userId={userId} name={name} avatarUrl={avatarUrl} size={FACE} />
        </StoryRing>
      </View>
      <Text style={styles.line} numberOfLines={1}>
        <Text style={styles.you}>You</Text>
        <Text style={styles.facts}> · {facts}</Text>
      </Text>

      {status ? (
        confirmDelete ? (
          <Pressable
            onPress={() => {
              setConfirmDelete(false);
              onDeleteStatus();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Delete your status"
          >
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onViewStatus}
            onLongPress={() => setConfirmDelete(true)}
            delayLongPress={450}
            hitSlop={8}
            style={({ pressed }) => [styles.thumb, pressed && { transform: [{ scale: 0.92 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Your status. Tap to watch, hold to delete"
          >
            {status.isVideo ? (
              <AutoplayVideoFill uri={status.uri} muted trimStartMs={status.trimStartMs ?? undefined} trimEndMs={status.trimEndMs ?? undefined} />
            ) : (
              <Image source={{ uri: status.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
          </Pressable>
        )
      ) : null}

      <Pressable onPress={onAddFriend} hitSlop={10} accessibilityRole="button" accessibilityLabel="Add friend">
        {({ pressed }) => <Text style={[styles.link, pressed && { opacity: 0.6 }]}>Add friend</Text>}
      </Pressable>
    </View>
  );
}

const halo = { textShadowColor: 'rgba(0,0,0,.65)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, minHeight: 44 },
  face: { alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, minWidth: 0 },
  you: { fontFamily: 'Figtree_800ExtraBold', fontSize: 15, color: '#FFFFFF', ...halo },
  facts: { fontFamily: 'Figtree_500Medium', fontSize: 13, color: 'rgba(255,255,255,.85)', ...halo },
  thumb: { width: 26, height: 34, borderRadius: 6, overflow: 'hidden', backgroundColor: '#222', borderWidth: 1.5, borderColor: '#FFFFFF' },
  delete: { fontFamily: 'Figtree_800ExtraBold', fontSize: 14, color: '#FF5A47', ...halo },
  link: { fontFamily: 'Figtree_700Bold', fontSize: 14, color: '#FFFFFF', textDecorationLine: 'underline', ...halo },
});
