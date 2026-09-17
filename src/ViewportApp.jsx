import { useCallback, useRef, useState } from 'react'
import ViewportMap from './components/ViewportMap'
import ViewportSidePanel from './components/ViewportSidePanel'
import ViewportDashboard from './components/ViewportDashboard'
import ViewportToastStack, { useViewportToasts } from './components/ViewportToast'
import {
  analyzeViewport,
  downloadReportPdf,
  downloadRgbPng,
  downloadLayerImage,
  downloadGeojsonFile,
  isBoundsContained,
} from './lib/viewportApi'

// ================================================================
// NDWI + MNDWI ANALYSIS APP
//
//   - Main screen: fixed full-height left panel (live coordinates +
//     layer/mask toggles) + map. Only the first view auto-analyzes;
//     after that, a new backend call only fires once the visible
//     viewport extends past the last analyzed extent (panning/
//     zooming *inside* it is free — the existing Earth Engine tile
//     layers already render correctly at any zoom within that
//     extent). "Analyze this view" always forces a fresh call.
//   - While analyzing, the map is never dimmed/blurred — a small
//     side badge says "New viewport detected — analyzing…" instead.
//   - "Open Dashboard" swaps the main screen out entirely: the
//     dashboard takes the full width, with its own larger map that
//     reuses the same already-fetched result (no extra API call).
//   - The last completed analysis stays in memory for the whole
//     session (it's never cleared on dashboard open/close).
// ================================================================

const DEFAULT_LAYERS = {
  satellite: true,
  fcc: false,
  ndwi: false,
  mndwi: false,
  ndbi: false,
  water_mask: true, // water mask is the default output layer
  boundaries: true,
}

