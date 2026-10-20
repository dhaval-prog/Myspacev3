import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';

import { anim, E, skUp } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { A, Icon, ICON, Press, T } from './primitives';

type ScreenProps = {
  style?: StyleProp<ViewStyle>;
  /** Status bar text colour. */
  bar?: string;
  children?: ReactNode;
};

/** Full-screen artboard: background, status bar, and clipped content. */
export function Screen({ style, bar = C.ink, children }: ScreenProps) {
  const light = bar.toLowerCase() === '#fff' || bar.toLowerCase() === '#ffffff';
  return (
    <View style={[{ flex: 1, overflow: 'hidden', backgroundColor: C.paper }, style]}>
      <StatusBar style={light ? 'light' : 'dark'} />
      {children}
    </View>
  );
}

export type TabId = 'chat' | 'throw' | 'map' | 'games' | 'pocket';

const NAV: [TabId, string, string][] = [
  ['chat', ICON.chat, 'Chat'],
  ['throw', ICON.throw, 'Throw'],
  ['map', ICON.map, 'Map'],
  ['games', ICON.games, 'Games'],
  ['pocket', ICON.pocket, 'Pocket'],
];

const ROUTE: Record<TabId, string> = { chat: '/chat', throw: '/throw', map: '/map', games: '/games', pocket: '/pocket' };

/**
 * Floating dark pill tab bar + round "+" button.
 * `tone` follows the source: app-style screens outline the active tab in deep ink,
 * games/pocket in plain ink.
 */
export function TabBar({ active, delay = 0.35, tone = 'deep' }: { active: TabId; delay?: number; tone?: 'deep' | 'ink' }) {
  const deep = tone === 'deep';
  const I = deep ? C.deep : C.ink;
  const barBg = deep ? 'rgba(17,17,17,.92)' : 'rgba(17,17,17,.94)';
  return (
    <A
      style={[
        { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10, paddingHorizontal: 10, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 5 },
        anim(skUp(), 0.5, delay, E.out),
      ]}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: barBg, borderRadius: 999, padding: 6 }}>
        {NAV.map(([id, icon, label]) => {
          const on = id === active;
          const c = on ? I : deep ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.5)';
          return (
            <Press
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
              onPress={() => {
                if (!on) router.replace(ROUTE[id] as any);
              }}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                borderRadius: 999,
                backgroundColor: on ? C.lime : 'transparent',
                borderWidth: 1.5,
                borderColor: on ? I : 'transparent',
                transform: [{ rotate: on ? '-3deg' : '0deg' }],
              }}>
              <Icon d={icon} size={20} color={c} sw={on ? (deep ? 2 : 2.2) : 1.7} />
              <T f={on ? (deep ? F.b7 : F.b8) : F.b5} s={10.5} c={c}>
                {label}
              </T>
            </Press>
          );
        })}
      </View>
      <Press
        accessibilityLabel="Add a friend"
        onPress={() => router.push('/friends')}
        pressed={{ transform: [{ scale: 0.94 }] }}
        style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: barBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon d={ICON.plusSm} size={24} color={C.lime} sw={2.2} />
      </Press>
    </A>
  );
}
