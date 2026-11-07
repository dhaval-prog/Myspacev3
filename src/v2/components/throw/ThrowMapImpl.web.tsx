import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN } from '../../lib/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { throwColor } from '../../theme/throwTokens';
import { useThrowColorMode } from '../../context/ThrowColorModeContext';
import { latLngAtProgress, planeOpacityForProgress, planeSizeForProgress } from '../../utils/mapProjection';
import { LocationPin } from './LocationPin';
import { PaperPlane } from './PaperPlane';
import type { ThrowMapProps } from './throwMapTypes';
import type { LatLng } from '../../utils/geo';

mapboxgl.accessToken = MAPBOX_TOKEN;
// A flat 2D style (no 3D buildings, terrain or tilt) so Throw loads fast even on mobile data —
// far fewer tiles and no 3D geometry to download. Recoloured at load for the naked look, and for
// night with plain paint changes (no style reload), see paintNaked.
const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/light-v11';

// The flying plane's size range — large right after launch, small on approach (see
// `planeSizeForProgress`).
const PLANE_MAX_SIZE = 44;
const PLANE_MIN_SIZE = 16;

// The map's own starting camera, before any contact focus/fit ever applies — picked per explicit
// user request against a live view of this exact style, not a generic whole-world fallback.
const DEFAULT_CENTER: [number, number] = [73.939097, 18.520358]; // Mapbox wants [lng, lat]
const DEFAULT_ZOOM = 15.5;
const DEFAULT_BEARING = 0;
const DEFAULT_PITCH = 0;
// The focused-contact camera (a contact, including self, selected) now matches the default camera
// exactly, per explicit user request — the view shouldn't change when a contact is selected.
const FOCUS_ZOOM = DEFAULT_ZOOM;
const FOCUS_PITCH = DEFAULT_PITCH;
const FOCUS_BEARING = DEFAULT_BEARING;
// Pixels of *bottom* padding applied to the focus camera — see `applyTarget`'s comment. With no
// padding, `center` always renders at the exact vertical middle of the viewport (confirmed
// directly via `map.project(map.getCenter())`, not assumed). Top padding would push it down (the
// wrong direction for "a little above middle") — bottom padding pushes it up instead, and unlike
// a negative top value (which mapbox-gl's own PaddingOptions validation rejects outright, an
// actual thrown error caught live during testing here), this stays a valid non-negative number.
// 100 lands it around 44% down a typical viewport.
const FOCUS_PADDING_BOTTOM = 100;

const ROUTE_SOURCE_ID = 'throw-route';
const ROUTE_LAYER_ID = 'throw-route-line';

function pointsKey(points: { latitude: number; longitude: number }[] | null | undefined): string {
  return points ? points.map((p) => `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`).join('|') : '';
}

type Target = { kind: 'fit'; points: LatLng[] } | { kind: 'focus'; point: LatLng } | null;

// Always an instant jump, never an animated pan/fly — both a `flyTo`-style animation and an
// animated `easeTo` proved unreliable here (back in the Leaflet version, same underlying bug):
// the selected contact can change twice in quick succession right after mount (self location and
// friend data from ThrowContext often resolve a render or two apart), and a second positioning
// call fired while the first's pan animation is still in flight interrupts it, leaving the
// camera stuck wherever the animation had reached — nowhere near either the old or the new
// target. An instant jump has no in-flight state to interrupt, so it's correct regardless of how
// close together these calls land.
function applyTarget(map: mapboxgl.Map, target: Target) {
  if (!target) return;
  if (target.kind === 'fit') {
    const lngs = target.points.map((p) => p.longitude);
    const lats = target.points.map((p) => p.latitude);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60, duration: 0 },
    );
  } else {
    // `padding` shifts where `center` actually ends up on screen (it renders at the middle of
    // whatever area padding *doesn't* reserve) rather than the raw viewport center — with none
    // set, the focused contact's pin rendered at dead-center, right where the ready-pose plane's
    // own peak sits (see paperPlaneEngine's READY_FRAME_LIFT), overlapping it. Reserving space
    // along the bottom pushes the pin up above that instead, per user request for "a little above
    // true center".
    map.jumpTo({
      center: [target.point.longitude, target.point.latitude],
      zoom: FOCUS_ZOOM,
      pitch: FOCUS_PITCH,
      bearing: FOCUS_BEARING,
      padding: { top: 0, bottom: FOCUS_PADDING_BOTTOM, left: 0, right: 0 },
    });
  }
}

