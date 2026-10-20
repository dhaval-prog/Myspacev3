// Received Throw letters — Myspace v2's letters screen.
import { router, useLocalSearchParams } from 'expo-router';

import { ThrowReceivedLettersScreen } from '@/v2/screens/throw/ThrowReceivedLettersScreen';

export default function Letters() {
  const { contact, toast } = useLocalSearchParams<{ contact?: string; toast?: string }>();
  return (
    <ThrowReceivedLettersScreen
      initialContactId={contact}
      viaToast={toast === '1'}
      onOpenThrow={() => router.replace('/throw')}
      onOpenChats={() => router.replace('/chat')}
      onOpenMap={() => router.replace('/map')}
      onOpenGames={() => router.replace('/games')}
      onOpenExpenses={() => router.replace('/pocket')}
    />
  );
}
