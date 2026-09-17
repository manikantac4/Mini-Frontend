import { useState } from 'react'
import GeoJsonViewer from './GeoJsonViewer'
import GeoJsonMapView from './GeoJsonMapView'
import ViewportMap from './ViewportMap'

// NOTE: When the dashboard is open, the main map-only screen is fully
// unmounted — this component now owns its own big results map,
// re-mounted here with the SAME already-fetched `result` (tile URLs +
// geojson), so opening the dashboard never triggers a new backend
// call. It shares the same `layers` / `toggleLayer` state as the main
// screen so toggling a layer here (or there) is remembered either way.

// ================================================================
// SMALL BUILDING BLOCKS
// ================================================================

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        flex: '1 1 170px',
        minWidth: 170,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: accent || '#0f172a', margin: '6px 0 0' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11.5, color: '#64748b', margin: '3px 0 0' }}>{sub}</p>}
    </div>
  )
}

function DownloadButton({ label, onClick, busy, tone = 'default' }) {
  const palette = {
    default: { bg: '#0f172a', text: '#fff' },
    accent: { bg: '#0e7490', text: '#fff' },
    outline: { bg: '#ffffff', text: '#0f172a', border: '#e2e8f0' },
  }[tone]

  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        padding: '10px 16px',
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: busy ? 'wait' : 'pointer',
        border: `1px solid ${palette.border || palette.bg}`,
        background: palette.bg,
        color: palette.text,
        opacity: busy ? 0.65 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {busy ? 'Working…' : label}
    </button>
  )
}

