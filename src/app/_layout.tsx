import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular_Italic } from '@expo-google-fonts/figtree';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { uploadAvatar } from '@/state/profile';
import { StoreProvider, useStore } from '@/state/store';
import { C } from '@/theme/tokens';
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
import { fontsToLoad } from '@/v2/theme/fonts';

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
  );
}

function Routes() {
  const { session, initializing } = useAuth();
  if (initializing) return <View style={{ flex: 1, backgroundColor: C.cobalt }} />;
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
          <Stack.Screen name="friends" />
          <Stack.Screen name="chat" options={{ animation: 'none' }} />
          <Stack.Screen name="thread" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="throw" options={{ animation: 'none' }} />
          <Stack.Screen name="letters" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="map" options={{ animation: 'none' }} />
          <Stack.Screen name="games/index" options={{ animation: 'none' }} />
          <Stack.Screen name="games/npat" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="games/trivia" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="pocket" options={{ animation: 'none' }} />
          <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
      </Stack>
    </SessionProviders>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...fontsToLoad,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    Figtree_400Regular_Italic,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#111' }}>
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
