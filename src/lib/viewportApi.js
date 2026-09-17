// ================================================================
// VIEWPORT API CLIENT
//
// Talks to the three new backend routes added for the "live
// viewport" dashboard flow:
//   POST /viewport/analyze        -> JSON (geojson, tile_urls, stats)
//   POST /viewport/rgb-download   -> PNG bytes
//   POST /viewport/report-pdf     -> PDF bytes
//
// Change API_BASE if the backend isn't running on 127.0.0.1:5000
// (matches the base URL already used by AIApp.jsx in this project).
// ================================================================

export const API_BASE =
  import.meta.env?.VITE_API_BASE || 'http://127.0.0.1:5000'

/**
 * Turn a Leaflet map's current bounds into the plain
 * {west, south, east, north} object every /viewport/* route
 * expects.
 */
export function leafletBoundsToBounds(leafletBounds) {
  return {
    west: leafletBounds.getWest(),
    south: leafletBounds.getSouth(),
    east: leafletBounds.getEast(),
    north: leafletBounds.getNorth(),
  }
}

/**
 * Analyze whatever is currently visible in the given bounds.
 * `params` can carry any of the optional index thresholds the
 * backend accepts (threshold, area_min, mndwi_threshold, etc).
 */
export async function analyzeViewport(bounds, params = {}, signal) {
  const res = await fetch(`${API_BASE}/viewport/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bounds, ...params }),
    signal,
  })

  const data = await res.json()

  if (!res.ok || data.status === 'error') {
    throw new Error(data.message || 'Viewport analysis failed')
  }

  return data
}

/**
 * Downloads the RGB (true-colour) Sentinel-2 composite for the
 * given bounds as a PNG and triggers a browser save.
 */
export async function downloadRgbPng(bounds, filename = 'hydrodetect_rgb.png') {
  const res = await fetch(`${API_BASE}/viewport/rgb-download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bounds, dimensions: 1600 }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'RGB download failed')
  }

  const blob = await res.blob()
  triggerDownload(blob, filename)
}

/**
 * Requests a full PDF report (viewport bounds, lat/lon, indices
 * used, water-body table, embedded RGB thumbnail) and triggers a
 * browser save.
 */
export async function downloadReportPdf(bounds, params = {}, placeLabel, filename = 'hydrodetect_viewport_report.pdf') {
  const res = await fetch(`${API_BASE}/viewport/report-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bounds, place_label: placeLabel, ...params }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'PDF report failed')
  }

  const blob = await res.blob()
  triggerDownload(blob, filename)
}

/**
 * Downloads a single analyzed map layer as a PNG. Defaults to
 * "mask_overlay" — the true-colour scene with the detected water mask
 * highlighted on top — which is the image people want after running an
 * analysis. Other choices: 'satellite' | 'fcc' | 'ndwi' | 'mndwi' |
 * 'water_mask'.
 */
export async function downloadLayerImage(
  bounds,
  layer = 'mask_overlay',
  filename,
) {
  const res = await fetch(`${API_BASE}/viewport/layer-download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bounds, layer, dimensions: 1600 }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Image download failed')
  }

  const blob = await res.blob()
  triggerDownload(blob, filename || `hydrodetect_${layer}.png`)
}

/**
 * Downloads the current analysis result as a standalone .geojson
 * file — purely client-side, no backend round-trip needed since
 * the geojson is already in memory from /viewport/analyze.
 */
export function downloadGeojsonFile(geojson, filename = 'hydrodetect_water_bodies.geojson') {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: 'application/geo+json',
  })
  triggerDownload(blob, filename)
}

/**
 * True if `inner` bounds are fully within `outer` bounds (with a small
 * shrink margin on `outer` so a pixel-level nudge doesn't count as
 * "still inside"). Used so panning/zooming *within* the last analyzed
 * extent never fires a new backend request — the existing Earth Engine
 * tile layers already render correctly at any zoom level inside that
 * extent — and a request is only sent once the visible viewport
 * actually extends past what was last analyzed.
 */
export function isBoundsContained(inner, outer, marginPct = 0.04) {
  if (!inner || !outer) return false
  const lngPad = (outer.east - outer.west) * marginPct
  const latPad = (outer.north - outer.south) * marginPct
  return (
    inner.west >= outer.west + lngPad &&
    inner.east <= outer.east - lngPad &&
    inner.south >= outer.south + latPad &&
    inner.north <= outer.north - latPad
  )
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
