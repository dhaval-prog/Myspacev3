// v3: every v2 screen's nav dock now renders the shared sticker NavDock, so the bottom menu bar
// looks and animates the same on all tabs. Props are unchanged so v2 call sites keep working.
import React from 'react';

import { NavDock, type TabId } from '@/ui/NavDock';

interface BottomNavProps {
  activeId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  /** Overrides the right-hand circle's icon/label — e.g. Chats, Back, or Add-a-friend on the Friends flow instead of the default "+". */
  fabIconPath?: string;
  fabAccessibilityLabel?: string;
  bottomInset: number;
  reduceMotion?: boolean;
}

// v2 calls Pocket "expenses".
const toTab = (id: string): TabId | null =>
  id === 'expenses' ? 'pocket' : (['chat', 'throw', 'map', 'games', 'pocket'] as string[]).includes(id) ? (id as TabId) : null;

export function BottomNav({ activeId, onSelect, onAdd, fabIconPath, fabAccessibilityLabel }: BottomNavProps) {
  return (
    <NavDock
      floating={false}
      active={toTab(activeId)}
      onSelect={(id) => onSelect(id === 'pocket' ? 'expenses' : id)}
      onAdd={onAdd}
      fabIcon={fabIconPath}
      fabLabel={fabAccessibilityLabel ?? 'Add'}
    />
  );
}
