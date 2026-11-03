// AD · Account settings (handoff: "Account Settings v4 – Sticker"). One screen for the profile,
// your sticker, Throw settings (location, appearance, weather), friends & requests, security,
// data & privacy and the danger zone. Every row is wired to the real account; animations,
// timings and easing curves follow the handoff (keyframes in theme/animAccount.ts).
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';
import { cubicBezier } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useSetOwnAvatarColor } from '@/state/avatarColors';
import { saveAvatarColor, uploadAvatar, useMyProfile } from '@/state/profile';
import { initialsOf, firstOf, SWATCHES, SWATCH_NAMES } from '@/state/store';
import { anim, E, loop } from '@/theme/anim';
import {
  acBob,
  acConfetti,
  acCrumple,
  acDots,
  acFade,
  acFall,
  acFly,
  acNudge,
  acOutL,
  acOutR,
  acPeel,
  acPop,
  acPopIn,
  acShackle,
  acShake,
  acSheet,
  acStamp,
  acTwinkle,
  acUp,
  acWave,
  acWob,
} from '@/theme/animAccount';
import { C, F } from '@/theme/tokens';
import { Person } from '@/ui/Person';
import { A, Press, T, useStatusBar } from '@/ui/primitives';
import { useAuth } from '@/v2/context/AuthContext';
import { useFriends } from '@/v2/context/FriendsContext';
import { useThrow } from '@/v2/context/ThrowContext';
import { useThrowColorMode, type ThrowColorMode } from '@/v2/context/ThrowColorModeContext';
import { useThrowWeather } from '@/v2/context/ThrowWeatherContext';
import { supabase } from '@/v2/lib/supabase';
import { ThrowLocationSetupScreen } from '@/v2/screens/throw/ThrowLocationSetupScreen';
import type { LocationVisibility } from '@/v2/types/throw';
import type { WeatherCondition } from '@/v2/types/weather';
import { timeAgo } from '@/v2/utils/relativeTime';

// ---------------------------------------------------------------------------------------------
// Tokens (handoff)
const ink = '#111111';
const tom = C.tomato;
const cob = C.cobalt;
const sun = C.sun;
const lime = C.lime;
const peri = C.sky;
const cream = C.paper;
const mute = '#EDE7D8';
const faint = 'rgba(17,17,17,.6)';
const dashed = 'rgba(17,17,17,.12)';
const ok = '#2E7D1F';
const dangerText = '#C42A12';
/** The handoff's exit curve (cubic-bezier(.5,0,.8,.4)) and plane-fly curve (cubic-bezier(.2,.8,.3,1.1)). */
const OUT = cubicBezier(0.5, 0, 0.8, 0.4);
const FLY = cubicBezier(0.2, 0.8, 0.3, 1.1);

const I = {
  back: 'M15 5l-7 7 7 7',
  chev: 'M9 6l6 6-6 6',
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  camera2: 'M4 8h3l2-3h6l2 3h3v11H4z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  check: 'M5 12.5 10 17.5 19 7',
  x: 'M6 6l12 12 M18 6 6 18',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  dev: 'M3 5h13v10H3z M7 19h5 M18 9h3v10h-3z',
  power: 'M12 3v9 M6.3 6.3a8 8 0 1 0 11.4 0',
  dl: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  out: 'M9 21H5V3h4 M16 17l5-5-5-5 M21 12H9',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 14h10l1-14',
  userx: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M17 8l5 5 M22 8l-5 5',
  pin: 'M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeX: 'M17.9 17.9A10 10 0 0 1 12 19c-7 0-11-7-11-7a18 18 0 0 1 5.1-5.9 M9.9 4.2A9 9 0 0 1 12 4c7 0 11 7 11 7a18 18 0 0 1-2.2 3.2 M1 1l22 22',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2',
  bolt: 'M13 2 3 14h9l-1 8 10-12h-9z',
  sticker: 'M12 22a10 10 0 1 1 10-10v2a8 8 0 0 1-8 8z M14 22v-4a4 4 0 0 1 4-4h4',
  sunFull: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  auto: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 3v18',
};

const WEATHER: [WeatherCondition, string, string][] = [
  ['clear', 'Clear', 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42'],
  ['sunny', 'Sunny', 'M17 18a5 5 0 0 0-10 0 M12 2v7 M4.22 10.22l1.42 1.42 M1 18h2 M21 18h2 M18.36 11.64l1.42-1.42 M23 22H1 M16 6l-4-4-4 4'],
  ['cloudy', 'Cloudy', 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'],
  ['rain', 'Rain', 'M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25 M8 19v1 M8 14v1 M12 21v1 M12 16v1 M16 19v1 M16 14v1'],
  ['thunderstorm', 'Storm', 'M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9 M13 11l-4 6h6l-4 6'],
  ['lightning', 'Lightning', 'M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
  ['wind', 'Wind', 'M9.59 4.59A2 2 0 1 1 11 8H2 M12.59 19.41A2 2 0 1 0 14 16H2 M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2'],
  ['snow', 'Snow', 'M12 2v20 M4.93 4.93l14.14 14.14 M2 12h20 M4.93 19.07L19.07 4.93'],
];
const VIS: [LocationVisibility, string][] = [
  ['friends', 'FRIENDS'],
  ['all', 'EVERYONE'],
  ['ghost', 'NOBODY'],
];
const MODES: ThrowColorMode[] = ['auto', 'day', 'night'];

// ---------------------------------------------------------------------------------------------
// Small pieces

const sh = (x: number, c = ink) => `${x}px ${x}px 0 ${c}`;
const pushed: ViewStyle = { transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: '0 0 0 #111' } as ViewStyle;

function Ico({ d, size = 17, color = ink, sw = 2.3, fill = 'none' }: { d: string; size?: number; color?: string; sw?: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Label({ children, mt = 24 }: { children: string; mt?: number }) {
  return (
    <T f={F.m7} s={10.5} ls={1.4} style={{ marginTop: mt, marginBottom: 8, marginLeft: 4 }}>
      {children}
    </T>
  );
}

function GroupHead({ title, tag, bg, fg }: { title: string; tag: string; bg: string; fg: string }) {
  return (
    <View style={{ marginTop: 34, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <T f={F.d8} s={24} ls={-0.7}>
        {title}
      </T>
      <View style={{ backgroundColor: bg, borderWidth: 2, borderColor: ink, borderRadius: 7, paddingVertical: 2, paddingHorizontal: 7, transform: [{ rotate: '-3deg' }] }}>
        <T f={F.m7} s={10} ls={1} c={fg}>
          {tag}
        </T>
      </View>
    </View>
  );
}

const card: ViewStyle = { backgroundColor: '#fff', borderWidth: 2, borderColor: ink, borderRadius: 22, boxShadow: sh(4) } as ViewStyle;

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={{ width: 50, height: 30, flexShrink: 0, borderRadius: 15, backgroundColor: on ? cob : mute, borderWidth: 2, borderColor: ink }}>
      <A
        style={
          {
            position: 'absolute',
            top: 2,
            left: on ? 22 : 2,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#fff',
            borderWidth: 2,
            borderColor: ink,
            transitionProperty: 'left',
            transitionDuration: '0.3s',
            transitionTimingFunction: E.s15,
          } as any
        }
      />
    </View>
  );
}

type RowDef = {
  label: string;
  sub?: string;
  icon: string;
  chip: string;
  ic?: string;
  onPress: () => void;
  value?: string;
  swatch?: string;
  toggle?: boolean;
  danger?: boolean;
};

function Rows({ rows, bg = '#fff' }: { rows: RowDef[]; bg?: string }) {
  return (
    <View style={[card, { backgroundColor: bg, paddingHorizontal: 14 }]}>
      {rows.map((r, i) => (
        <Press
          key={r.label}
          onPress={r.onPress}
          accessibilityRole={r.toggle !== undefined ? 'switch' : 'button'}
          accessibilityState={r.toggle !== undefined ? { checked: r.toggle } : undefined}
          pressed={{ opacity: 0.6 }}
          style={
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 13,
              borderBottomWidth: i === rows.length - 1 ? 0 : 2,
              borderStyle: 'dashed',
              borderColor: dashed,
            } as ViewStyle
          }>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: r.chip,
              borderWidth: 2,
              borderColor: ink,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: `${i % 2 ? 4 : -4}deg` }],
            }}>
            <Ico d={r.icon} color={r.ic ?? ink} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <T f={F.b8} s={14.5} c={r.danger ? dangerText : ink}>
              {r.label}
            </T>
            {r.sub ? (
              <T f={F.b6} s={12} c={faint}>
                {r.sub}
              </T>
            ) : null}
          </View>
          {r.toggle !== undefined ? <Toggle on={r.toggle} /> : null}
          {r.swatch ? <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: r.swatch, borderWidth: 2, borderColor: ink }} /> : null}
          {r.value ? (
            <View style={{ backgroundColor: ink, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 }}>
              <T f={F.m7} s={10.5} c={sun}>
                {r.value}
              </T>
            </View>
          ) : null}
          {r.toggle === undefined ? <Ico d={I.chev} size={16} sw={2.6} /> : null}
        </Press>
      ))}
    </View>
  );
}

