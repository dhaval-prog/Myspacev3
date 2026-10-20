// NPAT — Myspace v2's real multiplayer Name-Place-Animal-Thing (rooms, rounds, scoring).
import { router, useLocalSearchParams } from 'expo-router';

import { backToTab } from '@/ui/nav';

import { GamesScreen } from '@/v2/screens/games/GamesScreen';

export default function Npat() {
  const { tab } = useLocalSearchParams<{ tab?: 'create' | 'join' }>();
  return (
    <GamesScreen
      initialTab={tab}
      onHome={() => (router.canGoBack() ? router.back() : backToTab('/games'))}
      onOpenExpenses={() => backToTab('/pocket')}
      onOpenThrow={() => backToTab('/throw')}
      onOpenChats={() => backToTab('/chat')}
      onOpenMap={() => backToTab('/map')}
    />
  );
}
