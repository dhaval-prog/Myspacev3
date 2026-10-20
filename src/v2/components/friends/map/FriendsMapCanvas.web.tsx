// Loads Mapbox GL (~2 MB) only when a map is first shown, so it stays out of the app's startup download.
import React, { lazy, Suspense } from 'react';
import type { FriendsMapCanvasProps } from './friendsMapCanvasTypes';

const load = () => import('../../mapsImpl.web').then((m) => ({ default: m.FriendsMapCanvas }));
const Impl = lazy(load);

export function FriendsMapCanvas(props: FriendsMapCanvasProps) {
  return (
    <Suspense fallback={null}>
      <Impl {...props} />
    </Suspense>
  );
}
