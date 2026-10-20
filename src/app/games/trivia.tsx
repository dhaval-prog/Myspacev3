// Trivia — Myspace v2's real multiplayer trivia (lobby, live questions, scoring).
import { router, useLocalSearchParams } from 'expo-router';

import { TriviaGameScreen } from '@/v2/screens/games/trivia/TriviaGameScreen';

export default function Trivia() {
  const { tab } = useLocalSearchParams<{ tab?: 'create' | 'join' }>();
  return (
    <TriviaGameScreen
      initialTab={tab}
      onHome={() => (router.canGoBack() ? router.back() : router.replace('/games'))}
      onOpenExpenses={() => router.replace('/pocket')}
      onOpenThrow={() => router.replace('/throw')}
      onOpenChats={() => router.replace('/chat')}
      onOpenMap={() => router.replace('/map')}
    />
  );
}
