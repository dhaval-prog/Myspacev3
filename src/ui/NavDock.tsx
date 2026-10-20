// The one bottom menu bar used on every tab (v3 screens and the v2 screens: Throw, games, wallet…):
// dark pill with the five tabs + a round action button. Active tab = tilted lime sticker.
// Same look and the same slide-up entrance everywhere.
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { anim, E, skPopR, skUp } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { A, Icon, ICON, Press, T } from './primitives';

export type TabId = 'chat' | 'throw' | 'map' | 'games' | 'pocket';

export const NAV: [TabId, string, string][] = [
  ['chat', ICON.chat, 'Chat'],
  ['throw', ICON.throw, 'Throw'],
  ['map', ICON.map, 'Map'],
  ['games', ICON.games, 'Games'],
  ['pocket', ICON.pocket, 'Pocket'],
];

const I = C.deep;
const BAR = 'rgba(17,17,17,.92)';
const INACTIVE = 'rgba(255,255,255,.45)';

type Props = {
  active: TabId | null;
  onSelect: (id: TabId) => void;
  onAdd?: () => void;
  /** Overrides the round button's icon (e.g. Back on some v2 screens). */
  fabIcon?: string;
  fabLabel?: string;
  /** Pin to the bottom of the screen (v3 screens) or sit in the layout flow (v2 screens). */
  floating?: boolean;
};

export function NavDock({ active, onSelect, onAdd, fabIcon, fabLabel, floating = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <A
      style={[
        {
          paddingTop: 10,
          paddingHorizontal: 10,
          paddingBottom: Math.max(24, insets.bottom),
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          zIndex: 5,
        },
        floating ? { position: 'absolute', left: 0, right: 0, bottom: 0 } : null,
        anim(skUp(), 0.5, 0.35, E.out),
      ]}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: BAR, borderRadius: 999, padding: 6 }}>
        {NAV.map(([id, icon, label]) => {
          const on = id === active;
          const c = on ? I : INACTIVE;
          return (
            <Press
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={label}
              onPress={() => {
                if (!on) onSelect(id);
              }}
              pressed={on ? undefined : { opacity: 0.7 }}
              style={{ flex: 1, minHeight: 48 }}>
              <A
                style={[
                  {
                    flex: 1,
                    minHeight: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    borderRadius: 999,
                    backgroundColor: on ? C.lime : 'transparent',
                    borderWidth: 1.5,
                    borderColor: on ? I : 'transparent',
                  },
                  on ? anim(skPopR(-3), 0.35, 0.45, E.s15) : null,
                ]}>
                <Icon d={icon} size={20} color={c} sw={on ? 2 : 1.7} />
                <T f={on ? F.b7 : F.b5} s={10.5} c={c}>
                  {label}
                </T>
              </A>
            </Press>
          );
        })}
      </View>
      <Press
        accessibilityLabel={fabLabel ?? 'Add a friend'}
        onPress={onAdd}
        pressed={{ transform: [{ scale: 0.94 }] }}
        style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: BAR, alignItems: 'center', justifyContent: 'center' }}>
        <Icon d={fabIcon ?? ICON.plusSm} size={24} color={C.lime} sw={2.2} />
      </Press>
    </A>
  );
}
