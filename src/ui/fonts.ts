// Native: app fonts are bundled TTFs loaded through expo-font. The app waits for the ones the first
// screens use; the rest (Games, Throw only) load in the background.
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
import { useEffect } from 'react';

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

/** True once the first screens' fonts are ready (or failed — then system fonts are used). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(FIRST_FONTS);
  const ready = loaded || !!error;
  useEffect(() => {
    if (ready) loadAsync(LATER_FONTS).catch(() => {});
  }, [ready]);
  return ready;
}
