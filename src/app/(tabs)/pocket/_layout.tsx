// Pocket: one ExpensesProvider (real budget cards from Supabase) shared by the list and detail.
import { Stack } from 'expo-router';

import { C } from '@/theme/tokens';
import { ExpensesProvider } from '@/v2/context/ExpensesContext';

export default function PocketLayout() {
  return (
    <ExpensesProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="manage" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </ExpensesProvider>
  );
}
