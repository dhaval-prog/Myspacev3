import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Caveat_400Regular, Caveat_500Medium, Caveat_600SemiBold, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  Figtree_400Regular,
  Figtree_400Regular_Italic,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { loadAsync, useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AvatarColorsProvider } from '@/state/avatarColors';
import { uploadAvatar } from '@/state/profile';
import { StoreProvider, useStore } from '@/state/store';
import { C } from '@/theme/tokens';
import { Boot, hideBoot } from '@/ui/Boot';
import { WebShell } from '@/ui/primitives';
import { CallOverlay } from '@/v2/components/calls/CallOverlay';
import { AuthProvider, useAuth } from '@/v2/context/AuthContext';
import { CallProvider } from '@/v2/context/CallContext';
import { FriendsProvider } from '@/v2/context/FriendsContext';
import { GameProvider } from '@/v2/context/GameContext';
import { GameStatsProvider } from '@/v2/context/GameStatsContext';
import { NotificationsProvider } from '@/v2/context/NotificationsContext';
import { ThrowAlertsOverlay, ThrowAlertsProvider } from '@/v2/context/ThrowAlertsContext';
import { ThrowColorModeProvider } from '@/v2/context/ThrowColorModeContext';
import { TriviaGameProvider } from '@/v2/context/TriviaGameContext';


// Fonts the first screens need — the app waits for these.
const FIRST_FONTS = {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  DMMono_400Regular,
  DMMono_500Medium,
  Caveat_700Bold,
};
// Only used deeper in (Games, Throw) — loaded in the background so they don't hold up launch.
const LATER_FONTS = {
  Figtree_400Regular_Italic,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  Caveat_400Regular,
  Caveat_500Medium,
  Caveat_600SemiBold,
};

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Uploads a photo picked during onboarding once the account has a session. */
function PendingAvatarSync() {
  const { user } = useAuth();
  const { photo, set } = useStore();
  useEffect(() => {
    if (!user || !photo) return;
    uploadAvatar(user.id, photo).then(({ error }) => {
      if (error) console.warn('[avatar] upload failed:', error);
      set({ photo: null });
    });
  }, [user, photo, set]);
  return null;
}

/** The signed-in data layer (same provider stack as Myspace v2). Only mounted with a session. */
function SessionProviders({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <>{children}</>;
  return (
    <AvatarColorsProvider>
    <NotificationsProvider>
      <FriendsProvider>
        <CallProvider>
          <GameProvider>
            <TriviaGameProvider>
              <GameStatsProvider>
                <ThrowColorModeProvider>
                  <ThrowAlertsProvider>
                    {children}
                    <PendingAvatarSync />
                    <CallOverlay />
                    <ThrowAlertsOverlay />
                  </ThrowAlertsProvider>
                </ThrowColorModeProvider>
              </GameStatsProvider>
            </TriviaGameProvider>
          </GameProvider>
        </CallProvider>
      </FriendsProvider>
    </NotificationsProvider>
    </AvatarColorsProvider>
  );
}

function Routes() {
  const { session, initializing } = useAuth();
  // Keep the launch screen up until the first real screen can draw.
  useEffect(() => {
    if (!initializing) hideBoot();
  }, [initializing]);
  if (initializing) return <Boot />;
  const signedIn = !!session;
  return (
    <SessionProviders>
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: C.paper } }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="avatar" />
          <Stack.Screen name="login" />
          <Stack.Screen name="verify" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="success" />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="friends" />
          <Stack.Screen name="thread" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="letters" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="games/npat" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="games/trivia" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="look" options={{ animation: 'slide_from_bottom' }} />
        </Stack.Protected>
      </Stack>
    </SessionProviders>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts(FIRST_FONTS);

  useEffect(() => {
    if (loaded || error) loadAsync(LATER_FONTS).catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return <Boot />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.cobalt }}>
      <SafeAreaProvider>
        <StoreProvider>
          <AuthProvider>
            <WebShell>
              <Routes />
            </WebShell>
          </AuthProvider>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
