// The signed-in user's own profile (profiles row + auth metadata), plus avatar upload.
import { useCallback, useEffect, useState } from 'react';

import type { User } from '@supabase/supabase-js';

import { useAuth } from '@/v2/context/AuthContext';
import { supabase } from '@/v2/lib/supabase';

export type MyProfile = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  friendCode: string | null;
  /** Avatar colour index (SWATCHES), kept in auth user metadata. */
  avatarColor: number;
  createdAt: string | null;
};

async function fetchProfile(user: User): Promise<MyProfile> {
  const { data } = await supabase.from('profiles').select('full_name, username, avatar_url, friend_code, created_at, avatar_color').eq('id', user.id).maybeSingle();
  const meta = (user.user_metadata ?? {}) as { full_name?: string; avatar_color?: number };
  return {
    id: user.id,
    name: data?.full_name || meta.full_name || user.email?.split('@')[0] || 'Friend',
    username: data?.username ?? null,
    avatarUrl: data?.avatar_url ?? null,
    friendCode: data?.friend_code ?? null,
    avatarColor: typeof data?.avatar_color === 'number' ? data.avatar_color : typeof meta.avatar_color === 'number' ? meta.avatar_color : 0,
    createdAt: data?.created_at ?? user.created_at ?? null,
  };
}

export function useMyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!user) return;
    let live = true;
    fetchProfile(user).then((p) => live && setProfile(p));
    return () => {
      live = false;
    };
  }, [user, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { profile: user && profile?.id === user.id ? profile : null, reload };
}

/** Uploads a local image as the user's avatar (same `avatars` bucket + path as v2). */
export async function uploadAvatar(userId: string, localUri: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const blob = await (await fetch(localUri)).blob();
    const ext = (localUri.split('.').pop() || 'jpg').split('?')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${userId}/avatar.${ext.length > 4 ? 'jpg' : ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    const { error: profErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
    if (profErr) throw profErr;
    return { url, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : 'Could not upload your photo.' };
  }
}

/** Saves the avatar colour to the account's metadata. */
export async function saveAvatarColor(index: number) {
  await supabase.auth.updateUser({ data: { avatar_color: index } });
}
