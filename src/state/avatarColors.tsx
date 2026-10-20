// Everyone's chosen sticker colour (profiles.avatar_color), loaded in batches for whoever is on
// screen and cached for the session. Person avatars read from here.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { supabase } from '@/v2/lib/supabase';

type Ctx = {
  colors: Record<string, number | null>;
  want: (userId: string) => void;
  /** Local update after the signed-in user changes their own colour. */
  setOwn: (userId: string, color: number | null) => void;
};

const AvatarColorsCtx = createContext<Ctx | null>(null);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function AvatarColorsProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<Record<string, number | null>>({});
  const pending = useRef(new Set<string>());
  const asked = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    timer.current = null;
    const ids = [...pending.current];
    pending.current.clear();
    if (!ids.length) return;
    const { data, error } = await supabase.from('profiles').select('id, avatar_color').in('id', ids);
    if (error) return console.warn('[avatarColors] load failed:', error.message);
    setColors((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = null;
      for (const row of (data as { id: string; avatar_color: number | null }[]) ?? []) next[row.id] = row.avatar_color;
      return next;
    });
  }, []);

  const want = useCallback(
    (id: string) => {
      if (!UUID.test(id) || asked.current.has(id)) return;
      asked.current.add(id);
      pending.current.add(id);
      if (!timer.current) timer.current = setTimeout(flush, 30);
    },
    [flush],
  );
  const setOwn = useCallback((id: string, color: number | null) => setColors((p) => ({ ...p, [id]: color })), []);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const value = useMemo(() => ({ colors, want, setOwn }), [colors, want, setOwn]);
  return <AvatarColorsCtx.Provider value={value}>{children}</AvatarColorsCtx.Provider>;
}

/** A user's sticker colour index, or null if they haven't picked one (or it's still loading). */
export function useAvatarColor(userId: string | null | undefined): number | null {
  const ctx = useContext(AvatarColorsCtx);
  const id = userId ?? '';
  useEffect(() => {
    if (ctx && id) ctx.want(id);
  }, [ctx, id]);
  if (!ctx || !id) return null;
  return ctx.colors[id] ?? null;
}

export function useSetOwnAvatarColor() {
  return useContext(AvatarColorsCtx)?.setOwn ?? (() => {});
}
