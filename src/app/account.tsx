// Account settings (profile photo, name, password, privacy, sign out) — Myspace v2's screen.
import { router } from 'expo-router';

import { backToTab } from '@/ui/nav';

import { AccountSettingsScreen } from '@/v2/screens/account/AccountSettingsScreen';

export default function Account() {
  return <AccountSettingsScreen onBack={() => (router.canGoBack() ? router.back() : backToTab('/pocket'))} />;
}
