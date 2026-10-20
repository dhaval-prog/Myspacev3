// Throw — Myspace v2's Throw screen (real map, letters, stories, weather), unchanged.
import { router, useLocalSearchParams } from 'expo-router';

import { useFriends } from '@/v2/context/FriendsContext';
import { ThrowScreen } from '@/v2/screens/throw/ThrowScreen';
import type { NotificationTarget } from '@/v2/utils/notify';

export default function Throw() {
  const { focus, throwId } = useLocalSearchParams<{ focus?: string; throwId?: string }>();
  const { openChat, goRequests, receivedRequests } = useFriends();

  const openTarget = (target: NotificationTarget) => {
    if (target.screen === 'expenses') router.replace({ pathname: '/pocket/[id]', params: { id: target.cardId } });
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
      onHome={() => router.replace('/throw')}
      onOpenExpenses={() => router.replace('/pocket')}
      onOpenChats={() => router.replace('/chat')}
      onOpenMap={() => router.replace('/map')}
      onOpenGames={() => router.replace('/games')}
      onOpenAddFriendScreen={() => router.push('/friends')}
      onNotificationTarget={openTarget}
      onOpenReceivedLetters={(contactId, opts) =>
        router.push({ pathname: '/letters', params: { ...(contactId ? { contact: contactId } : {}), ...(opts?.viaToast ? { toast: '1' } : {}) } })
      }
      initialThrowId={throwId}
      initialFocusContactId={focus}
    />
  );
}
