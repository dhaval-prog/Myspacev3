// Account — the Sticker-style Account screen (profile, your sticker, Throw settings, friends,
// security, data & privacy, danger zone). Same screen as Throw's settings gear.
import { router } from 'expo-router';

import { AccountScreen } from '@/screens/AccountScreen';
import { backToTab } from '@/ui/nav';
import { ThrowProvider } from '@/v2/context/ThrowContext';
import { ThrowWeatherProvider } from '@/v2/context/ThrowWeatherContext';

export default function Account() {
  return (
    <ThrowProvider>
      <ThrowWeatherProvider>
        <AccountScreen onBack={() => (router.canGoBack() ? router.back() : backToTab('/pocket'))} />
      </ThrowWeatherProvider>
    </ThrowProvider>
  );
}
