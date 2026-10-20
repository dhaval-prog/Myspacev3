import { Image } from 'expo-image';
import { View } from 'react-native';

import { initialsOf, SWATCHES, useStore } from '@/state/store';
import { F } from '@/theme/tokens';
import { T } from './primitives';

type Props = {
  size: number;
  ring: number;
  font: number;
  /** Overrides (signed-in profile). Default to the onboarding draft. */
  name?: string;
  color?: number;
  photo?: string | null;
};

/** Round sticker avatar (photo or initials) on the user's chosen colour. */
export function AvatarFace({ size, ring, font, name, color, photo }: Props) {
  const s = useStore();
  const [bg, fg] = SWATCHES[(color ?? s.av) % SWATCHES.length];
  const uri = photo !== undefined ? photo : s.photo;
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
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <T f={F.d8} s={font} c={fg}>
          {initialsOf(name ?? (s.name || 'Friend'))}
        </T>
      )}
    </View>
  );
}
