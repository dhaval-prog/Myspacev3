// NPAT — Myspace v2's real multiplayer Name-Place-Animal-Thing (rooms, rounds, scoring).
import { router, useLocalSearchParams } from 'expo-router';

import { GamesScreen } from '@/v2/screens/games/GamesScreen';

export default function Npat() {
  const { tab } = useLocalSearchParams<{ tab?: 'create' | 'join' }>();
  return (
    <GamesScreen
      initialTab={tab}
      onHome={() => (router.canGoBack() ? router.back() : router.replace('/games'))}
      onOpenExpenses={() => router.replace('/pocket')}
      onOpenThrow={() => router.replace('/throw')}
      onOpenChats={() => router.replace('/chat')}
      onOpenMap={() => router.replace('/map')}
    />
  );
}
