// Pocket — Myspace v2's Pocket as-is (card deck, wallet, add/join cards, members, history, transfers),
// with all of its effects and animations.
import { router, useLocalSearchParams } from 'expo-router';

import { toTab } from '@/ui/nav';
import { useFriends } from '@/v2/context/FriendsContext';
import { ExpensesScreen } from '@/v2/screens/expenses/ExpensesScreen';

export default function Pocket() {
  // `card` (from a notification) opens straight into that card's wallet.
  const { card } = useLocalSearchParams<{ card?: string }>();
  const { openChat, goRequests, receivedRequests } = useFriends();
  return (
    <ExpensesScreen
      key={card ?? ''}
      focusCardId={card}
      onHome={() => toTab('/chat')}
      onOpenThrow={() => toTab('/throw')}
      onOpenChats={() => toTab('/chat')}
      onOpenMap={() => toTab('/map')}
      onOpenGames={() => toTab('/games')}
      onOpenAccount={() => router.push('/account')}
      onOpenNotificationTarget={(target) => {
        if (target.screen === 'expenses') router.setParams({ card: target.cardId });
        else if (target.screen === 'friends') {
          if (receivedRequests.some((r) => r.connectionId === target.connectionId)) goRequests();
          else openChat(target.connectionId);
          router.push('/thread');
        } else if (target.screen === 'throw') {
          toTab({ pathname: '/throw', params: 'throwId' in target ? { throwId: target.throwId } : { focus: target.focusContactId } });
        }
      }}
    />
  );
}
