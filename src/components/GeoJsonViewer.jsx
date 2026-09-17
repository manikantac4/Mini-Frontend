import { useMemo, useState } from 'react'

// ================================================================
// GEOJSON VIEWER
//
// A lightweight in-app viewer for the current analysis's
// FeatureCollection — a features list (id / area / coords) plus a
// raw pretty-printed JSON tab with copy-to-clipboard. No external
// map library needed here; ViewportMap already renders the
// polygons on the real map.
// ================================================================

export default function GeoJsonViewer({ geojson }) {
  const [tab, setTab] = useState('features') // 'features' | 'raw'
  const [copied, setCopied] = useState(false)

  const features = geojson?.features || []

  const rawText = useMemo(() => {
    if (!geojson) return ''
    return JSON.stringify(geojson, null, 2)
  }, [geojson])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard API unavailable — ignore */
    }
  }

  if (!geojson) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        No GeoJSON yet — pan or zoom the map to run an analysis.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 8,
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            ['features', `Features (${features.length})`],
            ['raw', 'Raw JSON'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                fontSize: 11.5,
                fontWeight: 600,
                border: '1px solid',
                borderColor: tab === key ? '#0e7490' : '#e2e8f0',
                background: tab === key ? '#ecfeff' : '#ffffff',
                color: tab === key ? '#0e7490' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'raw' && (
          <button
            onClick={handleCopy}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied ✓' : 'Copy JSON'}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'features' ? (
          features.length === 0 ? (
            <p style={{ fontSize: 12.5, color: '#94a3b8' }}>
              No water bodies met the current thresholds in this viewport.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {features.map((f) => {
                const p = f.properties || {}
                const ring = f.geometry?.coordinates?.[0]
                const vertexCount = Array.isArray(ring) ? ring.length : 0
                return (
                  <div
                    key={p.water_body_id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                        {p.water_body_name || `Water Body ${p.water_body_id}`}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#0e7490', fontWeight: 700 }}>
                        {Number(p.area_km2 || 0).toFixed(4)} km²
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                      {Math.round(p.area_m2 || 0).toLocaleString()} m² · {f.geometry?.type || 'Polygon'} · {vertexCount} vertices
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          <pre
            style={{
              margin: 0,
              fontSize: 10.5,
              lineHeight: 1.5,
              color: '#1e293b',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              padding: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {rawText}
          </pre>
        )}
      </div>
    </div>
  )
}
