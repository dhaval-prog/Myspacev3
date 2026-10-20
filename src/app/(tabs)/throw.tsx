// Throw — Myspace v2's Throw screen (real map, letters, stories, weather), unchanged.
import { router, useLocalSearchParams } from 'expo-router';

import { toTab } from '@/ui/nav';

import { useFriends } from '@/v2/context/FriendsContext';
import { ThrowScreen } from '@/v2/screens/throw/ThrowScreen';
import type { NotificationTarget } from '@/v2/utils/notify';

export default function Throw() {
  const { focus, throwId } = useLocalSearchParams<{ focus?: string; throwId?: string }>();
  const { openChat, goRequests, receivedRequests } = useFriends();

  const openTarget = (target: NotificationTarget) => {
    if (target.screen === 'expenses') toTab({ pathname: '/pocket', params: { card: target.cardId } });
    else if (target.screen === 'friends') {
      if (receivedRequests.some((r) => r.connectionId === target.connectionId)) goRequests();
      else openChat(target.connectionId);
      router.push('/thread');
    } else if (target.screen === 'throw' && 'throwId' in target) router.setParams({ throwId: target.throwId });
    else if (target.screen === 'throw' && 'focusContactId' in target) router.setParams({ focus: target.focusContactId });
  };

  return (
    <ThrowScreen
      key={`${focus ?? ''}|${throwId ?? ''}`}
      onHome={() => toTab('/throw')}
      onOpenExpenses={() => toTab('/pocket')}
      onOpenChats={() => toTab('/chat')}
      onOpenMap={() => toTab('/map')}
      onOpenGames={() => toTab('/games')}
      onOpenAddFriendScreen={() => router.push('/friends')}
      onNotificationTarget={openTarget}
      // Received letters live on the Chats screen's "In the air" bar, not a separate screen.
      onOpenReceivedLetters={() => toTab('/chat')}
      initialThrowId={throwId}
      initialFocusContactId={focus}
    />
  );
}
