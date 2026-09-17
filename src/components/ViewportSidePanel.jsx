// ================================================================
// VIEWPORT SIDE PANEL
//
// Fixed, full-height left panel shown alongside the main map
// (replaces the old floating top-left layer-toggle box on this
// screen). Shows the live viewport coordinates (updates for free as
// you pan/zoom — no backend call), whether the visible area has
// already been analyzed, and the layer/mask toggles.
// ================================================================

const LAYER_OPTIONS = [
  { key: 'water_mask', label: 'Water Bodies (mask)', hint: 'default output', color: '#06b6d4' },
  { key: 'boundaries', label: 'Boundaries', hint: 'outlines + popups', color: '#e11d48' },
  { key: 'satellite', label: 'Satellite RGB', hint: 'true colour', color: '#0ea5e9' },
  { key: 'fcc', label: 'False Colour', hint: 'vegetation emphasis', color: '#f97316' },
  { key: 'ndwi', label: 'NDWI', hint: 'index render', color: '#2563eb' },
  { key: 'mndwi', label: 'MNDWI', hint: 'index render', color: '#0891b2' },
  { key: 'ndbi', label: 'NDBI', hint: 'built-up render', color: '#b45309' },
]

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(5) : '—'
}

export default function ViewportSidePanel({
  liveBounds,
  isAnalyzedArea,
  analyzing,
  layers,
  toggleLayer,
  onAnalyzeCurrentView,
  onOpenDashboard,
  onBack,
  result,
}) {
  const stats = result?.stats

  return (
    <div
      style={{
        width: 292,
        flexShrink: 0,
        height: '100%',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <button
          onClick={onBack}
          style={{
            fontSize: 11.5, fontWeight: 700, color: '#64748b',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10,
          }}
        >
          ← Methods
        </button>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>NDWI + MNDWI Analysis</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Sentinel-2 · Google Earth Engine</p>
      </div>

      {/* Status + primary actions */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 10px', borderRadius: 10, marginBottom: 10,
            fontSize: 11, fontWeight: 700,
            background: analyzing ? '#ecfeff' : isAnalyzedArea ? '#f0fdf4' : '#fffbeb',
            color: analyzing ? '#0e7490' : isAnalyzedArea ? '#15803d' : '#b45309',
            border: `1px solid ${analyzing ? '#a5f3fc' : isAnalyzedArea ? '#bbf7d0' : '#fde68a'}`,
          }}
        >
          <span style={{
            width: 7, height: 7, borderRadius: 999,
            background: analyzing ? '#0e7490' : isAnalyzedArea ? '#16a34a' : '#d97706',
            animation: analyzing ? 'hd-pulse 1s infinite' : 'none',
          }} />
          {analyzing
            ? 'New viewport detected — analyzing…'
            : isAnalyzedArea
              ? 'This view is already analyzed'
              : 'View extends past the analyzed area'}
        </div>

        <button
          onClick={onAnalyzeCurrentView}
          disabled={analyzing}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            fontSize: 12.5, fontWeight: 700, marginBottom: 8,
            border: '1px solid #0e7490', background: '#0e7490', color: '#fff',
            cursor: analyzing ? 'wait' : 'pointer', opacity: analyzing ? 0.65 : 1,
          }}
        >
          {analyzing ? 'Analyzing…' : '⟳ Analyze this view'}
        </button>
        <button
          onClick={onOpenDashboard}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            fontSize: 12.5, fontWeight: 700,
            border: '1px solid #0f172a', background: '#0f172a', color: '#fff',
            cursor: 'pointer',
          }}
        >
          Open Dashboard →
        </button>
      </div>

      {/* Live viewport coordinates */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 8px' }}>
          Current viewport
        </p>
        {[
          ['West', liveBounds?.west],
          ['South', liveBounds?.south],
          ['East', liveBounds?.east],
          ['North', liveBounds?.north],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11.5 }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{fmt(val)}°</span>
          </div>
        ))}
        {stats && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11.5 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Last analyzed water bodies</span>
              <span style={{ color: '#0e7490', fontWeight: 800 }}>{stats.water_body_count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11.5 }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Rivers detected</span>
              <span style={{ color: '#f97316', fontWeight: 800 }}>{stats.river_count}</span>
            </div>
          </div>
        )}
      </div>

      {/* Layer / mask toggles */}
      <div style={{ padding: '14px 18px', flex: 1 }}>
        <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 8px' }}>
          Apply mask / layer
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {LAYER_OPTIONS.map((opt) => {
            const active = !!layers[opt.key]
            return (
              <button
                key={opt.key}
                onClick={() => toggleLayer(opt.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 11px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${active ? opt.color : '#e2e8f0'}`,
                  background: active ? `${opt.color}12` : '#ffffff',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: opt.color, opacity: active ? 1 : 0.3 }} />
                  <span>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: active ? opt.color : '#334155' }}>{opt.label}</span>
                    <span style={{ display: 'block', fontSize: 10, color: '#94a3b8' }}>{opt.hint}</span>
                  </span>
                </span>
                <span style={{
                  width: 30, height: 17, borderRadius: 999, position: 'relative', flexShrink: 0,
                  background: active ? opt.color : '#e2e8f0', transition: 'background 150ms ease',
                }}>
                  <span style={{
                    position: 'absolute', top: 2, left: active ? 15 : 2,
                    width: 13, height: 13, borderRadius: 999, background: '#fff',
                    transition: 'left 150ms ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }} />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Panning/zooming within the analyzed area is free. Moving past it auto-analyzes the new area.
        </p>
      </div>
    </div>
  )
}
