// Conversations and friend flows from Myspace v2: chat thread, group chat, locked (pending)
// thread, requests, create group, QR scanner and match screen. Leaving them hands back to v3's
// own Chats / Add friend / Map screens.
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useFriends } from '@/v2/context/FriendsContext';
import { FriendsScreen } from '@/v2/screens/friends/FriendsScreen';

const OWN_ROUTE: Record<string, string> = { home: '/chat', chats: '/chat', add: '/friends', map: '/map' };

export default function Thread() {
  const { page } = useFriends();
  const target = OWN_ROUTE[page];

  useEffect(() => {
    if (target) router.replace(target as any);
  }, [target]);

  if (target) return null;
  return (
    <FriendsScreen
      onHome={() => router.replace('/chat')}
      onOpenExpenses={() => router.replace('/pocket')}
      onOpenThrow={(focusContactId) => router.replace({ pathname: '/throw', params: focusContactId ? { focus: focusContactId } : {} })}
      onOpenGames={() => router.replace('/games')}
    />
  );
}
