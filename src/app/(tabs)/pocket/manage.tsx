// Full Pocket wallet from Myspace v2: new card, join a shared card, members, history, transfers.
import { router, useLocalSearchParams } from 'expo-router';

import { toTab } from '@/ui/nav';

import { ExpensesScreen } from '@/v2/screens/expenses/ExpensesScreen';

export default function PocketManage() {
  const { card } = useLocalSearchParams<{ card?: string }>();
  return (
    <ExpensesScreen
      focusCardId={card}
      onHome={() => (router.canGoBack() ? router.back() : toTab('/pocket'))}
      onOpenThrow={() => toTab('/throw')}
      onOpenChats={() => toTab('/chat')}
      onOpenMap={() => toTab('/map')}
      onOpenGames={() => toTab('/games')}
      onOpenAccount={() => router.push('/account')}
      onOpenNotificationTarget={() => toTab('/pocket')}
    />
  );
}
