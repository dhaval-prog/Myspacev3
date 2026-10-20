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
export function TabBar({ active }: { active: TabId }) {
  return <NavDock active={active} onSelect={(id) => toTab(ROUTE[id])} onAdd={() => router.push('/friends')} />;
}