function Section({ title, subtitle, children, defaultRight }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
        {defaultRight}
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// ================================================================
// DASHBOARD
// ================================================================

export default function ViewportDashboard({
  result,
  analyzing,
  layers,
  toggleLayer,
  onClose,
  onAnalyzeCurrentView,
  onDownloadPdf,
  onDownloadRgb,
  onDownloadLayer,
  onDownloadGeojson,
}) {
  const [showGeojson, setShowGeojson] = useState(true)
  const [showNotes, setShowNotes] = useState(false)
  const [busyKey, setBusyKey] = useState(null)

  const stats = result?.stats
  const center = result?.center
  const bbox = result?.bbox
  const vkm = result?.viewport_km
  const geojson = result?.geojson
  const dateRange = result?.date_range
  const params = result?.parameters
  const features = geojson?.features || []
  const topFeatures = [...features]
    .sort((a, b) => (b.properties?.area_km2 || 0) - (a.properties?.area_km2 || 0))
    .slice(0, 15)

  const runBusy = async (key, fn) => {
    setBusyKey(key)
    try {
      await fn()
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div
      style={{
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        height: '100vh',
        width: '100%',
        overflowY: 'auto',
      }}
    >
      {/* ============================================================
          TOP BAR — sticky, larger "close/open" affordance
          ============================================================ */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#ecfeff', border: '1px solid #a5f3fc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#0e7490" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 12 C5 8, 8 6, 12 6 C16 6, 19 8, 21 12" />
              <path d="M3 16 C5 12, 8 10, 12 10 C16 10, 19 12, 21 16" />
              <path d="M3 20 C5 16, 8 14, 12 14 C16 14, 19 16, 21 20" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>NDWI + MNDWI Analysis Dashboard</p>
            <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>
              Sentinel-2 / Google Earth Engine · index-based water detection
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onAnalyzeCurrentView}
            disabled={analyzing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10,
              fontSize: 12.5, fontWeight: 700,
              border: '1px solid #0e7490', background: '#0e7490', color: '#fff',
              cursor: analyzing ? 'wait' : 'pointer', opacity: analyzing ? 0.65 : 1,
            }}
          >
            {analyzing ? 'Analyzing…' : '⟳ Analyze this view'}
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10,
              fontSize: 12.5, fontWeight: 700,
              border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155',
              cursor: 'pointer',
            }}
          >
            ✕ Close dashboard · View map only
          </button>
        </div>
      </div>

      {/* ============================================================
          BODY — left "currently analyzed" panel + right content
          ============================================================ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: '24px 24px 32px' }}>

        {/* ------------------ LEFT PANEL (static snapshot) ------------------ */}
        <aside
          style={{
            width: 260, flexShrink: 0, position: 'sticky', top: 82,
            background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
            padding: '18px 18px 20px',
          }}
        >
          <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#0e7490', margin: '0 0 4px' }}>
            Currently Analyzed
          </p>
          <p style={{ fontSize: 10.5, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.5 }}>
            A snapshot of the last completed analysis. Panning or zooming the map below does
            <strong> not</strong> change this — click “Analyze this view” to refresh it.
          </p>

          {!result ? (
            <p style={{ fontSize: 12, color: '#94a3b8' }}>No analysis yet.</p>
          ) : (
            <>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', margin: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Coordinates
              </p>
              <InfoRow label="Center lat" value={center ? `${center.latitude.toFixed(5)}°` : '—'} />
              <InfoRow label="Center lon" value={center ? `${center.longitude.toFixed(5)}°` : '—'} />
              <InfoRow label="West / East" value={bbox ? `${bbox[0].toFixed(4)} / ${bbox[2].toFixed(4)}` : '—'} />
              <InfoRow label="South / North" value={bbox ? `${bbox[1].toFixed(4)} / ${bbox[3].toFixed(4)}` : '—'} />

              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', margin: '16px 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Area
              </p>
              <InfoRow label="Viewport size" value={vkm ? `${vkm.width_km.toFixed(1)} × ${vkm.height_km.toFixed(1)} km` : '—'} />
              <InfoRow label="Viewport area" value={stats ? `${stats.viewport_area_km2.toFixed(1)} km²` : '—'} />
              <InfoRow label="Water area" value={stats ? `${stats.total_water_area_km2.toFixed(3)} km²` : '—'} />
              <InfoRow label="Coverage" value={stats ? `${stats.water_coverage_pct.toFixed(2)}%` : '—'} />

              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', margin: '16px 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Rivers &amp; water bodies
              </p>
              <InfoRow label="Rivers / channels" value={stats ? stats.river_count : '—'} />
              <InfoRow label="Lakes / ponds" value={stats ? stats.lake_pond_count : '—'} />
              <InfoRow label="Total water bodies" value={stats ? stats.water_body_count : '—'} />

              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', margin: '16px 0 4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Imagery
              </p>
              <InfoRow label="Composite window" value={dateRange ? `${dateRange.start} → ${dateRange.end}` : '—'} />
              <InfoRow label="Default layer" value="Water mask" />
            </>
          )}
        </aside>

        {/* ------------------ RIGHT CONTENT ------------------ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          <Section title="Overview">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <StatCard label="Water bodies" value={stats ? stats.water_body_count : '—'} sub="total detected" accent="#0e7490" />
              <StatCard label="Rivers / channels" value={stats ? stats.river_count : '—'} sub="elongated shapes" accent="#f97316" />
              <StatCard label="Lakes / ponds" value={stats ? stats.lake_pond_count : '—'} sub="compact shapes" accent="#e11d48" />
              <StatCard label="Total water area" value={stats ? `${stats.total_water_area_km2.toFixed(3)} km²` : '—'} sub={stats ? `${Math.round(stats.total_water_area_m2).toLocaleString()} m²` : null} />
              <StatCard label="Coverage" value={stats ? `${stats.water_coverage_pct.toFixed(2)}%` : '—'} sub="of visible viewport" />
              <StatCard label="Largest / smallest" value={stats ? `${stats.largest_area_km2.toFixed(3)} km²` : '—'} sub={stats ? `smallest ${stats.smallest_area_km2.toFixed(4)} km²` : null} />
              <StatCard label="Average size" value={stats ? `${stats.average_area_km2.toFixed(4)} km²` : '—'} sub="per water body" />
              <StatCard label="Viewport scanned" value={vkm ? `${vkm.width_km.toFixed(1)} × ${vkm.height_km.toFixed(1)} km` : '—'} sub={stats ? `${stats.viewport_area_km2.toFixed(0)} km²` : null} />
            </div>
          </Section>

          <Section
            title="Analyzed results map"
            subtitle="Same result already returned by the backend, shown larger — reusing it here doesn't call the API again. Use the layer buttons (top-left of the map) to switch between Water Bodies, NDWI, MNDWI and more."
          >
            {!result ? (
              <div
                style={{
                  height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px dashed #e2e8f0', borderRadius: 16, background: '#ffffff', color: '#94a3b8', fontSize: 12.5,
                }}
              >
                No analysis yet — run one from the map screen, or click “Analyze this view” above.
              </div>
            ) : (
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <ViewportMap
                  geojson={result?.geojson}
                  tileUrls={result?.tile_urls}
                  bbox={result?.bbox}
                  loading={false}
                  analyzing={false}
                  layers={layers}
                  toggleLayer={toggleLayer}
                  autoAnalyze={false}
                  heightPx={620}
                />
              </div>
            )}
          </Section>

          <Section title="Export this analysis" subtitle="Water mask is applied by default — every image below is the analyzed result, not a raw scene.">
            <div
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
                padding: '16px 18px', borderRadius: 14,
                border: '1px solid #e2e8f0', background: '#ffffff',
              }}
            >
              <DownloadButton
                label="⬇ PDF report"
                tone="accent"
                busy={busyKey === 'pdf'}
                onClick={() => runBusy('pdf', onDownloadPdf)}
              />
              <DownloadButton
                label="⬇ Water Bodies (masks applied)"
                tone="default"
                busy={busyKey === 'mask_overlay'}
                onClick={() => runBusy('mask_overlay', () => onDownloadLayer('mask_overlay'))}
              />
              <DownloadButton
                label="⬇ Water mask only"
                tone="outline"
                busy={busyKey === 'water_mask'}
                onClick={() => runBusy('water_mask', () => onDownloadLayer('water_mask'))}
              />
              <DownloadButton
                label="⬇ RGB (true colour)"
                tone="outline"
                busy={busyKey === 'rgb'}
                onClick={() => runBusy('rgb', onDownloadRgb)}
              />
              <DownloadButton
                label="⬇ NDWI image"
                tone="outline"
                busy={busyKey === 'ndwi'}
                onClick={() => runBusy('ndwi', () => onDownloadLayer('ndwi'))}
              />
              <DownloadButton
                label="⬇ MNDWI image"
                tone="outline"
                busy={busyKey === 'mndwi'}
                onClick={() => runBusy('mndwi', () => onDownloadLayer('mndwi'))}
              />
              <DownloadButton
                label="⬇ GeoJSON"
                tone="outline"
                busy={false}
                onClick={onDownloadGeojson}
              />
            </div>
          </Section>

          <Section
            title="Detected water bodies"
            subtitle={features.length > 15 ? `Top 15 of ${features.length} by area — full list in GeoJSON below` : `${features.length} feature(s) detected`}
          >
            {features.length === 0 ? (
              <p style={{ fontSize: 12.5, color: '#94a3b8' }}>No water bodies met the current thresholds in this viewport.</p>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', background: '#ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                      {['#', 'Name', 'Type', 'Area (km²)', 'Area (m²)'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topFeatures.map((f) => {
                      const p = f.properties || {}
                      const isRiver = p.water_type === 'river'
                      return (
                        <tr key={p.water_body_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '9px 14px', color: '#94a3b8' }}>{p.water_body_id}</td>
                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>{p.water_body_name}</td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                              background: isRiver ? '#fff7ed' : '#fef2f2',
                              color: isRiver ? '#c2410c' : '#be123c',
                              border: `1px solid ${isRiver ? '#fed7aa' : '#fecdd3'}`,
                            }}>
                              {isRiver ? 'River' : 'Lake / Pond'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0e7490' }}>{(p.area_km2 || 0).toFixed(4)}</td>
                          <td style={{ padding: '9px 14px', color: '#64748b' }}>{Math.round(p.area_m2 || 0).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section
            title="GeoJSON detail"
            subtitle="Feature list, raw JSON, and a dedicated map view of the detected geometry"
            defaultRight={
              <button
                onClick={() => setShowGeojson((v) => !v)}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: '1px solid #e2e8f0', background: showGeojson ? '#0f172a' : '#f8fafc',
                  color: showGeojson ? '#fff' : '#334155', cursor: 'pointer',
                }}
              >
                {showGeojson ? 'Hide' : 'Show'}
              </button>
            }
          >
            {showGeojson && (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div
                  style={{
                    flex: '1 1 360px', minWidth: 320,
                    border: '1px solid #e2e8f0', borderRadius: 14, background: '#ffffff',
                    padding: 16, height: 300,
                  }}
                >
                  <GeoJsonViewer geojson={geojson} />
                </div>
                <div style={{ flex: '1 1 360px', minWidth: 320 }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, color: '#334155', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Map view of geometry
                  </p>
                  <GeoJsonMapView geojson={geojson} heightPx={266} />
                </div>
              </div>
            )}
          </Section>

          <Section
            title="Detection method &amp; accuracy notes"
            subtitle="What changed in this build, and how the detection works"
            defaultRight={
              <button
                onClick={() => setShowNotes((v) => !v)}
                style={{
                  padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  border: '1px solid #e2e8f0', background: showNotes ? '#0f172a' : '#f8fafc',
                  color: showNotes ? '#fff' : '#334155', cursor: 'pointer',
                }}
              >
                {showNotes ? 'Hide' : 'Show'}
              </button>
            }
          >
            {showNotes && (
              <div
                style={{
                  border: '1px solid #e2e8f0', borderRadius: 14, background: '#ffffff',
                  padding: 20, fontSize: 12.5, lineHeight: 1.7, color: '#334155',
                }}
              >
                <p style={{ fontWeight: 800, color: '#0f172a', marginTop: 0 }}>Implementation steps for this update</p>
                <ol style={{ paddingLeft: 18, margin: '0 0 16px' }}>
                  <li>Manual re-analysis: panning/zooming no longer calls the backend automatically after the first load — analysis now runs only via “Analyze this view”, so this panel is a stable snapshot rather than something that changes as you scroll.</li>
                  <li>Tighter thresholds: MNDWI and AWEI thresholds were raised from 0.00 and NDVI/NDBI exclusion ceilings tightened, cutting shadow/damp-soil/built-up false positives.</li>
                  <li>Seasonal fallback: if the primary Nov–Mar composite has no clear Sentinel-2 scenes over a viewport, the pipeline automatically widens to a full calendar year rather than returning a blank/noisy result.</li>
                  <li>Real-looking RGB: true-colour and false-colour images now use a per-viewport 2nd–98th percentile stretch instead of one fixed 0–3000 stretch, so brightness/contrast matches the actual scene.</li>
                  <li>River vs. lake classification: each detected polygon is tagged by shape compactness (4·π·area / perimeter²) — elongated shapes are labeled “river”, compact shapes “lake / pond” — surfaced in stats, the table above, the map colours, and the PDF.</li>
                  <li>New “analyzed image” export: a backend endpoint renders the true-colour scene with the water mask highlighted on top (cyan), so a single click downloads the actual annotated result, not just a raw index render.</li>
                  <li>PDF report now embeds that annotated image first, followed by the plain RGB, plus a river/lake breakdown and per-body type column.</li>
                </ol>
                <p style={{ fontWeight: 800, color: '#0f172a' }}>How detection works</p>
                <p style={{ margin: 0 }}>
                  NDWI (McFeeters) and MNDWI (Xu) must agree, or AWEI confirms a secondary NDWI
                  signal — with NDVI (vegetation) and NDBI (built-up) exclusion masks applied,
                  followed by morphological cleanup (open/close), a connected-pixel-count filter to
                  drop speckle, vectorization, and a minimum-area filter
                  {params ? ` (currently ${params.area_min} m²)` : ''}.
                </p>
              </div>
            )}
          </Section>

          <p style={{ fontSize: 10.5, color: '#94a3b8', margin: 0 }}>
            Close the dashboard to return to the fixed-panel map screen — your last completed
            analysis stays available for the rest of this session either way.
          </p>
        </div>
      </div>
    </div>
  )
}
