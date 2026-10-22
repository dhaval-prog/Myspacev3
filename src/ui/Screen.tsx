import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { router, useIsFocused } from 'expo-router';

import { C } from '@/theme/tokens';
import { toTab } from './nav';
import { NavDock, type TabId } from './NavDock';

type ScreenProps = {
  style?: StyleProp<ViewStyle>;
  /** Status bar text colour. */
  bar?: string;
  children?: ReactNode;
};

/** Full-screen artboard: background, status bar, and clipped content. */
export function Screen({ style, bar = C.ink, children }: ScreenProps) {
  const light = bar.toLowerCase() === '#fff' || bar.toLowerCase() === '#ffffff';
  // Tabs stay mounted in the background; only the visible one sets the status bar.
  const focused = useIsFocused();
  return (
    <View style={[{ flex: 1, overflow: 'hidden', backgroundColor: C.paper }, style]}>
      {focused ? <StatusBar style={light ? 'light' : 'dark'} /> : null}
      {children}
    </View>
  );
}

export type { TabId } from './NavDock';

const ROUTE = { chat: '/chat', throw: '/throw', map: '/map', games: '/games', pocket: '/pocket' } as const;

/** The bottom menu bar on v3 screens (same NavDock the v2 screens use). */
const GEAR_ICON =
  'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z';

export function TabBar({ active }: { active: TabId }) {
  // On Chats the round button is a settings gear that opens Account settings; elsewhere it adds a friend.
  if (active === 'chat') {
    return <NavDock active={active} onSelect={(id) => toTab(ROUTE[id])} onAdd={() => router.push('/account')} fabIcon={GEAR_ICON} fabLabel="Account settings" />;
  }
  return <NavDock active={active} onSelect={(id) => toTab(ROUTE[id])} onAdd={() => router.push('/friends')} />;
}