// Naked 2D basemap: only place names stay, buildings/transit/POIs are hidden, and land, water and
// roads are recoloured for day or night. Paint-only, so flipping day/night is instant. Every step
// is best-effort: a layer this style doesn't have is simply skipped.
function paintNaked(map: mapboxgl.Map, isDay: boolean) {
  const c = isDay
    ? { land: '#F6F5F1', water: '#DCE6F0', road: '#FFFFFF', label: 'rgba(60,64,80,.55)', halo: 'rgba(255,255,255,.9)', green: 0.25 }
    : { land: '#1B2130', water: '#121826', road: '#2A3242', label: 'rgba(220,226,240,.6)', halo: 'rgba(0,0,0,.6)', green: 0.08 };
  const set = (fn: () => void) => {
    try {
      fn();
    } catch {
      // layer/property not in this style
    }
  };
  for (const l of map.getStyle()?.layers ?? []) {
    const id = l.id;
    if (l.type === 'symbol') {
      if (!/settlement|place-|country|state/.test(id)) set(() => map.setLayoutProperty(id, 'visibility', 'none'));
      else {
        set(() => map.setPaintProperty(id, 'text-color', c.label));
        set(() => map.setPaintProperty(id, 'text-halo-color', c.halo));
      }
      continue;
    }
    if (l.type === 'background') set(() => map.setPaintProperty(id, 'background-color', c.land));
    else if (l.type === 'fill' && /water/.test(id)) set(() => map.setPaintProperty(id, 'fill-color', c.water));
    else if (l.type === 'line' && /water/.test(id)) set(() => map.setPaintProperty(id, 'line-color', c.water));
    else if ((l.type === 'fill' || l.type === 'fill-extrusion') && /building/.test(id)) set(() => map.setLayoutProperty(id, 'visibility', 'none'));
    else if (l.type === 'fill' && /landuse|park|national|landcover|land-structure/.test(id)) set(() => map.setPaintProperty(id, 'fill-opacity', c.green));
    else if (l.type === 'line' && /road|bridge|tunnel/.test(id)) set(() => map.setPaintProperty(id, 'line-color', c.road));
    else if (l.type === 'line' && /admin|boundary/.test(id)) set(() => map.setPaintProperty(id, 'line-opacity', 0.3));
    else if (l.type === 'line' && /rail|transit|ferry|aerialway/.test(id)) set(() => map.setLayoutProperty(id, 'visibility', 'none'));
    else if (l.type === 'hillshade') set(() => map.setLayoutProperty(id, 'visibility', 'none'));
  }
}

// Paint changes cross-fade by default — the style ships with a
// multi-second cross-fade transition (a deliberate "time-lapse" showcase for the Standard style),
// which read as the map "not loading fast" whenever a contact switch also flips day/night.
// `Style#setTransition` (undocumented on the public `Map` type but real at runtime — Mapbox's own
// examples use exactly this to zero out the default transition) overrides that default duration
// to 0 so the flip is instant instead, without touching per-layer paint transitions elsewhere.
// Accessed via `map.style` (not on the public `mapboxgl.Map` TS surface) rather than `setStyle`,
// which would trigger a full style reload — same "don't own this internal, degrade quietly"
// defensiveness as applyLightPreset's own try/catch below.
function disableStyleTransitions(map: mapboxgl.Map) {
  (map as unknown as { style?: { setTransition?: (t: { duration: number; delay: number }) => void } }).style?.setTransition?.({
    duration: 0,
    delay: 0,
  });
}

function addOrUpdateRoute(map: mapboxgl.Map, points: LatLng[] | undefined) {
  const coords = points && points.length >= 2 ? points.map((p): [number, number] => [p.longitude, p.latitude]) : null;
  const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!coords) {
    source?.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
    return;
  }
  const data: GeoJSON.Feature<GeoJSON.LineString> = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
  if (source) {
    source.setData(data);
  } else {
    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data });
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': throwColor.clay, 'line-width': 2, 'line-opacity': 0.75, 'line-dasharray': [1, 3.5] },
    });
  }
}