function Stamp({ text, color, style, delay = 0, size = 13 }: { text: string; color: string; style?: ViewStyle; delay?: number; size?: number }) {
  return (
    <A
      pointerEvents="none"
      style={[
        { position: 'absolute', borderWidth: 3, borderColor: color, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8 },
        style,
        anim(acStamp(), 0.35, delay, E.s14),
      ]}>
      <T f={F.m7} s={size} ls={1.4} c={color}>
        {text}
      </T>
    </A>
  );
}

const CONFETTI = Array.from({ length: 12 }, (_, i) => {
  const a = ((-170 + i * (160 / 11)) * Math.PI) / 180;
  const r = 60 + ((i * 37) % 50);
  return {
    dx: Math.round(Math.cos(a) * r),
    dy: Math.round(Math.sin(a) * r) - 10,
    rot: (i * 67) % 360,
    s: 8 + (i % 3) * 3,
    bg: [sun, tom, cob, lime, peri, '#FFB4C8'][i % 6],
    round: i % 2 === 1,
    d: (i % 4) * 0.03,
  };
});

function Confetti() {
  return (
    <>
      {CONFETTI.map((c, i) => (
        <A
          key={i}
          pointerEvents="none"
          style={[
            { position: 'absolute', left: '24%', bottom: 26, width: c.s, height: c.s, backgroundColor: c.bg, borderWidth: 2, borderColor: ink, borderRadius: c.round ? c.s / 2 : 3 },
            anim(acConfetti(c.dx, c.dy, c.rot), 0.8, c.d, E.out),
          ]}
        />
      ))}
    </>
  );
}