export default function ViewportApp({ onBack }) {
  const [result, setResult] = useState(null)
  const [lastBounds, setLastBounds] = useState(null)
  const [liveBounds, setLiveBounds] = useState(null)
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [analyzing, setAnalyzing] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [error, setError] = useState(null)

  const { toasts, pushToast } = useViewportToasts()
  const abortRef = useRef(null)
  const runCountRef = useRef(0)
  const trackedBoundsRef = useRef(null)     // latest bounds, even without analyzing
  const lastAnalyzedBoundsRef = useRef(null) // extent covered by the current `result`

  const toggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const runAnalysis = useCallback(async (bounds) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    const runId = ++runCountRef.current
    const previousAnalyzedBounds = lastAnalyzedBoundsRef.current

    setLastBounds(bounds)
    // Optimistically claim this extent as "analyzed" so overlapping
    // settle events for the same area don't fire duplicate requests
    // while this one is in flight; rolled back on failure below.
    lastAnalyzedBoundsRef.current = bounds
    setAnalyzing(true)
    setError(null)

    try {
      const data = await analyzeViewport(bounds, {}, controller.signal)

      if (runId !== runCountRef.current) return // superseded by a newer run

      setResult(data)

      const count = data?.stats?.water_body_count ?? 0
      const area = data?.stats?.total_water_area_km2 ?? 0

      pushToast(
        `Analysis complete · ${count} water bod${count === 1 ? 'y' : 'ies'} · ${area.toFixed(2)} km²`,
        'success'
      )
    } catch (err) {
      if (err.name === 'AbortError') return
      if (runId !== runCountRef.current) return

      lastAnalyzedBoundsRef.current = previousAnalyzedBounds
      console.error('Viewport analysis error:', err)
      setError(err.message || 'Analysis failed')
      pushToast(`Analysis failed: ${err.message || 'could not reach backend'}`, 'error')
    } finally {
      if (runId === runCountRef.current) setAnalyzing(false)
    }
  }, [pushToast])

  // Fired after the map settles (debounced). Only actually calls the
  // backend if the visible viewport is NOT fully covered by the
  // extent of the last analysis — i.e. only when it's genuinely out
  // of the already-analyzed area.
  const handleViewportSettled = useCallback((bounds) => {
    if (isBoundsContained(bounds, lastAnalyzedBoundsRef.current)) {
      return // still inside the analyzed extent — no request needed
    }
    runAnalysis(bounds)
  }, [runAnalysis])

  const handleBoundsTrack = useCallback((bounds) => {
    trackedBoundsRef.current = bounds
    setLiveBounds(bounds)
  }, [])

  // Manual re-analyze: always forces a fresh call for the current view.
  const handleAnalyzeCurrentView = () => {
    if (!trackedBoundsRef.current) return
    runAnalysis(trackedBoundsRef.current)
  }

  const handleDownloadPdf = async () => {
    if (!lastBounds) return
    try {
      await downloadReportPdf(lastBounds, {}, undefined)
      pushToast('PDF report downloaded.', 'success')
    } catch (err) {
      pushToast(`PDF download failed: ${err.message}`, 'error')
    }
  }

  const handleDownloadRgb = async () => {
    if (!lastBounds) return
    try {
      await downloadRgbPng(lastBounds)
      pushToast('RGB image downloaded.', 'success')
    } catch (err) {
      pushToast(`RGB download failed: ${err.message}`, 'error')
    }
  }

  const handleDownloadLayer = async (layer) => {
    if (!lastBounds) return
    try {
      await downloadLayerImage(lastBounds, layer)
      pushToast('Map image downloaded.', 'success')
    } catch (err) {
      pushToast(`Image download failed: ${err.message}`, 'error')
    }
  }

  const handleDownloadGeojson = () => {
    if (!result?.geojson) return
    downloadGeojsonFile(result.geojson)
    pushToast('GeoJSON file downloaded.', 'success')
  }

  const isAnalyzedArea = isBoundsContained(liveBounds, lastAnalyzedBoundsRef.current)

  // ============================================================
  // DASHBOARD OPEN — the main screen (panel + map) is fully
  // replaced. The dashboard is full width/height and mounts its
  // own big map reusing the same `result` — no new API call.
  // ============================================================
  if (dashboardOpen) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#f8fafc' }}>
        <ViewportToastStack toasts={toasts} />
        <ViewportDashboard
          result={result}
          analyzing={analyzing}
          layers={layers}
          toggleLayer={toggleLayer}
          onClose={() => setDashboardOpen(false)}
          onAnalyzeCurrentView={handleAnalyzeCurrentView}
          onDownloadPdf={handleDownloadPdf}
          onDownloadRgb={handleDownloadRgb}
          onDownloadLayer={handleDownloadLayer}
          onDownloadGeojson={handleDownloadGeojson}
        />
      </div>
    )
  }

  // ============================================================
  // MAP-ONLY SCREEN — fixed left panel + map, side by side.
  // ============================================================
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#f8fafc', display: 'flex' }}>
      <ViewportToastStack toasts={toasts} />

      <ViewportSidePanel
        liveBounds={liveBounds}
        isAnalyzedArea={isAnalyzedArea}
        analyzing={analyzing}
        layers={layers}
        toggleLayer={toggleLayer}
        onAnalyzeCurrentView={handleAnalyzeCurrentView}
        onOpenDashboard={() => setDashboardOpen(true)}
        onBack={onBack}
        result={result}
      />

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {error && (
          <div
            style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1500, padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              background: '#fef2f2', border: '1px solid #fecaca', color: '#7f1d1d',
            }}
          >
            {error}
          </div>
        )}

        <ViewportMap
          geojson={result?.geojson}
          tileUrls={result?.tile_urls}
          bbox={result?.bbox}
          loading={analyzing}
          analyzing={analyzing}
          layers={layers}
          toggleLayer={toggleLayer}
          onViewportSettled={handleViewportSettled}
          onBoundsTrack={handleBoundsTrack}
          autoAnalyze={true}
          hideFloatingControls={true}
        />
      </div>
    </div>
  )
}
