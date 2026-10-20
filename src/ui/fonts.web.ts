// Web: fonts are declared with @font-face in public/index.html (small WOFF2 files, the first
// screen's ones preloaded alongside the app code). The app waits briefly for those so the first
// screen doesn't flash in a system font, but never more than 2.5 s.
import { useEffect, useState } from 'react';

const FIRST = [
  'BricolageGrotesque_700Bold',
  'BricolageGrotesque_800ExtraBold',
  'SpaceMono_400Regular',
  'SpaceMono_700Bold',
  'Figtree_400Regular',
  'Figtree_500Medium',
  'Figtree_600SemiBold',
  'Figtree_700Bold',
  'Figtree_800ExtraBold',
  'DMMono_400Regular',
  'DMMono_500Medium',
  'Caveat_700Bold',
];

let ready = typeof document === 'undefined' || !document.fonts;
const waiting: Promise<void> = ready
  ? Promise.resolve()
  : Promise.race([
      Promise.all(FIRST.map((f) => document.fonts.load(`16px "${f}"`).catch(() => []))).then(() => undefined),
      new Promise<void>((r) => setTimeout(r, 2500)),
    ]).then(() => {
      ready = true;
    });

export function useAppFonts(): boolean {
  const [done, setDone] = useState(ready);
  useEffect(() => {
    if (done) return;
    let live = true;
    waiting.then(() => live && setDone(true));
    return () => {
      live = false;
    };
  }, [done]);
  return done;
}
