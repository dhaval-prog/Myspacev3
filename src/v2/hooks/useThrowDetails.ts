import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ThrowDetail {
  id: string;
  messageText: string | null;
  /** Photo/video URLs attached to the letter, in order. */
  media: string[];
  /** When the recipient opened it (null while unopened). */
  readAt: string | null;
  /** Hugs the recipient has sent back for this letter. */
  hugCount: number;
}

// A letter's text and media never change once thrown; its read state and hugs do, so every letter
// on screen is re-checked when the set of letters changes (the cache still shows instantly).
const cache = new Map<string, ThrowDetail>();

/** Full text and media for the Throw letters behind chat "letter" messages (by throw id). */
export function useThrowDetails(ids: (string | null | undefined)[]): Record<string, ThrowDetail> {
  const wanted = Array.from(new Set(ids.filter((x): x is string => !!x)));
  const key = wanted.sort().join(',');
  const [, setVersion] = useState(0);

  useEffect(() => {
    const missing = key ? key.split(',') : [];
    if (!missing.length) return;
    let live = true;
    supabase
      .from('throws')
      .select('id, message_text, photo_urls, photo_url, read_at, hug_count')
      .in('id', missing)
      .then(({ data, error }) => {
        if (error) return console.warn('[letters] failed to load letter details:', error.message);
        for (const r of (data ?? []) as { id: string; message_text: string | null; photo_urls: string[] | null; photo_url: string | null; read_at: string | null; hug_count: number | null }[]) {
          const media = r.photo_urls?.length ? r.photo_urls : r.photo_url ? [r.photo_url] : [];
          cache.set(r.id, { id: r.id, messageText: r.message_text, media, readAt: r.read_at, hugCount: r.hug_count ?? 0 });
        }
        if (live) setVersion((v) => v + 1);
      });
    return () => {
      live = false;
    };
  }, [key]);

  const out: Record<string, ThrowDetail> = {};
  for (const id of wanted) {
    const d = cache.get(id);
    if (d) out[id] = d;
  }
  return out;
}

/** Marks a received letter as opened (server + local cache). */
export async function markLetterOpened(throwId: string) {
  const d = cache.get(throwId);
  if (d && !d.readAt) cache.set(throwId, { ...d, readAt: new Date().toISOString() });
  const { error } = await supabase.rpc('mark_throw_read', { p_throw_id: throwId });
  if (error) console.warn('[letters] mark_throw_read failed:', error.message);
}

/** Sends `count` hugs back for a received letter; resolves to the letter's new total. */
export async function sendLetterHugs(throwId: string, count: number): Promise<number | null> {
  const { data, error } = await supabase.rpc('hug_throw', { p_throw_id: throwId, p_count: count });
  if (error) {
    console.warn('[letters] hug_throw failed:', error.message);
    return null;
  }
  const total = typeof data === 'number' ? data : null;
  const d = cache.get(throwId);
  if (d && total != null) cache.set(throwId, { ...d, hugCount: total });
  return total;
}
