// The five main sections (Chat, Throw, Map, Games, Pocket) as tabs: each stays loaded after its
// first visit (paused while hidden), so switching is instant instead of rebuilding the page. Each screen draws its own
// bottom bar (NavDock), so the navigator's tab bar is hidden.
import { router, Tabs, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { C } from '@/theme/tokens';

const TABS = ['chat', 'throw', 'map', 'games', 'pocket'] as const;

export default function TabsLayout() {
  // Quietly load tabs not opened yet, one at a time, whenever the person has stayed put for a few
  // seconds — so first visits are quick too, without competing with what they're doing now.
  const pathname = usePathname();
  const loaded = useRef(new Set<string>());
  useEffect(() => {
    loaded.current.add(pathname.split('/')[1] ?? '');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const next = () => {
      const tab = TABS.find((t) => !loaded.current.has(t));
      if (!tab) return;
      timer = setTimeout(() => {
        loaded.current.add(tab);
        router.prefetch(`/${tab}`);
        next();
      }, 3000);
    };
    next();
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <Tabs tabBar={() => null} backBehavior="history" screenOptions={{ headerShown: false, freezeOnBlur: true, sceneStyle: { backgroundColor: C.paper } }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t} name={t} />
      ))}
    </Tabs>
  );
}
