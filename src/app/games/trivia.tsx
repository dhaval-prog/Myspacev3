// Trivia — Myspace v2's real multiplayer trivia (lobby, live questions, scoring).
import { router, useLocalSearchParams } from 'expo-router';

import { backToTab } from '@/ui/nav';

import { TriviaGameScreen } from '@/v2/screens/games/trivia/TriviaGameScreen';

export default function Trivia() {
  const { tab } = useLocalSearchParams<{ tab?: 'create' | 'join' }>();
  return (
    <TriviaGameScreen
      initialTab={tab}
      onHome={() => (router.canGoBack() ? router.back() : backToTab('/games'))}
      onOpenExpenses={() => backToTab('/pocket')}
      onOpenThrow={() => backToTab('/throw')}
      onOpenChats={() => backToTab('/chat')}
      onOpenMap={() => backToTab('/map')}
    />
  );
}
