import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ThrowDetail {
  id: string;
  messageText: string | null;
  /** Photo/video URLs attached to the letter, in order. */
  media: string[];
}

// Letters don't change once thrown, so one fetch per letter per app session is enough.
const cache = new Map<string, ThrowDetail>();

/** Full text and media for the Throw letters behind chat "letter" messages (by throw id). */
export function useThrowDetails(ids: (string | null | undefined)[]): Record<string, ThrowDetail> {
  const wanted = Array.from(new Set(ids.filter((x): x is string => !!x)));
  const key = wanted.sort().join(',');
  const [, setVersion] = useState(0);

  useEffect(() => {
    const missing = key ? key.split(',').filter((id) => !cache.has(id)) : [];
    if (!missing.length) return;
    let live = true;
    supabase
      .from('throws')
      .select('id, message_text, photo_urls, photo_url')
      .in('id', missing)
      .then(({ data, error }) => {
        if (error) return console.warn('[letters] failed to load letter details:', error.message);
        for (const r of (data ?? []) as { id: string; message_text: string | null; photo_urls: string[] | null; photo_url: string | null }[]) {
          const media = r.photo_urls?.length ? r.photo_urls : r.photo_url ? [r.photo_url] : [];
          cache.set(r.id, { id: r.id, messageText: r.message_text, media });
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
