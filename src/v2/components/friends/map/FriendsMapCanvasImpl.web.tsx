import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../../../lib/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FriendsMapCanvasProps } from './friendsMapCanvasTypes';

mapboxgl.accessToken = MAPBOX_TOKEN;
// The "naked" map: Mapbox's light style with shop icons, street names, transit and other labels
// stripped at load (only cities and neighbourhoods stay), recoloured to off-white land, white
// roads and soft blue water — so people's faces are the only thing that stands out.
const MAPBOX_STYLE_URL = process.env.EXPO_PUBLIC_MAPBOX_FRIENDS_MAP_STYLE_URL ?? 'mapbox://styles/mapbox/light-v11';

/** Strips and recolours the loaded style (see MAPBOX_STYLE_URL). Every step is best-effort: a
 * custom style without these layers is simply left alone. */
function makeNaked(map: mapboxgl.Map) {
  const layers = map.getStyle()?.layers ?? [];
  const set = (fn: () => void) => {
    try {
      fn();
    } catch {
      // layer/property not in this style
    }
  };
  for (const l of layers) {
    const id = l.id;
    if (l.type === 'symbol') {
      // Keep only place names (cities, towns, neighbourhoods).
      if (!/settlement|place-|country|state/.test(id)) set(() => map.setLayoutProperty(id, 'visibility', 'none'));
      else set(() => map.setPaintProperty(id, 'text-color', 'rgba(60,64,80,.55)'));
      continue;
    }
    if (l.type === 'background') set(() => map.setPaintProperty(id, 'background-color', '#F6F5F1'));
    else if (l.type === 'fill' && /water/.test(id)) set(() => map.setPaintProperty(id, 'fill-color', '#DCE6F0'));
    else if (l.type === 'fill' && /building/.test(id)) set(() => map.setLayoutProperty(id, 'visibility', 'none'));
    else if (l.type === 'fill' && /landuse|park|national|landcover/.test(id)) set(() => map.setPaintProperty(id, 'fill-opacity', 0.25));
    else if (l.type === 'line' && /road|bridge|tunnel/.test(id)) set(() => map.setPaintProperty(id, 'line-color', '#FFFFFF'));
    else if (l.type === 'line' && /admin|boundary/.test(id)) set(() => map.setPaintProperty(id, 'line-opacity', 0.35));
    else if (l.type === 'line' && /rail|transit|ferry|aerialway/.test(id)) set(() => map.setLayoutProperty(id, 'visibility', 'none'));
  }
}

// Design handoff's own starting camera — zoom 4 (256px-tile convention) centered on India.
const DEFAULT_CENTER: [number, number] = [79.5, 21.5]; // Mapbox wants [lng, lat]
const DEFAULT_ZOOM_256 = 4;

// Mapbox's own tiles are 512px, one convention "more zoomed in" per step than the 256px-tile
// convention friendsMapMath.ts uses (OSM/the design handoff's own tile math) — the same world
// pixel width needs one fewer Mapbox zoom step, so converting one way subtracts 1 and the other
// way adds 1. This is the one place that conversion happens; everything else in this feature
// (clustering, fit, focus) stays in the 256px convention.
const toMapboxZoom = (z256: number) => z256 - 1;
const toZoom256 = (mapboxZoom: number) => mapboxZoom + 1;

function pointsKey(points: { latitude: number; longitude: number }[]): string {
  return points.map((p) => `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`).join('|');
}

/**
 * The Friends Map's real, draggable/zoomable world map — Mapbox GL JS, gestures left on (unlike
 * ThrowMap this is a flat 2D map, so rotate/pitch are disabled rather than driven). Pins are our
 * own absolutely-positioned views (not Mapbox markers), projected via `map.project()` and
 * re-positioned on every 'move'/'zoom' — same proven pattern as `ThrowMap.web.tsx`. Unlike
 * ThrowMap, this canvas also *reports* its camera back out via `onCameraChange` (clustering and
 * the sheet/controls layout both need to know the live zoom/center, not just render pins at it).
 */
export function FriendsMapCanvas({ me, pins, renderPin, renderMe, cameraCommand, onCameraChange, onMapPress }: FriendsMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onCameraChangeRef = useRef(onCameraChange);
  onCameraChangeRef.current = onCameraChange;
  const onMapPressRef = useRef(onMapPress);
  onMapPressRef.current = onMapPress;
  const [, forceRender] = useState(0);
  const [ready, setReady] = useState(false);
  const lastCommandTokenRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: toMapboxZoom(DEFAULT_ZOOM_256),
      attributionControl: false,
      dragRotate: false,
      touchPitch: false,
      pitchWithRotate: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    map.touchZoomRotate.disableRotation();

    const report = () => {
      const c = map.getCenter();
      onCameraChangeRef.current({ zoom: toZoom256(map.getZoom()), center: { latitude: c.lat, longitude: c.lng } });
    };
    const rerender = () => {
      forceRender((n) => n + 1);
      report();
    };
    map.on('move', rerender);
    map.on('zoom', rerender);
    map.once('idle', () => setReady(true));
    map.on('load', rerender);
    map.on('style.load', () => makeNaked(map));
    // Mapbox only fires 'click' for a tap, never for the end of a drag.
    map.on('click', () => onMapPressRef.current?.());
    mapRef.current = map;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.resize();
        rerender();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Applies an imperative jump/fit whenever `cameraCommand.token` actually changes — never a
  // re-apply of the same command, and never animated (an in-flight animated pan interrupted by a
  // second command right behind it is the same bug ThrowMap's own `applyTarget` comment
  // documents; an instant jump sidesteps it here too).
  const fitKey = cameraCommand?.kind === 'fit' ? pointsKey(cameraCommand.points) : '';
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cameraCommand || cameraCommand.token === lastCommandTokenRef.current) return;
    lastCommandTokenRef.current = cameraCommand.token;
    if (cameraCommand.kind === 'jump') {
      const to = { center: [cameraCommand.center.longitude, cameraCommand.center.latitude] as [number, number], zoom: toMapboxZoom(cameraCommand.zoom) };
      if (cameraCommand.animate) map.easeTo({ ...to, duration: 650 });
      else map.jumpTo(to);
    } else {
      const lngs = cameraCommand.points.map((p) => p.longitude);
      const lats = cameraCommand.points.map((p) => p.latitude);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60, duration: 0 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraCommand?.token, cameraCommand?.kind, fitKey]);

  const project = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return null;
    const p = map.project([lng, lat]);
    return { x: p.x, y: p.y };
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: ready ? 1 : 0,
          transition: 'opacity 240ms ease-out',
        }}
      />
      {me &&
        (() => {
          const pos = project(me.latitude, me.longitude);
          if (!pos) return null;
          return (
            <View pointerEvents="box-none" style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: 1 }}>
              {renderMe ? renderMe() : null}
            </View>
          );
        })()}

      {pins.map((pin) => {
        const pos = project(pin.latitude, pin.longitude);
        if (!pos) return null;
        return (
          <View key={pin.id} style={{ position: 'absolute', left: pos.x, top: pos.y, zIndex: pin.zIndex }}>
            {renderPin(pin)}
          </View>
        );
      })}
    </View>
  );
}
