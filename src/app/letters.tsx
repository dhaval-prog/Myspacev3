// Received Throw letters — Myspace v2's letters screen.
import { useLocalSearchParams } from 'expo-router';

import { backToTab } from '@/ui/nav';

import { ThrowReceivedLettersScreen } from '@/v2/screens/throw/ThrowReceivedLettersScreen';

export default function Letters() {
  const { contact, toast } = useLocalSearchParams<{ contact?: string; toast?: string }>();
  return (
    <ThrowReceivedLettersScreen
      initialContactId={contact}
      viaToast={toast === '1'}
      onOpenThrow={() => backToTab('/throw')}
      onOpenChats={() => backToTab('/chat')}
      onOpenMap={() => backToTab('/map')}
      onOpenGames={() => backToTab('/games')}
      onOpenExpenses={() => backToTab('/pocket')}
    />
  );
}
