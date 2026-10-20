// Full Pocket wallet from Myspace v2: new card, join a shared card, members, history, transfers.
import { router, useLocalSearchParams } from 'expo-router';

import { ExpensesScreen } from '@/v2/screens/expenses/ExpensesScreen';

export default function PocketManage() {
  const { card } = useLocalSearchParams<{ card?: string }>();
  return (
    <ExpensesScreen
      focusCardId={card}
      onHome={() => (router.canGoBack() ? router.back() : router.replace('/pocket'))}
      onOpenThrow={() => router.replace('/throw')}
      onOpenChats={() => router.replace('/chat')}
      onOpenMap={() => router.replace('/map')}
      onOpenGames={() => router.replace('/games')}
      onOpenAccount={() => router.push('/account')}
      onOpenNotificationTarget={() => router.replace('/pocket')}
    />
  );
}