/** Press-and-hold button: a black bar fills while held; `onDone` fires once it's full. */
function HoldButton({ enabled, duration, label, holdingLabel, doneLabel, done, onDone, onHoldChange }: {
  enabled: boolean;
  duration: number;
  label: string;
  holdingLabel: string;
  doneLabel: string;
  done: boolean;
  onDone: () => void;
  onHoldChange?: (holding: boolean) => void;
}) {
  const [p, setP] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (!timer.current) return;
    clearInterval(timer.current);
    timer.current = null;
    setP(0);
    onHoldChange?.(false);
  };
  const start = () => {
    if (!enabled || done || timer.current) return;
    const t0 = Date.now();
    onHoldChange?.(true);
    timer.current = setInterval(() => {
      const v = (Date.now() - t0) / duration;
      if (v >= 1) {
        clearInterval(timer.current!);
        timer.current = null;
        setP(1);
        onHoldChange?.(false);
        onDone();
      } else setP(v);
    }, 30);
  };
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);
  const on = enabled || done;
  return (
    <Pressable
      onPressIn={start}
      onPressOut={() => p < 1 && stop()}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={
        {
          flex: 1.4,
          height: 54,
          borderRadius: 999,
          overflow: 'hidden',
          backgroundColor: on ? tom : mute,
          borderWidth: 2,
          borderColor: ink,
          boxShadow: on ? sh(3) : '0 0 0 #111',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        } as ViewStyle
      }>
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round((done ? 1 : p) * 100)}%`, backgroundColor: ink }} />
      <T f={F.b8} s={15} c={on ? '#fff' : 'rgba(17,17,17,.45)'}>
        {done ? doneLabel : p > 0 ? holdingLabel : label}
      </T>
    </Pressable>
  );
}

function downloadText(name: string, text: string, type: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// ---------------------------------------------------------------------------------------------

type Sheet = 'look' | 'pw' | 'others' | 'all' | 'logout' | 'wipe' | 'delete' | null;
type Bye = 'logout' | 'all' | 'delete' | null;
type Fields = { name: string; user: string; email: string; phone: string; dob: string };
type Leave = 'accept' | 'decline' | 'remove' | 'block';
type Blocked = { connectionId: string; userId: string; name: string; avatarUrl: string | null };

export function AccountScreen({ onBack }: { onBack: () => void }) {
  const { top, bottom } = useStatusBar();
  const { user, signOut, updatePassword, updateProfileName } = useAuth();
  const { profile, reload } = useMyProfile();
  const setOwnColor = useSetOwnAvatarColor();
  const fr = useFriends();
  const { myLocation, locationVisibility, setLocationVisibility } = useThrow();
  const cm = useThrowColorMode();
  const wx = useThrowWeather();

  const [pane, setPane] = useState<'main' | 'location'>('main');
  const [saved, setSaved] = useState<Fields>({ name: '', user: '', email: user?.email ?? '', phone: '', dob: '' });
  const [v, setV] = useState<Fields>(saved);
  const [stamp, setStamp] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cards, setCards] = useState<{ id: string; label: string }[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [toast, setToast] = useState<{ msg: string; k: number } | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [phase, setPhase] = useState<null | 'run' | 'saving' | 'done'>(null);
  const [bye, setBye] = useState<Bye>(null);
  const [leave, setLeave] = useState<Record<string, Leave | undefined>>({});
  const [armed, setArmed] = useState<Record<string, boolean>>({});
  const [rp, setRp] = useState(0);
  const [fly, setFly] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((t) => ({ msg, k: (t?.k ?? 0) + 1 }));
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // --- load ----------------------------------------------------------------------------------
  const userId = user?.id ?? null;
  const loadBlocked = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('friend_connections').select('id, requester_id, addressee_id').eq('status', 'blocked').eq('blocked_by', userId);
    const rows = (data ?? []) as { id: string; requester_id: string; addressee_id: string }[];
    if (!rows.length) return setBlocked([]);
    const others = rows.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id));
    const { data: ps } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', others);
    const byId = new Map(((ps ?? []) as { id: string; full_name: string | null; avatar_url: string | null }[]).map((p) => [p.id, p]));
    setBlocked(rows.map((r, i) => ({ connectionId: r.id, userId: others[i], name: byId.get(others[i])?.full_name ?? 'Someone', avatarUrl: byId.get(others[i])?.avatar_url ?? null })));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('profiles').select('full_name, username, phone, date_of_birth').eq('id', userId).maybeSingle(),
        supabase.from('budget_cards').select('id, label'),
      ]);
      if (!live) return;
      const row = (p ?? {}) as { full_name?: string | null; username?: string | null; phone?: string | null; date_of_birth?: string | null };
      const f = { name: row.full_name ?? '', user: row.username ?? '', email: user?.email ?? '', phone: row.phone ?? '', dob: row.date_of_birth ?? '' };
      setSaved(f);
      setV(f);
      setCards((c ?? []) as { id: string; label: string }[]);
      await loadBlocked();
    })();
    return () => {
      live = false;
    };
  }, [userId, user?.email, loadBlocked]);

  // --- profile -------------------------------------------------------------------------------
  const av = profile?.avatarColor ?? 0;
  const [avBg, avFg] = SWATCHES[av % SWATCHES.length];
  const shownName = saved.name || profile?.name || 'Your name';
  const initials = initialsOf(shownName);
  const dirty = (Object.keys(v) as (keyof Fields)[]).some((k) => v[k] !== saved[k]);
  const save = async () => {
    if (!dirty || !userId) return;
    setSaveError(null);
    const dob = v.dob.trim();
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return setSaveError('Date of birth must be YYYY-MM-DD.');
    const uname = v.user.trim().toLowerCase();
    if (uname && !/^[a-z0-9_]{3,20}$/.test(uname)) return setSaveError('Username: 3–20 letters, numbers or underscores.');
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: v.name.trim() || null, username: uname || null, phone: v.phone.trim() || null, date_of_birth: dob || null })
      .eq('id', userId);
    if (error) return setSaveError(error.code === '23505' ? 'That username is already taken.' : error.message);
    if (v.name.trim() !== saved.name) await updateProfileName(v.name.trim());
    let emailNote = false;
    if (v.email.trim() && v.email.trim() !== saved.email) {
      const { error: e2 } = await supabase.auth.updateUser({ email: v.email.trim() });
      if (e2) return setSaveError(e2.message);
      emailNote = true;
    }
    const next = { ...v, user: uname, email: emailNote ? saved.email : v.email };
    setSaved(next);
    setV(next);
    setStamp(true);
    reload();
    later(() => setStamp(false), 2200);
    if (emailNote) flash('Check your new inbox to confirm the email');
  };

  // --- your sticker sheet ----------------------------------------------------------------------
  const [dAv, setDAv] = useState(0);
  const [dPhoto, setDPhoto] = useState<string | null>(null);
  const [lookBusy, setLookBusy] = useState(false);
  const openLook = () => {
    setDAv(av);
    setDPhoto(profile?.avatarUrl ?? null);
    setPhase(null);
    setSheet('look');
  };
  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!res.canceled && res.assets[0]) setDPhoto(res.assets[0].uri);
  };
  const saveLook = async () => {
    if (!userId || lookBusy) return;
    setLookBusy(true);
    let avatarUrl: string | null | undefined;
    if (dPhoto !== (profile?.avatarUrl ?? null)) {
      if (dPhoto) {
        const up = await uploadAvatar(userId, dPhoto);
        if (up.error) {
          setLookBusy(false);
          return flash(up.error);
        }
        avatarUrl = up.url;
      } else avatarUrl = null;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_color: dAv, ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}) })
      .eq('id', userId);
    if (!error) await saveAvatarColor(dAv);
    setLookBusy(false);
    if (error) return flash(error.message);
    setOwnColor(userId, dAv);
    reload();
    setSheet(null);
    flash('Look saved');
  };

  // --- password sheet --------------------------------------------------------------------------
  const hasPassword = (user?.identities ?? []).some((i) => i.provider === 'email');
  const [pw, setPw] = useState({ cur: '', nw: '', cf: '' });
  const [pwShow, setPwShow] = useState<Record<string, boolean>>({});
  const [pwNope, setPwNope] = useState(0);
  const [pwError, setPwError] = useState<string | null>(null);
  const nw = pw.nw;
  const score = !nw ? 0 : Math.max(1, Math.min(4, Number(nw.length >= 8) + Number(/[A-Z]/.test(nw) && /[a-z]/.test(nw)) + Number(/\d/.test(nw)) + Number(/[^A-Za-z0-9]/.test(nw))));
  const barC = [tom, tom, sun, lime, lime][score];
  const match = !!pw.cf && pw.cf === nw;
  const mismatch = !!pw.cf && pw.cf !== nw;
  const pwOk = (!hasPassword || !!pw.cur) && nw.length >= 8 && score >= 2 && match;
  const pwMood = pwError ?? (!nw ? 'Make it a good one.' : ['', 'Hmm, too easy to guess.', 'Getting there…', 'Nice and sturdy.', 'Fort Knox. Love it.'][score]);
  const submitPw = async () => {
    if (phase) return;
    if (!pwOk) return setPwNope((n) => n + 1);
    setPwError(null);
    setPhase('saving');
    if (hasPassword && user?.email) {
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.cur });
      if (error) {
        setPhase(null);
        setPwError('That current password isn’t right.');
        return setPwNope((n) => n + 1);
      }
    }
    const { error } = await updatePassword(nw);
    if (error) {
      setPhase(null);
      setPwError(error);
      return setPwNope((n) => n + 1);
    }
    setPhase('done');
    later(() => {
      setSheet(null);
      setPhase(null);
      flash('Password updated');
    }, 1700);
  };

  // --- confirm sheets / danger ------------------------------------------------------------------
  const [delText, setDelText] = useState('');
  const [holding, setHolding] = useState(false);
  const open = (s: Sheet) => {
    setPhase(null);
    setPw({ cur: '', nw: '', cf: '' });
    setPwShow({});
    setPwError(null);
    setDelText('');
    setSheet(s);
  };
  const close = () => {
    if (phase === 'run' || phase === 'saving') return;
    setSheet(null);
    setPhase(null);
  };
  const goodbye = (kind: Exclude<Bye, null>, scope: 'local' | 'global') => {
    setSheet(null);
    setPhase(null);
    setBye(kind);
    later(() => signOut(scope), 2600);
  };
  const confirmTap = async () => {
    if (phase === 'run') return;
    setPhase('run');
    if (sheet === 'others') {
      await signOut('others');
      later(() => {
        setSheet(null);
        setPhase(null);
        flash('Signed out of your other devices');
      }, 650);
    } else if (sheet === 'all') later(() => goodbye('all', 'global'), 650);
    else if (sheet === 'logout') later(() => goodbye('logout', 'local'), 650);
  };
  const wipe = async () => {
    setPhase('run');
    const { error } = await supabase.rpc('delete_own_data');
    later(() => {
      setSheet(null);
      setPhase(null);
      if (error) return flash(error.message);
      setCards([]);
      flash('Budget data deleted');
    }, 1300);
  };
  const deleteAccount = async () => {
    setPhase('run');
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      setPhase(null);
      return flash(error.message);
    }
    later(() => goodbye('delete', 'local'), 200);
  };

  // --- data & privacy ---------------------------------------------------------------------------
  const expenses = async (cols: string) =>
    cards.length ? (((await supabase.from('card_expenses').select(cols).in('card_id', cards.map((c) => c.id))).data ?? []) as unknown as Record<string, unknown>[]) : [];
  const downloadData = async () => {
    flash('Preparing your JSON file…');
    const json = JSON.stringify(
      { exportedAt: new Date().toISOString(), profile: saved, email: user?.email, friends: fr.friends.map((f) => ({ name: f.name, username: f.username })), budgetCards: cards, cardExpenses: await expenses('*') },
      null,
      2,
    );
    if (!downloadText('myspace-my-data.json', json, 'application/json')) flash('Open MySpace on the web to download');
  };
  const exportBudgets = async () => {
    const label = new Map(cards.map((c) => [c.id, c.label]));
    const rows = await expenses('card_id,title,amount,category,spent_on');
    const csv = ['card,title,amount,category,date', ...rows.map((e) => [label.get(e.card_id as string), e.title, e.amount, e.category, e.spent_on].map(csvCell).join(','))].join('\n');
    if (downloadText('myspace-budgets.csv', csv, 'text/csv')) flash('Budgets CSV exported');
    else flash('Open MySpace on the web to export');
  };

  // --- friends ----------------------------------------------------------------------------------
  const setL = (k: string, val: Leave | undefined) => setLeave((p) => ({ ...p, [k]: val }));
  const accept = (id: string, name: string) => {
    if (leave[id]) return;
    setL(id, 'accept');
    later(async () => {
      await fr.acceptRequest(id);
      setL(id, undefined);
      flash(`${firstOf(name)} is now your friend`);
    }, 1000);
  };
  const decline = (id: string, name: string) => {
    if (leave[id]) return;
    setL(id, 'decline');
    later(async () => {
      await fr.declineRequest(id);
      setL(id, undefined);
      flash(`Declined ${firstOf(name)}`);
    }, 850);
  };
  const remove = (id: string, name: string) => {
    if (leave[id]) return;
    if (!armed[id]) {
      setArmed((p) => ({ ...p, [id]: true }));
      later(() => setArmed((p) => ({ ...p, [id]: false })), 2500);
      return;
    }
    setL(id, 'remove');
    later(async () => {
      await fr.removeFriend(id);
      setL(id, undefined);
      flash(`${firstOf(name)} removed`);
    }, 460);
  };
  const block = (id: string, name: string) => {
    if (leave[id]) return;
    setL(id, 'block');
    later(async () => {
      await fr.blockFriend(id);
      setL(id, undefined);
      loadBlocked();
      flash(`${firstOf(name)} blocked`);
    }, 1000);
  };
  const unblock = async (b: Blocked) => {
    const { error } = await supabase.rpc('unblock_friend_connection', { p_connection_id: b.connectionId });
    if (error) return flash(error.message);
    setBlocked((p) => p.filter((x) => x.connectionId !== b.connectionId));
    flash(`${firstOf(b.name)} unblocked`);
  };

  // --- throw settings ---------------------------------------------------------------------------
  const visIdx = Math.max(0, VIS.findIndex(([k]) => k === locationVisibility));
  const cycleVis = () => setLocationVisibility(VIS[(visIdx + 1) % VIS.length][0]);
  const bump = () => setRp((n) => n + 1);
  const paperNight = cm.mode === 'night';
  const mapNight = cm.mapMode === 'night';
  const nm = mapNight && cm.showMapBackground;
  const autoW = wx.mode === 'automatic';

  if (pane === 'location') return <ThrowLocationSetupScreen mode="edit" onDone={() => setPane('main')} onBack={() => setPane('main')} />;

  // ---------------------------------------------------------------------------------------------
  const fields: [keyof Fields, string, string, 'default' | 'email-address' | 'phone-pad' | 'numbers-and-punctuation'][] = [
    ['name', 'FULL NAME', 'Your name', 'default'],
    ['user', 'USERNAME / MYSPACE ID', 'username', 'default'],
    ['email', 'EMAIL ADDRESS', 'you@example.com', 'email-address'],
    ['phone', 'PHONE NUMBER (OPTIONAL)', '+91 …', 'phone-pad'],
    ['dob', 'DATE OF BIRTH (OPTIONAL)', 'YYYY-MM-DD', 'numbers-and-punctuation'],
  ];
  const seg = (value: ThrowColorMode, set: (m: ThrowColorMode) => void) =>
    MODES.map((m, i) => {
      const on = value === m;
      const [label, icon, onBg, onFg] = [
        ['Auto', I.auto, sun, ink],
        ['Day', I.sunFull, '#FFFFFF', ink],
        ['Night', I.moon, '#111111', sun],
      ][i];
      return (
        <Press
          key={m}
          onPress={() => {
            if (on) return;
            set(m);
            bump();
          }}
          accessibilityRole="radio"
          accessibilityState={{ checked: on }}
          pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }, { scale: 0.96 }], boxShadow: '0 0 0 #111' } as ViewStyle}
          style={
            {
              flex: 1,
              height: 42,
              borderRadius: 14,
              backgroundColor: on ? onBg : '#fff',
              borderWidth: 2,
              borderColor: ink,
              boxShadow: on ? sh(3) : '0 0 0 #111',
              transform: on ? [{ translateX: -1 }, { translateY: -2 }, { rotate: '-2deg' }] : [],
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            } as ViewStyle
          }>
          <Ico d={icon} size={16} sw={2.4} color={on ? onFg : ink} />
          <T f={F.b8} s={13} c={on ? onFg : ink}>
            {label}
          </T>
        </Press>
      );
    });

  const confirmCopy = {
    others: { title: 'Log out other devices?', body: "You'll stay signed in here. Every other session signs out right away.", btn: 'Log out others', btnBg: ink, chip: peri, ic: ink, icon: I.dev },
    all: { title: 'Log out of all devices?', body: "Including this one. You'll need your email and password to get back in.", btn: 'Log out everywhere', btnBg: tom, chip: tom, ic: '#fff', icon: I.power },
    logout: { title: 'Log out of MySpace?', body: 'Your chats, cards and letters stay safe. Log back in anytime.', btn: 'Log out', btnBg: ink, chip: '#fff', ic: ink, icon: I.out },
    wipe: { title: 'Delete all my data?', body: 'Clears your budgets and card spending. Your account, friends and chats stay.', btn: 'Delete data', btnBg: tom, chip: tom, ic: '#fff', icon: I.trash },
  } as const;
  const cf = sheet && sheet in confirmCopy ? confirmCopy[sheet as keyof typeof confirmCopy] : null;
  const run = phase === 'run';
  const delOk = delText.trim().toUpperCase() === 'DELETE';
  const byeCopy = {
    logout: { title: `See you soon, ${firstOf(shownName)}!`, body: 'Your chats, cards and letters stay safe right here.', btn: 'Log back in', stamp: 'BYE!', stampC: cob, peel: false },
    all: { title: 'Signed out everywhere.', body: 'All your devices are logged out. Use your email and password to come back.', btn: 'Log back in', stamp: 'ALL CLEAR', stampC: cob, peel: false },
    delete: { title: 'Your space is packed up.', body: 'Your MySpace account and everything in it has been deleted. Thanks for hanging out.', btn: 'Start over', stamp: 'DELETED', stampC: tom, peel: true },
  };

  const reqs = fr.receivedRequests;
  const friendsList = fr.friends;

  return (
    <View style={{ flex: 1, backgroundColor: cream }}>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(17,17,17,.07) 1px, transparent 1px)', backgroundSize: '16px 16px' } as ViewStyle}
      />
      <ScrollView contentContainerStyle={{ paddingTop: top + 10, paddingHorizontal: 20, paddingBottom: bottom + 48 }} keyboardShouldPersistTaps="handled">
        {/* header */}
        <A style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, anim(acUp(), 0.4)]}>
          <Press
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            pressed={pushed}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 2, borderColor: ink, boxShadow: sh(2), alignItems: 'center', justifyContent: 'center' } as ViewStyle}>
            <Ico d={I.back} size={18} sw={2.6} />
          </Press>
          <T f={F.d8} s={36} ls={-1.4}>
            Account
          </T>
        </A>

        <A style={[{ alignItems: 'center', marginTop: 16 }, anim(acUp(), 0.45, 0.05)]}>
          <View style={{ width: 96, height: 96 }}>
            <View
              style={
                {
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: avBg,
                  borderWidth: 2.5,
                  borderColor: ink,
                  boxShadow: sh(4),
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  transform: [{ rotate: '-6deg' }],
                } as ViewStyle
              }>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <T f={F.d8} s={32} c={avFg}>
                  {initials}
                </T>
              )}
            </View>
            <Press
              onPress={openLook}
              accessibilityRole="button"
              accessibilityLabel="Pick your sticker"
              pressed={pushed}
              style={{ position: 'absolute', right: -4, bottom: -2, width: 34, height: 34, borderRadius: 17, backgroundColor: sun, borderWidth: 2, borderColor: ink, boxShadow: sh(2), alignItems: 'center', justifyContent: 'center' } as ViewStyle}>
              <Ico d={I.camera} size={15} sw={2.4} />
            </Press>
          </View>
          <T f={F.d8} s={24} ls={-0.6} style={{ marginTop: 14 }}>
            {shownName}
          </T>
          <View style={{ marginTop: 4, backgroundColor: ink, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8, transform: [{ rotate: '-2deg' }] }}>
            <T f={F.m7} s={11.5} c={sun}>
              @{saved.user || 'username'}
            </T>
          </View>
        </A>

        {/* profile */}
        <Label>PROFILE</Label>
        <View style={[card, { paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16 }]}>
          {fields.map(([k, label, ph, kb]) => (
            <View key={k} style={{ gap: 2, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: dashed }}>
              <T f={F.m7} s={9.5} ls={1} c={faint}>
                {label}
              </T>
              <TextInput
                value={v[k]}
                onChangeText={(t) => {
                  setV((p) => ({ ...p, [k]: t }));
                  setStamp(false);
                  setSaveError(null);
                }}
                placeholder={ph}
                placeholderTextColor="rgba(17,17,17,.4)"
                keyboardType={kb}
                autoCapitalize={k === 'name' ? 'words' : 'none'}
                autoCorrect={false}
                accessibilityLabel={label}
                style={{ fontFamily: F.b7, fontSize: 15.5, color: ink, paddingVertical: 4, outlineStyle: 'none' } as unknown as TextStyle}
              />
            </View>
          ))}
          {saveError ? (
            <T f={F.b7} s={12.5} c={dangerText} style={{ marginTop: 10 }}>
              {saveError}
            </T>
          ) : null}
          <Press
            onPress={save}
            accessibilityRole="button"
            accessibilityState={{ disabled: !dirty }}
            pressed={pushed}
            style={
              {
                marginTop: 14,
                height: 50,
                borderRadius: 999,
                backgroundColor: dirty ? cob : mute,
                borderWidth: 2,
                borderColor: ink,
                boxShadow: dirty ? sh(4) : '0 0 0 #111',
                alignItems: 'center',
                justifyContent: 'center',
              } as ViewStyle
            }>
            <T f={F.b8} s={15} ls={0.3} c={dirty ? '#fff' : 'rgba(17,17,17,.45)'}>
              Save changes
            </T>
          </Press>
          {stamp ? <Stamp text="SAVED" color={tom} size={12} style={{ right: 18, bottom: 46, borderWidth: 2.5, borderRadius: 7 }} /> : null}
        </View>

        {/* your sticker */}
        <Label>YOUR STICKER</Label>
        <Rows
          rows={[
            {
              label: 'Pick your sticker',
              sub: profile?.avatarUrl ? `Photo on a ${SWATCH_NAMES[av].toLowerCase()} ring` : 'Photo & colour — how friends spot you',
              icon: I.sticker,
              chip: avBg,
              ic: avFg,
              onPress: openLook,
              swatch: avBg,
              value: SWATCH_NAMES[av],
            },
          ]}
        />

        {/* throw settings */}
        <GroupHead title="Throw settings" tag="THROW" bg={sun} fg={ink} />
        <Label mt={14}>LOCATION</Label>
        <Rows
          rows={[
            { label: myLocation ? `${myLocation.city}, ${myLocation.country}` : 'Set your location', sub: 'Where your letters are thrown from', icon: I.pin, chip: lime, onPress: () => setPane('location'), value: 'EDIT' },
            { label: 'Who can see my location', sub: 'Controls your pin on the Friends Map', icon: I.eye, chip: peri, onPress: cycleVis, value: VIS[visIdx][1] },
          ]}
        />

        <Label>APPEARANCE</Label>
        <View style={[card, { overflow: 'hidden' }]}>
          <Press
            onPress={() => {
              setFly((n) => n + 1);
              bump();
            }}
            accessibilityRole="button"
            accessibilityLabel="Preview: tap to throw"
            style={
              {
                height: 150,
                overflow: 'hidden',
                borderBottomWidth: 2,
                borderColor: ink,
                backgroundColor: !cm.showMapBackground ? cream : mapNight ? '#1D2142' : '#E4EDD3',
                backgroundImage: cm.showMapBackground ? 'none' : 'radial-gradient(rgba(17,17,17,.12) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              } as ViewStyle
            }>
            {cm.showMapBackground ? (
              <>
                <View style={{ position: 'absolute', left: -20, right: -20, top: 58, height: 12, backgroundColor: mapNight ? '#363C6E' : '#fff', transform: [{ rotate: '-8deg' }] }} />
                <View style={{ position: 'absolute', top: -20, bottom: -20, left: 236, width: 10, backgroundColor: mapNight ? '#363C6E' : '#fff', transform: [{ rotate: '14deg' }] }} />
                <View style={{ position: 'absolute', left: 30, top: 96, width: 64, height: 40, borderRadius: 14, backgroundColor: mapNight ? '#2A3A4A' : lime }} />
              </>
            ) : null}
            {nm ? (
              <>
                <A style={[{ position: 'absolute', left: 150, top: 18, width: 6, height: 6, borderRadius: 3, backgroundColor: sun }, loop(acTwinkle(), 1.8)]} />
                <A style={[{ position: 'absolute', left: 290, top: 110, width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' }, loop(acTwinkle(), 2.2, 0.5)]} />
                <A style={[{ position: 'absolute', left: 200, top: 120, width: 4, height: 4, borderRadius: 2, backgroundColor: sun }, loop(acTwinkle(), 2, 1)]} />
              </>
            ) : null}
            <View style={{ position: 'absolute', right: 12, top: 10, backgroundColor: ink, borderWidth: 2, borderColor: nm ? sun : ink, borderRadius: 7, paddingVertical: 3, paddingHorizontal: 7, transform: [{ rotate: '3deg' }] }}>
              <T f={F.m7} s={10} ls={1} c={sun}>
                {!cm.showMapBackground ? 'NO MAP' : cm.mapMode === 'auto' ? 'AUTO' : cm.mapMode === 'day' ? 'DAY' : 'NIGHT'}
              </T>
            </View>
            <A key={'wob' + rp} style={[{ position: 'absolute', left: 96, top: 30, width: 118, height: 84 }, anim(acWob(rp % 2 ? 'A' : 'B'), 0.5, 0, E.s13)]}>
              <View
                style={
                  {
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: paperNight ? '#111111' : '#fff',
                    borderWidth: 2,
                    borderColor: ink,
                    boxShadow: sh(4, nm ? sun : ink),
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    gap: 7,
                  } as ViewStyle
                }>
                {[0.7, 0.9, 0.55].map((w, i) => (
                  <View key={i} style={{ height: 4, width: `${w * 100}%`, borderRadius: 2, backgroundColor: paperNight ? 'rgba(255,255,255,.45)' : 'rgba(17,17,17,.25)' }} />
                ))}
                <T f={F.m7} s={9} ls={1} c={paperNight ? sun : ink} style={{ marginTop: 'auto' }}>
                  TO: {(friendsList[0]?.name ?? 'Priya').split(' ')[0].toUpperCase()}
                </T>
              </View>
            </A>
            <A key={'fly' + fly} style={[{ position: 'absolute', left: 208, top: 22 }, anim(acFly(fly % 2 ? 'A' : 'B'), 0.7, 0, FLY)]}>
              <A style={loop(acBob(), 2.4)}>
                <Svg width={44} height={44} viewBox="0 0 24 24">
                  <Path d="M22 2 2 9l9 4 4 9z" fill={paperNight ? '#111111' : '#fff'} stroke={paperNight ? sun : ink} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
                  <Path d="M22 2 11 13" fill="none" stroke={paperNight ? sun : ink} strokeWidth={1.6} strokeLinecap="round" />
                </Svg>
              </A>
            </A>
            <T f={F.m7} s={9.5} ls={1} c={nm ? 'rgba(255,255,255,.7)' : 'rgba(17,17,17,.55)'} style={{ position: 'absolute', left: 12, bottom: 10 }}>
              TAP TO THROW
            </T>
          </Press>
          <View style={{ paddingVertical: 4, paddingHorizontal: 14 }}>
            {[
              { label: 'Paper & plane color', sub: "For the letter's paper and plane only", value: cm.mode, set: cm.setMode },
              { label: 'Map color', sub: "For the map's basemap and recipient carousel only", value: cm.mapMode, set: cm.setMapMode },
            ].map((g) => (
              <View key={g.label} style={{ gap: 9, paddingVertical: 12, borderBottomWidth: 2, borderStyle: 'dashed', borderColor: dashed }}>
                <View>
                  <T f={F.b8} s={14.5}>
                    {g.label}
                  </T>
                  <T f={F.b6} s={12} c={faint}>
                    {g.sub}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>{seg(g.value, g.set)}</View>
              </View>
            ))}
            <Press
              onPress={() => {
                cm.setShowMapBackground(!cm.showMapBackground);
                bump();
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: cm.showMapBackground }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T f={F.b8} s={14.5}>
                  Show map background
                </T>
                <T f={F.b6} s={12} c={faint}>
                  Uses your live location — costs more battery and data
                </T>
              </View>
              <Toggle on={cm.showMapBackground} />
            </Press>
          </View>
        </View>

        <Label>WEATHER</Label>
        <Rows
          rows={[
            { label: 'Automatic weather', sub: 'Based on the real weather at your Throw location', icon: I.sun, chip: sun, toggle: autoW, onPress: () => wx.setMode(autoW ? 'manual' : 'automatic') },
            { label: 'Reduce flashing', sub: 'Softer, dimmer lightning instead of a bright flash', icon: I.bolt, chip: '#FFB4C8', toggle: wx.reducedFlashing, onPress: () => wx.setReducedFlashing(!wx.reducedFlashing) },
          ]}
        />
        {!autoW ? (
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {WEATHER.map(([k, label, icon]) => {
              const on = wx.manualCondition === k;
              return (
                <Press
                  key={k}
                  onPress={() => wx.setManualCondition(k)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={
                    {
                      width: '22.9%',
                      aspectRatio: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: ink,
                      backgroundColor: on ? cob : '#fff',
                      boxShadow: on ? sh(3) : '0 0 0 #111',
                      transform: on ? [{ translateX: -1 }, { translateY: -2 }, { rotate: '-3deg' }] : [],
                    } as ViewStyle
                  }>
                  <Ico d={icon} size={22} sw={2.2} color={on ? '#fff' : ink} />
                  <T f={F.b8} s={10} c={on ? '#fff' : ink}>
                    {label}
                  </T>
                </Press>
              );
            })}
          </View>
        ) : null}

        {/* friends */}
        <GroupHead title="Friends" tag={`${friendsList.length} FRIENDS`} bg={cob} fg="#fff" />
        <Label mt={14}>{`FRIEND REQUESTS · ${reqs.length}`}</Label>
        <View style={{ gap: 10 }}>
          {reqs.map((q) => {
            const lv = leave[q.connectionId];
            return (
              <A
                key={q.connectionId}
                style={[
                  { backgroundColor: '#fff', borderWidth: 2, borderColor: ink, borderRadius: 20, boxShadow: sh(3), paddingVertical: 12, paddingHorizontal: 14, gap: 10 } as ViewStyle,
                  lv === 'accept' ? anim(acOutR(), 0.45, 0.55, OUT) : lv === 'decline' ? anim(acOutL(), 0.4, 0.4, OUT) : null,
                ]}>
                <A style={lv === 'decline' ? anim(acShake('A'), 0.35) : null}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <A style={[{ transform: [{ rotate: '-6deg' }] }, lv === 'accept' ? anim(acWob('A'), 0.5, 0, E.s13) : null]}>
                      <Person id={q.userId} name={q.name} avatarUrl={q.avatarUrl} size={40} font={13} ink={ink} style={{ borderWidth: 2, borderColor: ink }} />
                    </A>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T f={F.b8} s={14}>
                        {q.name}
                      </T>
                      <T f={F.m4} s={10.5} c={faint}>
                        {q.username ? `@${q.username}` : 'friend request'} · {timeAgo(q.createdAt)}
                      </T>
                    </View>
                  </View>
                </A>
                <View style={{ backgroundColor: cream, borderWidth: 2, borderColor: ink, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 4, paddingVertical: 8, paddingHorizontal: 11 }}>
                  <T f={F.b6} s={13} lh={19} c="rgba(17,17,17,.75)">
                    {q.introMessage?.trim() || `${firstOf(q.name)} wants to be friends.`}
                  </T>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Press
                    onPress={() => accept(q.connectionId, q.name)}
                    accessibilityRole="button"
                    pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }, { scale: 0.97 }], boxShadow: '0 0 0 #111' } as ViewStyle}
                    style={{ flex: 1, height: 40, borderRadius: 999, backgroundColor: lime, borderWidth: 2, borderColor: ink, boxShadow: sh(2), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 } as ViewStyle}>
                    <Ico d={I.check} size={15} sw={3} />
                    <T f={F.b8} s={13.5}>
                      Accept
                    </T>
                  </Press>
                  <Press
                    onPress={() => decline(q.connectionId, q.name)}
                    accessibilityRole="button"
                    pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }, { scale: 0.97 }] }}
                    style={{ flex: 1, height: 40, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ico d={I.x} size={14} sw={3} />
                    <T f={F.b8} s={13.5}>
                      Decline
                    </T>
                  </Press>
                </View>
                {lv === 'accept' || lv === 'decline' ? <Stamp text={lv === 'accept' ? 'FRIENDS!' : 'DECLINED'} color={lv === 'accept' ? ok : tom} style={{ right: 16, top: 14 }} /> : null}
                {lv === 'accept' ? <Confetti /> : null}
              </A>
            );
          })}
          {!reqs.length ? (
            <A
              style={[
                { backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(17,17,17,.4)', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
                anim(acPopIn(), 0.45, 0, E.s14),
              ]}>
              <A style={[{ width: 34, height: 34, borderRadius: 10, backgroundColor: lime, borderWidth: 2, borderColor: ink, alignItems: 'center', justifyContent: 'center' }, loop(acBob(), 2.4)]}>
                <Ico d={I.check} size={16} sw={3} />
              </A>
              <T f={F.b8} s={13.5}>
                All caught up
              </T>
            </A>
          ) : null}
        </View>

        <Label>YOUR FRIENDS</Label>
        <View style={[card, { paddingHorizontal: 14, overflow: 'hidden' }]}>
          {friendsList.map((f, i) => {
            const lv = leave[f.connectionId];
            const isArmed = !!armed[f.connectionId];
            return (
              <A
                key={f.connectionId}
                style={[
                  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: i === friendsList.length - 1 ? 0 : 2, borderStyle: 'dashed', borderColor: dashed } as ViewStyle,
                  lv === 'remove' ? anim(acCrumple(), 0.45, 0, OUT) : lv === 'block' ? anim(acOutR(), 0.45, 0.55, OUT) : null,
                ]}>
                <View style={{ transform: [{ rotate: `${i % 2 ? 5 : -5}deg` }], filter: lv === 'block' ? 'grayscale(1)' : undefined } as ViewStyle}>
                  <Person id={f.userId} name={f.name} avatarUrl={f.avatarUrl} size={38} font={12.5} ink={ink} style={{ borderWidth: 2, borderColor: ink }} />
                </View>
                <T f={F.b8} s={14} lines={1} style={{ flex: 1, minWidth: 0 }}>
                  {f.name}
                </T>
                <A style={isArmed ? loop(acNudge(), 0.45) : null}>
                  <Press
                    onPress={() => remove(f.connectionId, f.name)}
                    accessibilityRole="button"
                    accessibilityLabel={isArmed ? `Confirm removing ${f.name}` : `Remove ${f.name}`}
                    pressed={{ transform: [{ translateX: 1 }, { translateY: 1 }] }}
                    style={{ height: 32, paddingHorizontal: 11, borderRadius: 999, backgroundColor: isArmed ? sun : '#fff', borderWidth: 2, borderColor: ink, boxShadow: isArmed ? sh(2) : '0 0 0 #111', justifyContent: 'center' } as ViewStyle}>
                    <T f={F.b8} s={12}>
                      {isArmed ? 'Sure?' : 'Remove'}
                    </T>
                  </Press>
                </A>
                <Press
                  onPress={() => block(f.connectionId, f.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Block ${f.name}`}
                  pressed={pushed}
                  style={{ height: 32, paddingHorizontal: 11, borderRadius: 999, backgroundColor: tom, borderWidth: 2, borderColor: ink, boxShadow: sh(2), justifyContent: 'center' } as ViewStyle}>
                  <T f={F.b8} s={12} c="#fff">
                    Block
                  </T>
                </Press>
                {lv === 'block' ? <Stamp text="BLOCKED" color={tom} style={{ left: 60, top: 12 }} /> : null}
              </A>
            );
          })}
          {!friendsList.length ? (
            <T f={F.b7} s={13} c={faint} center style={{ paddingVertical: 16 }}>
              No friends yet
            </T>
          ) : null}
        </View>
        {blocked.length ? (
          <View style={{ marginTop: 12, marginLeft: 4, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <T f={F.m7} s={10} ls={1}>
              BLOCKED · TAP TO UNBLOCK
            </T>
            {blocked.map((b) => (
              <A key={b.connectionId} style={anim(acPopIn(), 0.4, 0, E.s14)}>
                <Press onPress={() => unblock(b)} accessibilityRole="button" accessibilityLabel={`Unblock ${b.name}`} style={{ opacity: 0.75, filter: 'grayscale(1)' } as ViewStyle}>
                  <Person id={b.userId} name={b.name} avatarUrl={b.avatarUrl} size={34} font={11} ink={ink} style={{ borderWidth: 2, borderColor: ink }} />
                  <View style={{ position: 'absolute', left: -3, right: -3, top: 14, height: 3, backgroundColor: tom, borderRadius: 2, transform: [{ rotate: '-40deg' }] }} />
                </Press>
              </A>
            ))}
          </View>
        ) : null}

        {/* login & data */}
        <GroupHead title="Login & data" tag="ACCOUNT" bg="#fff" fg={ink} />
        <Label mt={14}>SECURITY & LOGIN</Label>
        <Rows
          rows={[
            { label: 'Change password', icon: I.lock, chip: sun, onPress: () => open('pw') },
            { label: 'Log out of other devices', sub: 'Keeps you signed in here', icon: I.dev, chip: peri, onPress: () => open('others') },
            { label: 'Log out of all devices', sub: 'Including this one', icon: I.power, chip: tom, ic: '#fff', onPress: () => open('all'), danger: true },
          ]}
        />
        <Label>DATA & PRIVACY</Label>
        <Rows
          rows={[
            { label: 'Download my data', sub: 'Everything below, as one JSON file', icon: I.dl, chip: lime, onPress: downloadData },
            { label: 'Export budgets', sub: 'Budget card spending, CSV', icon: I.chart, chip: sun, onPress: exportBudgets },
            { label: 'Data usage', icon: I.db, chip: peri, onPress: () => flash(`${cards.length} Pocket cards stored`), value: `${cards.length} CARDS` },
          ]}
        />
        <Label>DANGER ZONE</Label>
        <Rows
          bg="#FFE3DC"
          rows={[
            { label: 'Log out', icon: I.out, chip: '#fff', onPress: () => open('logout') },
            { label: 'Delete all my data', sub: 'Budgets — keeps your account', icon: I.trash, chip: tom, ic: '#fff', onPress: () => open('wipe'), danger: true },
            { label: 'Delete MySpace account', sub: 'Permanently removes everything', icon: I.userx, chip: tom, ic: '#fff', onPress: () => open('delete'), danger: true },
          ]}
        />
        <T f={F.m4} s={10.5} c="rgba(17,17,17,.55)" center style={{ marginTop: 22 }}>
          MySpace v3 · Signed in as {user?.email ?? ''}
        </T>
      </ScrollView>

      {/* toast */}
      {toast ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: top + 8, left: 0, right: 0, alignItems: 'center', zIndex: 9 }}>
          <A
            key={toast.k}
            style={[
              { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ink, borderWidth: 2, borderColor: ink, boxShadow: sh(3, sun), borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 } as ViewStyle,
              anim(acPop(), 0.35, 0, E.s14),
            ]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: lime }} />
            <T f={F.b7} s={13} c="#fff">
              {toast.msg}
            </T>
          </A>
        </View>
      ) : null}

      {/* sheets */}
      {sheet ? (
        <>
          <A style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(10,14,50,.5)', zIndex: 7 }, anim(acFade(), 0.25)]}>
            <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close" />
          </A>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end', zIndex: 8 }}>
            <A
              style={[
                {
                  backgroundColor: cream,
                  borderWidth: 2,
                  borderBottomWidth: 0,
                  borderColor: ink,
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  boxShadow: '0 -10px 30px rgba(0,0,40,.3)',
                  paddingTop: 10,
                  paddingHorizontal: 20,
                  paddingBottom: bottom + 30,
                } as ViewStyle,
                anim(acSheet(), 0.4, 0, E.sheet),
              ]}>
              <Pressable onPress={close} accessibilityLabel="Close" style={{ alignSelf: 'center', marginBottom: 14, padding: 4 }}>
                <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: 'rgba(17,17,17,.25)' }} />
              </Pressable>

              {sheet === 'pw' && phase !== 'done' ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <A
                      key={'pwc' + score}
                      style={[
                        { width: 50, height: 50, borderRadius: 15, backgroundColor: sun, borderWidth: 2, borderColor: ink, boxShadow: sh(3), alignItems: 'center', justifyContent: 'center' } as ViewStyle,
                        anim(acWob(score % 2 ? 'A' : 'B'), 0.5, 0, E.s13),
                      ]}>
                      <Ico d={I.lock} size={22} sw={2.4} />
                    </A>
                    <View style={{ flex: 1 }}>
                      <T f={F.d8} s={24} ls={-0.6} lh={26}>
                        Change password
                      </T>
                      <T f={F.b7} s={12.5} c={pwError ? dangerText : faint}>
                        {pwMood}
                      </T>
                    </View>
                  </View>
                  <View style={{ marginTop: 14, gap: 10 }}>
                    {(
                      [
                        ['cur', 'CURRENT PASSWORD', '••••••••'],
                        ['nw', 'NEW PASSWORD', 'At least 8 characters'],
                        ['cf', 'CONFIRM NEW PASSWORD', 'Type it again'],
                      ] as const
                    )
                      .filter(([k]) => k !== 'cur' || hasPassword)
                      .map(([k, label, ph]) => (
                        <A key={k + (k === 'cf' && mismatch ? 'x' : '')} style={[{ gap: 5 }, k === 'cf' && mismatch ? anim(acShake('A'), 0.35) : null]}>
                          <T f={F.m7} s={9.5} ls={1}>
                            {label}
                          </T>
                          <View>
                            <TextInput
                              value={pw[k]}
                              onChangeText={(t) => {
                                setPw((p) => ({ ...p, [k]: t }));
                                setPwError(null);
                              }}
                              placeholder={ph}
                              placeholderTextColor="rgba(17,17,17,.4)"
                              secureTextEntry={!pwShow[k]}
                              autoCapitalize="none"
                              autoCorrect={false}
                              accessibilityLabel={label}
                              style={
                                {
                                  height: 48,
                                  borderWidth: 2,
                                  borderColor: k === 'cf' && mismatch ? tom : k === 'cf' && match ? ok : ink,
                                  borderRadius: 14,
                                  backgroundColor: '#fff',
                                  paddingLeft: 14,
                                  paddingRight: 48,
                                  fontFamily: F.b7,
                                  fontSize: 15,
                                  color: ink,
                                  outlineStyle: 'none',
                                } as unknown as TextStyle
                              }
                            />
                            <Press
                              onPress={() => setPwShow((s) => ({ ...s, [k]: !s[k] }))}
                              accessibilityLabel={pwShow[k] ? 'Hide password' : 'Show password'}
                              pressed={{ transform: [{ scale: 0.88 }] }}
                              style={{ position: 'absolute', right: 6, top: 6, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                              <Ico d={pwShow[k] ? I.eyeX : I.eye} size={18} sw={2.2} />
                            </Press>
                          </View>
                        </A>
                      ))}
                  </View>
                  <View style={{ marginTop: 12, flexDirection: 'row', gap: 6 }}>
                    {[0, 1, 2, 3].map((i) => {
                      const on = i < score;
                      return (
                        <A
                          key={i}
                          style={
                            {
                              flex: 1,
                              height: 10,
                              borderWidth: 2,
                              borderColor: ink,
                              borderRadius: 5,
                              backgroundColor: on ? barC : '#fff',
                              transform: [{ translateY: on ? -2 : 0 }],
                              boxShadow: on ? sh(2) : '0 0 0 #111',
                              transitionProperty: ['transform', 'backgroundColor'],
                              transitionDuration: '0.25s',
                              transitionTimingFunction: E.s15,
                            } as any
                          }
                        />
                      );
                    })}
                  </View>
                  <View style={{ marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T f={F.b7} s={12}>
                      {['Strength', 'Weak', 'Okay', 'Good', 'Strong'][score]}
                    </T>
                    <T f={F.b7} s={12} c={match ? ok : dangerText}>
                      {match ? 'Passwords match' : mismatch ? "Doesn't match" : ''}
                    </T>
                  </View>
                  <A key={'pwb' + pwNope} style={pwNope ? anim(acShake(pwNope % 2 ? 'A' : 'B'), 0.35) : null}>
                    <Press
                      onPress={submitPw}
                      accessibilityRole="button"
                      pressed={pushed}
                      style={
                        {
                          marginTop: 16,
                          height: 54,
                          borderRadius: 999,
                          backgroundColor: pwOk || phase ? cob : mute,
                          borderWidth: 2,
                          borderColor: ink,
                          boxShadow: pwOk ? sh(4) : '0 0 0 #111',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        } as ViewStyle
                      }>
                      {phase === 'saving' ? (
                        [0, 0.15, 0.3].map((d) => <A key={d} style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }, loop(acDots(), 1, d)]} />)
                      ) : (
                        <T f={F.b8} s={15.5} c={pwOk ? '#fff' : 'rgba(17,17,17,.45)'}>
                          Update password
                        </T>
                      )}
                    </Press>
                  </A>
                </>
              ) : null}

              {sheet === 'pw' && phase === 'done' ? (
                <View style={{ alignItems: 'center', paddingTop: 18, paddingBottom: 10 }}>
                  <A
                    style={[
                      { width: 96, height: 96, borderRadius: 28, backgroundColor: lime, borderWidth: 2.5, borderColor: ink, boxShadow: sh(5), alignItems: 'center', justifyContent: 'center' } as ViewStyle,
                      anim(acPopIn(), 0.45, 0, E.s14),
                    ]}>
                    <View style={{ width: 46, height: 46 }}>
                      <A style={[{ position: 'absolute', left: 0, top: 0 }, anim(acShackle(), 0.7, 0.25, E.s14)]}>
                        <Ico d="M8 11V7a4 4 0 0 1 8 0v4" size={46} sw={2.2} />
                      </A>
                      <View style={{ position: 'absolute', left: 0, top: 0 }}>
                        <Svg width={46} height={46} viewBox="0 0 24 24">
                          <Path d="M5 11h14v10H5z" fill="#fff" stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
                          <Path d="M12 15v2" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
                        </Svg>
                      </View>
                    </View>
                    <Stamp text="UPDATED" color={cob} size={12} delay={0.6} style={{ right: -30, top: -12 }} />
                  </A>
                  <A style={anim(acUp(), 0.4, 0.2)}>
                    <T f={F.d8} s={28} ls={-0.8} style={{ marginTop: 20 }}>
                      Locked in.
                    </T>
                  </A>
                  <A style={anim(acUp(), 0.4, 0.3)}>
                    <T f={F.b6} s={14} lh={20} c="rgba(17,17,17,.68)" center style={{ marginTop: 6, maxWidth: 260 }}>
                      Your new password is set. Use it next time you log in.
                    </T>
                  </A>
                </View>
              ) : null}

              {sheet === 'look' ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <T f={F.d8} s={24} ls={-0.6}>
                      Pick your <T f={F.d8} s={24} c={tom}>sticker.</T>
                    </T>
                    <View style={{ backgroundColor: ink, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 }}>
                      <T f={F.m7} s={10} ls={1} c={sun}>
                        YOUR LOOK
                      </T>
                    </View>
                  </View>
                  <T f={F.b6} s={13.5} lh={19} c="rgba(17,17,17,.62)" style={{ marginTop: 4 }}>
                    Add a photo, pick a colour. It&apos;s how friends spot you on chats and the map.
                  </T>
                  <View style={{ marginTop: 18, alignSelf: 'center', width: 150, height: 150 }}>
                    <View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: '#fff', padding: 8, boxShadow: `0 0 0 3px ${ink}, 6px 7px 0 3px ${ink}`, transform: [{ rotate: '-4deg' }] } as ViewStyle}>
                      <View style={{ flex: 1, borderRadius: 75, borderWidth: 6, borderColor: SWATCHES[dAv][0], backgroundColor: SWATCHES[dAv][0], overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                        {dPhoto ? (
                          <Image source={{ uri: dPhoto }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <T f={F.d8} s={48} c={SWATCHES[dAv][1]}>
                            {initials}
                          </T>
                        )}
                      </View>
                    </View>
                    <View style={{ position: 'absolute', right: -22, bottom: 10, backgroundColor: ink, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 10, transform: [{ rotate: '8deg' }], boxShadow: sh(3, SWATCHES[dAv][0]) } as ViewStyle}>
                      <T f={F.m7} s={11} ls={1} c="#fff">
                        {SWATCH_NAMES[dAv]}
                      </T>
                    </View>
                  </View>
                  <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                    <Press
                      onPress={pickPhoto}
                      accessibilityRole="button"
                      pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: '1px 1px 0 #111' } as ViewStyle}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: ink, boxShadow: sh(3), paddingVertical: 10, paddingHorizontal: 16 } as ViewStyle}>
                      <Ico d={I.camera2} size={17} sw={2.4} />
                      <T f={F.b8} s={14}>
                        {dPhoto ? 'Change photo' : 'Add your photo'}
                      </T>
                    </Press>
                    {dPhoto ? (
                      <Press onPress={() => setDPhoto(null)} accessibilityRole="button" style={{ borderRadius: 999, borderWidth: 2, borderColor: ink, paddingVertical: 10, paddingHorizontal: 16 }}>
                        <T f={F.b8} s={14}>
                          Remove
                        </T>
                      </Press>
                    ) : null}
                  </View>
                  <View style={{ marginTop: 18, flexDirection: 'row', gap: 8 }}>
                    {SWATCHES.map(([bg, fg], i) => {
                      const on = i === dAv;
                      return (
                        <Press
                          key={i}
                          onPress={() => setDAv(i)}
                          accessibilityRole="radio"
                          accessibilityLabel={SWATCH_NAMES[i]}
                          accessibilityState={{ checked: on }}
                          style={
                            {
                              flex: 1,
                              aspectRatio: 1,
                              borderRadius: 999,
                              backgroundColor: bg,
                              borderWidth: 2,
                              borderColor: ink,
                              boxShadow: on ? sh(3) : sh(1),
                              transform: on ? [{ translateX: -2 }, { translateY: -3 }, { scale: 1.12 }] : [],
                              alignItems: 'center',
                              justifyContent: 'center',
                            } as ViewStyle
                          }>
                          {on ? <Ico d={I.check} size={15} sw={3.4} color={fg} /> : null}
                        </Press>
                      );
                    })}
                  </View>
                  <Press
                    onPress={saveLook}
                    accessibilityRole="button"
                    pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: `1px 1px 0 ${tom}` } as ViewStyle}
                    style={{ marginTop: 20, height: 54, borderRadius: 999, backgroundColor: ink, borderWidth: 2, borderColor: ink, boxShadow: sh(4, tom), alignItems: 'center', justifyContent: 'center' } as ViewStyle}>
                    <T f={F.b8} s={15.5} ls={0.3} c={sun}>
                      {lookBusy ? 'Saving…' : 'Save my look'}
                    </T>
                  </Press>
                </>
              ) : null}

              {cf ? (
                <>
                  <A
                    key={'cf' + String(run)}
                    style={[
                      { width: 56, height: 56, borderRadius: 16, backgroundColor: cf.chip, borderWidth: 2, borderColor: ink, boxShadow: sh(3), alignItems: 'center', justifyContent: 'center' } as ViewStyle,
                      run ? loop(acNudge(), 0.5) : anim(acWob('A'), 0.6, 0.15, E.s13),
                    ]}>
                    <Ico d={cf.icon} size={24} color={cf.ic} />
                  </A>
                  <T f={F.d8} s={26} ls={-0.8} lh={29} style={{ marginTop: 14 }}>
                    {cf.title}
                  </T>
                  <T f={F.b6} s={14.5} lh={21} c="rgba(17,17,17,.7)" style={{ marginTop: 8 }}>
                    {cf.body}
                  </T>
                  {sheet === 'wipe' ? (
                    <View style={{ marginTop: 14, height: 72, backgroundColor: '#fff', borderWidth: 2, borderColor: ink, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                      {[sun, tom, cob, lime, peri].slice(0, Math.min(5, cards.length)).map((bg, i) => (
                        <A
                          key={i}
                          style={[
                            { width: 42, height: 30, borderRadius: 7, backgroundColor: bg, borderWidth: 2, borderColor: ink, boxShadow: sh(2), transform: [{ rotate: `${[-6, 4, -3, 7, -5][i]}deg` }] } as ViewStyle,
                            run ? anim(acFall(), 0.6, i * 0.12, OUT) : holding ? loop(acShake('A'), 0.3, i * 0.04, 'linear') : null,
                          ]}
                        />
                      ))}
                      <View style={{ marginLeft: 'auto', backgroundColor: ink, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 }}>
                        <T f={F.m7} s={10.5} c={sun}>
                          {(run ? 0 : cards.length) + ' CARDS'}
                        </T>
                      </View>
                    </View>
                  ) : null}
                  <View style={{ marginTop: 18, flexDirection: 'row', gap: 10 }}>
                    <Press onPress={close} accessibilityRole="button" pressed={pushed} style={{ flex: 1, height: 54, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: ink, boxShadow: sh(3), alignItems: 'center', justifyContent: 'center' } as ViewStyle}>
                      <T f={F.b8} s={15}>
                        Cancel
                      </T>
                    </Press>
                    {sheet === 'wipe' ? (
                      <HoldButton enabled duration={1200} label="Hold to delete" holdingLabel="Keep holding…" doneLabel="Deleted" done={run} onDone={wipe} onHoldChange={setHolding} />
                    ) : (
                      <Press onPress={confirmTap} accessibilityRole="button" pressed={pushed} style={{ flex: 1.4, height: 54, borderRadius: 999, backgroundColor: cf.btnBg, borderWidth: 2, borderColor: ink, boxShadow: sh(3), alignItems: 'center', justifyContent: 'center' } as ViewStyle}>
                        <T f={F.b8} s={15} c="#fff">
                          {run ? (sheet === 'logout' ? 'Logging out…' : 'Signing out…') : cf.btn}
                        </T>
                      </Press>
                    )}
                  </View>
                  {sheet === 'wipe' ? (
                    <T f={F.b7} s={11.5} c="rgba(17,17,17,.55)" center style={{ marginTop: 8 }}>
                      Press and hold to confirm
                    </T>
                  ) : null}
                </>
              ) : null}

              {sheet === 'delete' ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <A style={[{ transform: [{ rotate: '-6deg' }] }, holding ? loop(acShake('A'), 0.25, 0, 'linear') : null]}>
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: avBg, borderWidth: 2, borderColor: ink, boxShadow: sh(2), alignItems: 'center', justifyContent: 'center' } as ViewStyle}>
                        <T f={F.d8} s={16} c={avFg}>
                          {initials}
                        </T>
                      </View>
                    </A>
                    <View style={{ borderWidth: 2.5, borderColor: tom, backgroundColor: '#fff', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7, transform: [{ rotate: '-4deg' }] }}>
                      <T f={F.m7} s={10} ls={1} c={tom}>
                        PERMANENT
                      </T>
                    </View>
                  </View>
                  <T f={F.d8} s={26} ls={-0.8} lh={29} style={{ marginTop: 12 }}>
                    Delete your MySpace account?
                  </T>
                  <T f={F.b6} s={14.5} lh={21} c="rgba(17,17,17,.7)" style={{ marginTop: 8 }}>
                    This permanently removes everything: profile, friends, chats, letters, games and Pocket cards. It can&apos;t be undone.
                  </T>
                  <T f={F.m7} s={9.5} ls={1} style={{ marginTop: 14 }}>
                    TYPE DELETE TO CONFIRM
                  </T>
                  <TextInput
                    value={delText}
                    onChangeText={setDelText}
                    placeholder="DELETE"
                    placeholderTextColor="rgba(17,17,17,.4)"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    accessibilityLabel="Type DELETE to confirm"
                    style={
                      {
                        marginTop: 6,
                        height: 50,
                        borderWidth: 2,
                        borderColor: delOk ? tom : ink,
                        borderRadius: 14,
                        backgroundColor: '#fff',
                        paddingHorizontal: 14,
                        fontFamily: F.m7,
                        fontSize: 16,
                        letterSpacing: 2,
                        color: ink,
                        outlineStyle: 'none',
                      } as unknown as TextStyle
                    }
                  />
                  <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
                    <Press onPress={close} accessibilityRole="button" pressed={pushed} style={{ flex: 1, height: 54, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: ink, boxShadow: sh(3), alignItems: 'center', justifyContent: 'center' } as ViewStyle}>
                      <T f={F.b8} s={15}>
                        Keep account
                      </T>
                    </Press>
                    <HoldButton enabled={delOk} duration={1600} label={delOk ? 'Hold to delete' : 'Delete forever'} holdingLabel="Keep holding…" doneLabel="Deleted" done={run} onDone={deleteAccount} onHoldChange={setHolding} />
                  </View>
                  <T f={F.b7} s={11.5} c="rgba(17,17,17,.55)" center style={{ marginTop: 8 }}>
                    {delOk ? 'Press and hold to delete forever' : 'Type DELETE to unlock'}
                  </T>
                </>
              ) : null}
            </A>
          </KeyboardAvoidingView>
        </>
      ) : null}

      {/* goodbye */}
      {bye ? (
        <A
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 12,
              backgroundColor: cream,
              backgroundImage: 'radial-gradient(rgba(17,17,17,.07) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 40,
              paddingHorizontal: 32,
            } as ViewStyle,
            anim(acFade(), 0.35),
          ]}>
          <View style={{ width: 132, height: 132 }}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 66, borderWidth: 3, borderStyle: 'dashed', borderColor: 'rgba(17,17,17,.3)' }} />
            <A style={[{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, byeCopy[bye].peel ? anim(acPeel(), 1.2, 0.6, OUT) : loop(acWave(), 1.4)]}>
              <View style={{ width: 132, height: 132, borderRadius: 66, backgroundColor: avBg, borderWidth: 3, borderColor: ink, boxShadow: sh(6), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } as ViewStyle}>
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <T f={F.d8} s={44} c={avFg}>
                    {initials}
                  </T>
                )}
              </View>
            </A>
            <Stamp text={byeCopy[bye].stamp} color={byeCopy[bye].stampC} delay={0.5} style={{ right: -34, top: -10 }} />
          </View>
          <A style={anim(acUp(), 0.45, 0.2)}>
            <T f={F.d8} s={34} ls={-1.2} lh={36} center style={{ marginTop: 30 }}>
              {byeCopy[bye].title}
            </T>
          </A>
          <A style={anim(acUp(), 0.45, 0.3)}>
            <T f={F.b6} s={15} lh={22} c="rgba(17,17,17,.68)" center style={{ marginTop: 10, maxWidth: 280 }}>
              {byeCopy[bye].body}
            </T>
          </A>
          <A style={anim(acUp(), 0.45, 0.4)}>
            <Press
              onPress={() => signOut(bye === 'all' ? 'global' : 'local')}
              accessibilityRole="button"
              pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: `1px 1px 0 ${cob}` } as ViewStyle}
              style={{ marginTop: 28, height: 54, paddingHorizontal: 28, borderRadius: 999, backgroundColor: ink, borderWidth: 2, borderColor: ink, boxShadow: sh(4, cob), justifyContent: 'center' } as ViewStyle}>
              <T f={F.b8} s={15.5} c={sun}>
                {byeCopy[bye].btn}
              </T>
            </Press>
          </A>
        </A>
      ) : null}
    </View>
  );
}
