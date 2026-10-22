import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const utcDay = (offsetDays: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

/** Your current daily throw streak with one friend (0 once a day has passed with no throw). */
export function useFriendStreak(myId: string | undefined, friendId: string | undefined): number {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    if (!myId || !friendId) return;
    let live = true;
    supabase
      .from('throw_streaks')
      .select('current_streak,last_throw_date')
      .eq('user_id', myId)
      .eq('counterpart_id', friendId)
      .maybeSingle()
      .then(({ data }) => {
        if (!live || !data) return;
        const row = data as { current_streak: number; last_throw_date: string };
        const alive = row.last_throw_date === utcDay(0) || row.last_throw_date === utcDay(-1);
        setStreak(alive ? row.current_streak : 0);
      });
    return () => {
      live = false;
    };
  }, [myId, friendId]);
  return streak;
}