/**
 * The real, interactive world map behind Throw — Mapbox GL JS over a custom Mapbox Studio style,
 * the same Throw-specific props surface as before: a handful of city-level pins plus an optional
 * animated flight route, no GPS accuracy ring or live-share semantics. Pins and the flying plane
 * stay our own React views, absolutely positioned over the map canvas by projecting lat/lng to
 * screen coordinates on every pan/zoom — same reasoning as the previous Leaflet/MapLibre versions
 * (avatar/label rendering handled ourselves rather than by the map library's own marker system).
 * 3D buildings/landmarks and the day/night palette both come from the style itself now (its
 * Mapbox Standard "basemap" import), switched live via `setConfigProperty` rather than the
 * hand-rolled per-layer paint overrides + custom fill-extrusion layer the OpenFreeMap version
 * needed — day/night follows the *viewer's own* device clock, not any contact's destination, per
 * explicit request (every map and every contact reads the same day or night at once).
 */
export function ThrowMap({ pins, focus, fitPoints, route, onMapPress }: ThrowMapProps) {
  const onMapPressRef = useRef(onMapPress);
  onMapPressRef.current = onMapPress;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [, forceRender] = useState(0);
  // Mapbox GL JS is a large library, and this style renders real 3D buildings/terrain at a steep
  // pitch — both take a visible moment to download/initialize/settle on first load. Rather than a
  // blank map-shaped hole (or an abrupt pop once tiles suddenly appear), the container starts
  // transparent and fades in only once the map is genuinely idle (style loaded, camera settled, no
  // tiles still in flight) — ThrowHomeScreen's own ThrowGlassBackdrop already sits behind this
  // whole screen, so what shows through during that gap is the same branded gradient the rest of
  // Throw already uses, not an empty void. Costs nothing extra to ship (no placeholder image/
  // component of its own) and never looks "wrong", just briefly quiet.
  const [ready, setReady] = useState(false);

  // The map's own day/night/auto preference (see ThrowColorModeContext) — independent of the
  // letter's own paper/plane color preference, and (per explicit request) user-controllable in
  // Settings the same way. 'auto' falls back to the viewer's own device clock, not any contact's
  // destination, so every map and every contact reads the same day or night at once.
  const { mapIsDay: isDay } = useThrowColorMode();
  const isDayRef = useRef(isDay);
  isDayRef.current = isDay;

  // Always holds whatever `focus`/`fitPoints` currently resolve to — mutated directly during
  // render (not in an effect) so it's never stale by the time a map event callback reads it.
  const targetRef = useRef<Target>(null);
  targetRef.current = fitPoints && fitPoints.length > 0 ? { kind: 'fit', points: fitPoints } : focus ? { kind: 'focus', point: focus } : null;

  const routePointsRef = useRef<LatLng[] | undefined>(undefined);
  routePointsRef.current = route?.points;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      bearing: DEFAULT_BEARING,
      pitch: DEFAULT_PITCH,
      // Flat map: no tilt or rotation, plain Mercator, no fade-in of tiles.
      maxPitch: 0,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
      projection: 'mercator',
      fadeDuration: 0,
      // A plain boolean here (unlike MapLibre's `{compact: true}` object) — the compact behavior
      // is a separate AttributionControl added manually right below instead.
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    const rerender = () => forceRender((n) => n + 1);
    map.on('move', rerender);
    map.on('zoom', rerender);
    // Mapbox only fires 'click' for a tap, never for the end of a drag.
    map.on('click', () => onMapPressRef.current?.());
    // Fires once the style is loaded, the camera has settled, and every tile currently in view has
    // arrived — the first point at which showing the real map actually looks finished rather than
    // half-populated. `.once` — this only ever gates the initial reveal, not every later idle
    // moment (panning/zooming afterward stays exactly as responsive as before).
    //
    // 'idle' can take a genuinely long time on a slow connection/device (steep-pitch 3D buildings
    // are a lot of tiles), during which the screen behind this map is just ThrowGlassBackdrop's
    // own soft gradient blobs sitting there with nothing happening — a hard cap means that backdrop
    // is never shown for longer than this, even in the worst case; 'idle' still wins (and looks
    // fully finished) whenever it beats the clock, which is the common case.
    const readyFallback = setTimeout(() => setReady(true), 2200);
    map.once('idle', () => {
      clearTimeout(readyFallback);
      setReady(true);
    });
    map.on('style.load', () => {
      // Defensive, not just tidy: this runs against a style this app doesn't own (edited in
      // Mapbox Studio), so a future rename/removal of the "basemap" import should degrade to
      // "whatever the style's own saved default is" rather than take the whole map down.
      try {
        disableStyleTransitions(map);
        paintNaked(map, isDayRef.current);
        addOrUpdateRoute(map, routePointsRef.current);
      } catch (e) {
        console.error('[ThrowMap] failed to apply light preset/route after style load:', e);
      }
      rerender();
    });
    mapRef.current = map;

    // Unlike Live Locations' MapCanvas (a full-screen absoluteFill, already correctly sized the
    // instant its container mounts), this map sits several `flex: 1` levels deep inside
    // ThrowHomeScreen/ThrowFlightScreen — React Native Web's flex layout can still be settling
    // the container's real pixel size well after this effect runs (and after the *first* resize
    // notification too — the container's size can change more than once before it truly
    // settles), so any positioning call issued too early converges on a geographically wrong
    // center that never self-corrects afterward on its own (only the tile viewport does, via
    // `resize()` — not wherever an earlier positioning call already decided to land). Rather than
    // guess which resize event is "the last one", every one of them re-applies whatever the
    // current target is — cheap, and idempotent once the size (and therefore the projected
    // target position) stops changing.
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.resize();
        applyTarget(map, targetRef.current);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(readyFallback);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-position whenever the selected contact (or the flight endpoints) actually changes.
  const fitKey = pointsKey(fitPoints);
  const focusKey = focus ? `${focus.latitude.toFixed(3)},${focus.longitude.toFixed(3)}` : '';
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyTarget(map, targetRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, fitKey]);

  useEffect(() => {
    const map = mapRef.current;
    // Not ready yet on the very first run (the style is still loading asynchronously) — that
    // initial application happens via `style.load` in the mount effect above instead; this only
    // needs to handle isDay flipping *after* the style has already loaded.
    if (!map || !map.isStyleLoaded()) return;
    paintNaked(map, isDay);
  }, [isDay]);

  // The route line is a real Mapbox GeoJSON line layer (correct at every zoom without extra
  // math) — only the flying plane glyph itself needs to be a projected DOM overlay, same
  // reasoning as pins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addOrUpdateRoute(map, route?.points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.points]);

  const project = (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return null;
    const point = map.project([lng, lat]);
    return { x: point.x, y: point.y };
  };

  const planePos = useMemo(() => (route ? latLngAtProgress(route.points, route.progress) : null), [route]);
  const planeScreen = route?.showPlane && planePos ? project(planePos.position.latitude, planePos.position.longitude) : null;
  const planeSize = route ? planeSizeForProgress(route.progress, PLANE_MAX_SIZE, PLANE_MIN_SIZE) : PLANE_MIN_SIZE;
  const planeOpacity = route ? planeOpacityForProgress(route.progress) : 1;

  return (
    <View style={StyleSheet.absoluteFill}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, opacity: ready ? 1 : 0, transition: 'opacity 320ms ease-out' }} />

      {pins.map((pin) => {
        const pos = project(pin.latitude, pin.longitude);
        if (!pos) return null;
        return (
          <LocationPin
            key={pin.id}
            x={pos.x}
            y={pos.y}
            label={pin.label}
            userId={pin.id}
            avatarUrl={pin.avatarUrl}
            fullName={pin.fullName}
            bounceKey={pin.bounceKey}
            isSelf={pin.isSelf}
            selected={pin.selected}
            dimmed={pin.dimmed}
            onPress={pin.onPress}
            isNight={!isDay}
          />
        );
      })}

      {planeScreen && planePos && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: planeScreen.x - planeSize / 2,
            top: planeScreen.y - planeSize / 2,
            opacity: planeOpacity,
            transform: [{ rotate: `${planePos.bearingDeg}deg` }],
          }}
        >
          <PaperPlane size={planeSize} color={throwColor.clayDeep} />
        </View>
      )}
    </View>
  );
}
