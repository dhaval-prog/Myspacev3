import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useAvatarColor } from '@/state/avatarColors';
import { initialsOf, SWATCHES } from '@/state/store';
import { C, F } from '@/theme/tokens';
import { T } from './primitives';

/** Sticker palette for people without a photo — picked stably from their id. */
export const PERSON_COLORS = [C.lime, C.ice, C.coral, C.sun, C.sky, C.bubblegum, C.mint];
export const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PERSON_COLORS[h % PERSON_COLORS.length];
};

type Props = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  size: number;
  font?: number;
  ink?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
};

/** Round avatar: the person's photo, or their initials on a sticker colour. */
export function Person({ id, name, avatarUrl, size, font, ink, bg, style }: Props) {
  // Their chosen sticker colour (Pick your look) wins; otherwise a stable generated one.
  const chosen = useAvatarColor(bg ? null : id);
  const swatch = chosen != null ? SWATCHES[chosen % SWATCHES.length] : null;
  const fill = bg ?? swatch?.[0] ?? colorFor(id);
  const text = swatch && !bg ? swatch[1] : (ink ?? C.deep);
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: fill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <T f={F.b7} s={font ?? Math.round(size / 3)} c={text}>
          {initialsOf(name)}
        </T>
      )}
    </View>
  );
}
