import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import { leafletBoundsToBounds } from '../lib/viewportApi'

// ================================================================
// ZOOM ↔ VIEWPORT-SIZE CONSTRAINT
//
// The user asked to remove the manual radius picker and instead
// always analyze "whatever is visible on screen", constrained to
// roughly a 40-50 km-wide working resolution (matching the old
// default 50 km radius scan). Exact km-per-screen depends on
// window width + latitude, so instead of faking precision we:
//   1) constrain Leaflet's zoom range so the *typical* viewport on
//      a normal desktop/tablet window lands in that ~40-50 km band
//      at the default zoom, and
//   2) let the backend clamp the analyzed bbox defensively
//      (MIN/MAX viewport km) regardless of window size — see
//      gee_processor.MIN_VIEWPORT_KM / MAX_VIEWPORT_KM.
// ================================================================

export const DEFAULT_ZOOM = 11
export const MIN_ZOOM = 9
export const MAX_ZOOM = 15
export const DEFAULT_CENTER = [16.5062, 80.648] // Vijayawada

const DEBOUNCE_MS = 900

// ================================================================
// VIEWPORT WATCHER
//
// Fires onSettled(bounds) once the map stops moving for
// DEBOUNCE_MS. Also fires once on first mount so the very first
// view auto-analyzes without requiring the user to touch the map.
// ================================================================

// NOTE ON AUTO-ANALYSIS: only the *first* view (on mount) auto-analyzes.
// After that, panning/zooming the map is "free" — it does not fire any
// backend request, so the left-panel "currently analyzed" numbers stay
// exactly as they were until the user explicitly clicks
// "Analyze this view". This was previously debounced-but-automatic on
// every moveend/zoomend, which meant idle scrolling kept re-triggering
// expensive Earth Engine calls. `onTrack` still fires (cheap, local
// only) so the manual re-analyze button always knows the latest bounds.
function ViewportWatcher({ onSettled, onTrack, enabled }) {
  const map = useMap()
  const timerRef = useRef(null)
  const firedInitial = useRef(false)

  useEffect(() => {
    if (firedInitial.current) return
    firedInitial.current = true
    onSettled(leafletBoundsToBounds(map.getBounds()), map.getZoom())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMapEvents({
    moveend() {
      onTrack?.(leafletBoundsToBounds(map.getBounds()), map.getZoom())
      if (!enabled) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onSettled(leafletBoundsToBounds(map.getBounds()), map.getZoom())
      }, DEBOUNCE_MS)
    },
    zoomend() {
      onTrack?.(leafletBoundsToBounds(map.getBounds()), map.getZoom())
      if (!enabled) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onSettled(leafletBoundsToBounds(map.getBounds()), map.getZoom())
      }, DEBOUNCE_MS)
    },
  })

  return null
}

// ================================================================
// LAYER TOGGLE PILL BAR (white theme)
// ================================================================

const LAYER_OPTIONS = [
  { key: 'satellite', label: 'Satellite RGB', color: '#0ea5e9' },
  { key: 'fcc', label: 'False Colour', color: '#f97316' },
  { key: 'ndwi', label: 'NDWI', color: '#2563eb' },
  { key: 'mndwi', label: 'MNDWI', color: '#0891b2' },
  { key: 'ndbi', label: 'NDBI', color: '#b45309' },
  { key: 'water_mask', label: 'Water Mask', color: '#06b6d4' },
  { key: 'boundaries', label: 'Boundaries', color: '#e11d48' },
]

