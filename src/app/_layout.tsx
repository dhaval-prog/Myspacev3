import { BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Caveat_500Medium, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  Figtree_400Regular,
  Figtree_400Regular_Italic,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from '@/state/store';
import { C } from '@/theme/tokens';
import { WebFrame } from '@/ui/primitives';

SplashScreen.preventAutoHideAsync().catch(() => {});

const TAB_ROUTES = ['chat', 'throw', 'map', 'games/index', 'pocket/index'];

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
    Figtree_400Regular,
    Figtree_400Regular_Italic,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    DMMono_400Regular,
    DMMono_500Medium,
    Caveat_500Medium,
    Caveat_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.paper }}>
      <SafeAreaProvider>
        <StoreProvider>
          <WebFrame>
            <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: C.paper } }}>
              {TAB_ROUTES.map((name) => (
                <Stack.Screen key={name} name={name} options={{ animation: 'none' }} />
              ))}
              <Stack.Screen name="games/npat" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="games/trivia" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="pocket/[id]" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </WebFrame>
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
