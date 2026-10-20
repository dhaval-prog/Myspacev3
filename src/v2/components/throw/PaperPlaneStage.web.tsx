// Loads three.js (~1.3 MB) on demand so it stays out of the app's startup download. The download
// starts when this module is first imported (i.e. when a Throw screen loads), well before a letter
// is folded. Commands sent before the stage has loaded are queued and replayed once it mounts.
import React, { forwardRef, lazy, Suspense, useCallback, useImperativeHandle, useRef } from 'react';
import type { PaperPlaneStageHandle, PaperPlaneStageProps } from './paperPlaneTypes';

const pending = import('./PaperPlaneStageImpl.web').then((m) => ({ default: m.PaperPlaneStage }));
const Impl = lazy(() => pending);

type Call = { [K in keyof PaperPlaneStageHandle]: [K, Parameters<PaperPlaneStageHandle[K]>] }[keyof PaperPlaneStageHandle];
const METHODS: (keyof PaperPlaneStageHandle)[] = ['fold', 'fly', 'reset', 'holdReady', 'setReadyBank', 'seek', 'setOptions', 'setContent'];

export const PaperPlaneStage = forwardRef<PaperPlaneStageHandle, PaperPlaneStageProps>(function PaperPlaneStage(props, ref) {
  const inner = useRef<PaperPlaneStageHandle | null>(null);
  const queue = useRef<Call[]>([]);

  useImperativeHandle(ref, () => {
    const handle = {} as Record<string, (...args: unknown[]) => void>;
    for (const name of METHODS) {
      handle[name] = (...args: unknown[]) => {
        const target = inner.current as unknown as Record<string, (...a: unknown[]) => void> | null;
        if (target) target[name](...args);
        else queue.current.push([name, args] as unknown as Call);
      };
    }
    return handle as unknown as PaperPlaneStageHandle;
  }, []);

  const attach = useCallback((h: PaperPlaneStageHandle | null) => {
    inner.current = h;
    if (!h) return;
    const calls = queue.current;
    queue.current = [];
    for (const [name, args] of calls) (h[name] as (...a: unknown[]) => void)(...args);
  }, []);

  return (
    <Suspense fallback={null}>
      <Impl {...props} ref={attach} />
    </Suspense>
  );
});