function LayerControls({ layers, toggleLayer, compact, hidden }) {
  if (hidden) return null
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1000,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        maxWidth: compact ? 220 : 420,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 8,
        boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {LAYER_OPTIONS.map((opt) => {
        const active = !!layers[opt.key]
        return (
          <button
            key={opt.key}
            onClick={() => toggleLayer(opt.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${active ? opt.color : '#e2e8f0'}`,
              background: active ? `${opt.color}14` : '#ffffff',
              color: active ? opt.color : '#94a3b8',
              transition: 'all 150ms ease',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: opt.color, opacity: active ? 1 : 0.35 }} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ================================================================
// MAIN VIEWPORT MAP
// ================================================================

export default function ViewportMap({
  geojson,
  tileUrls,
  bbox,
  loading,
  analyzing,
  layers,
  toggleLayer,
  onViewportSettled,
  onBoundsTrack,
  autoAnalyze,
  compactControls,
  hideFloatingControls,
  heightPx, // optional fixed height (dashboard embeds it below the fold)
}) {
  const [zoomTooFar, setZoomTooFar] = useState(false)

  return (
    <div
      style={{
        width: '100%',
        height: heightPx ? `${heightPx}px` : '100%',
        position: 'relative',
        background: '#eef2f6',
      }}
    >
      <LayerControls layers={layers} toggleLayer={toggleLayer} compact={compactControls} hidden={hideFloatingControls} />

      {/* Auto-analysis status pill (top-right) */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 11px',
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #e2e8f0',
          color: analyzing ? '#0e7490' : '#64748b',
          boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: analyzing ? '#0e7490' : '#94a3b8',
            animation: analyzing ? 'hd-pulse 1s infinite' : 'none',
          }}
        />
        {analyzing ? 'Analyzing viewport…' : 'Pan/zoom freely — click "Analyze this view" to update'}
      </div>

      {zoomTooFar && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '7px 14px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 600,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #fde68a',
            color: '#92400e',
          }}
        >
          Zoomed further than the working resolution — analysis stays clamped to a ~{MAX_ZOOM > 12 ? '40–50' : '40'} km scene.
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri"
          maxZoom={18}
          maxNativeZoom={18}
        />

        {tileUrls?.satellite && layers?.satellite && (
          <TileLayer key={`sat-${bbox?.join('-')}`} url={tileUrls.satellite} opacity={1} zIndex={2} />
        )}
        {tileUrls?.fcc && layers?.fcc && (
          <TileLayer key={`fcc-${bbox?.join('-')}`} url={tileUrls.fcc} opacity={0.9} zIndex={3} />
        )}
        {tileUrls?.ndwi && layers?.ndwi && (
          <TileLayer key={`ndwi-${bbox?.join('-')}`} url={tileUrls.ndwi} opacity={0.85} zIndex={4} />
        )}
        {tileUrls?.mndwi && layers?.mndwi && (
          <TileLayer key={`mndwi-${bbox?.join('-')}`} url={tileUrls.mndwi} opacity={0.85} zIndex={4} />
        )}
        {tileUrls?.ndbi && layers?.ndbi && (
          <TileLayer key={`ndbi-${bbox?.join('-')}`} url={tileUrls.ndbi} opacity={0.75} zIndex={4} />
        )}
        {tileUrls?.water_mask && layers?.water_mask && (
          <TileLayer key={`mask-${bbox?.join('-')}`} url={tileUrls.water_mask} opacity={0.85} zIndex={5} />
        )}

        {geojson && layers?.boundaries && Array.isArray(geojson?.features) && geojson.features.length > 0 && (
          <GeoJSON
            key={`bounds-${bbox?.join('-')}-${geojson.features.length}`}
            data={geojson}
            style={() => ({
              color: '#e11d48',
              weight: 1.8,
              opacity: 0.95,
              fillColor: '#e11d48',
              fillOpacity: 0.12,
            })}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {}
              layer.bindPopup(
                `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:#0f172a;">
                   <div style="color:#0e7490;font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">
                     ${p.water_body_name || 'Water Body'}
                   </div>
                   <div style="font-weight:700;font-size:14px;margin-bottom:2px;">
                     ${(Number(p.area_km2) || 0).toFixed(4)} km²
                   </div>
                   <div style="color:#64748b;font-size:11px;">
                     ${Math.round(p.area_m2 || 0).toLocaleString()} m²
                   </div>
                 </div>`
              )
              layer.on({
                mouseover: (e) => e.target.setStyle({ fillOpacity: 0.3, weight: 2.4 }),
                mouseout: (e) => e.target.setStyle({ fillOpacity: 0.12, weight: 1.8 }),
              })
            }}
          />
        )}

        <ViewportWatcher
          enabled={autoAnalyze}
          onTrack={(bounds, zoom) => {
            setZoomTooFar(zoom <= MIN_ZOOM || zoom >= MAX_ZOOM)
            onBoundsTrack?.(bounds, zoom)
          }}
          onSettled={(bounds, zoom) => {
            setZoomTooFar(zoom <= MIN_ZOOM || zoom >= MAX_ZOOM)
            onViewportSettled?.(bounds, zoom)
          }}
        />
      </MapContainer>

      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: hideFloatingControls ? 12 : 12,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#0e7490',
            color: '#ffffff',
            boxShadow: '0 8px 22px rgba(14,116,144,0.35)',
            animation: 'hd-slidein 220ms ease',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: 14, height: 14, borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: '#ffffff',
              animation: 'hd-spin 700ms linear infinite',
            }}
          />
          New viewport detected — analyzing…
        </div>
      )}

      <style>{`
        @keyframes hd-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
        @keyframes hd-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hd-slidein {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .leaflet-control-zoom a {
          background: #ffffff !important;
          color: #334155 !important;
          border-color: #e2e8f0 !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
