import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';

import { C } from '@/theme/tokens';
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
  return (
    <View style={[{ flex: 1, overflow: 'hidden', backgroundColor: C.paper }, style]}>
      <StatusBar style={light ? 'light' : 'dark'} />
      {children}
    </View>
  );
}

export type { TabId } from './NavDock';

const ROUTE: Record<TabId, string> = { chat: '/chat', throw: '/throw', map: '/map', games: '/games', pocket: '/pocket' };

/** The bottom menu bar on v3 screens (same NavDock the v2 screens use). */
export function TabBar({ active }: { active: TabId }) {
  return <NavDock active={active} onSelect={(id) => router.replace(ROUTE[id] as any)} onAdd={() => router.push('/friends')} />;
}
