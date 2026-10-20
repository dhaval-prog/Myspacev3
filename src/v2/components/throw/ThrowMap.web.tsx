// Loads Mapbox GL (~2 MB) only when the Throw map is first shown, so it stays out of the app's startup download.
import React, { lazy, Suspense } from 'react';
import type { ThrowMapProps } from './throwMapTypes';

const Impl = lazy(() => import('../mapsImpl.web').then((m) => ({ default: m.ThrowMap })));

export function ThrowMap(props: ThrowMapProps) {
  return (
    <Suspense fallback={null}>
      <Impl {...props} />
    </Suspense>
  );
}
