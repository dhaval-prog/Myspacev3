import { Image } from 'expo-image';
import { View } from 'react-native';

import { initialsOf, SWATCHES, useStore } from '@/state/store';
import { F } from '@/theme/tokens';
import { T } from './primitives';

/** Round sticker avatar (photo or initials). Shared with the pass screen. */
export function AvatarFace({ size, ring, font }: { size: number; ring: number; font: number }) {
  const s = useStore();
  const [bg, fg] = SWATCHES[s.av];
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        borderRadius: size / 2,
        borderWidth: ring,
        borderColor: bg,
        backgroundColor: bg,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {s.photo ? (
        <Image source={{ uri: s.photo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <T f={F.d8} s={font} c={fg}>
          {initialsOf(s.name || 'Friend')}
        </T>
      )}
    </View>
  );
}
