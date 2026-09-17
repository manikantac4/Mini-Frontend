import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'

// ================================================================
// GEOJSON MAP VIEW
//
// A small, self-contained map dedicated to *just* showing the
// current analysis's GeoJSON boundaries (water_type-colored: rivers
// vs lakes/ponds) on a plain satellite basemap, fit to the feature
// bounds. Separate from the big interactive results map below it —
// this one is purely for inspecting the detected geometry.
// ================================================================

function FitToGeojson({ geojson }) {
  const map = useMap()

  useEffect(() => {
    if (!geojson?.features?.length) return
    try {
      const layer = L.geoJSON(geojson)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 })
      }
    } catch {
      /* ignore — leave default view */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson])

  return null
}

export default function GeoJsonMapView({ geojson, heightPx = 260 }) {
  const hasFeatures = Array.isArray(geojson?.features) && geojson.features.length > 0

  if (!hasFeatures) {
    return (
      <div
        style={{
          height: heightPx,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed #e2e8f0', borderRadius: 14, background: '#f8fafc',
          color: '#94a3b8', fontSize: 12.5,
        }}
      >
        No GeoJSON geometry to preview yet — run an analysis first.
      </div>
    )
  }

  const center = geojson.features[0]?.geometry?.coordinates?.[0]?.[0]
  const startCenter = Array.isArray(center) ? [center[1], center[0]] : [16.5062, 80.648]

  return (
    <div style={{ height: heightPx, borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer center={startCenter} zoom={12} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri"
          maxZoom={18}
        />
        <GeoJSON
          data={geojson}
          style={(feature) => {
            const isRiver = feature?.properties?.water_type === 'river'
            return {
              color: isRiver ? '#f97316' : '#e11d48',
              weight: 1.8,
              opacity: 0.95,
              fillColor: isRiver ? '#f97316' : '#e11d48',
              fillOpacity: 0.18,
            }
          }}
          onEachFeature={(feature, layer) => {
            const p = feature.properties || {}
            const typeLabel = p.water_type === 'river' ? 'River / channel' : 'Lake / pond'
            layer.bindPopup(
              `<div style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:12px;color:#0f172a;">
                 <div style="color:#0e7490;font-size:10px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">
                   ${p.water_body_name || 'Water Body'} · ${typeLabel}
                 </div>
                 <div style="font-weight:700;font-size:14px;">
                   ${(Number(p.area_km2) || 0).toFixed(4)} km²
                 </div>
               </div>`
            )
          }}
        />
        <FitToGeojson geojson={geojson} />
      </MapContainer>
    </div>
  )
}
