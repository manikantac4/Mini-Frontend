// ================================================================
// AI (U-Net) BACKEND ADAPTER
//
// The existing AIApp/AISidebar/AIReportPanel UI was already built
// against a *placeholder* contract: POST /ai/detect-water with
// {place, bbox}, expecting {success, statistics, geojson}. The real
// Unet_backend API is POST /analysis with {latitude, longitude,
// radius_km}, returning {analysis_id, water_bodies, summary, geojson}.
//
// Rather than rewrite the (already polished) UI components, this
// adapter converts between the two shapes so AISidebar.jsx and
// AIReportPanel.jsx keep working completely unchanged — only
// AIApp.jsx's fetch call is swapped for runAiDetection() below.
// ================================================================

const AI_API_BASE = import.meta.env?.VITE_AI_BACKEND_URL || 'http://127.0.0.1:8001'

const MIN_RADIUS_KM = 1
const MAX_RADIUS_KM = 100 // backend hard limit (schemas/response.py AnalysisRequest)

/** Converts a Nominatim-style [west, south, east, north] bbox into a
 * center point + a radius (km) that comfortably covers it, clamped to
 * what the backend accepts. */
function bboxToAoi(bbox) {
  const [west, south, east, north] = bbox
  const latitude = (south + north) / 2
  const longitude = (west + east) / 2

  const dLatKm = (north - south) * 111.32
  const dLonKm = (east - west) * 111.32 * Math.cos((latitude * Math.PI) / 180)
  const radiusKm = Math.sqrt(dLatKm ** 2 + dLonKm ** 2) / 2

  return {
    latitude,
    longitude,
    radius_km: Math.min(Math.max(radiusKm, MIN_RADIUS_KM), MAX_RADIUS_KM),
  }
}

function buildDownloadUrls(analysisId) {
  return {
    geojson: `${AI_API_BASE}/downloads/${analysisId}/water_bodies.geojson`,
    csv: `${AI_API_BASE}/downloads/${analysisId}/water_bodies.csv`,
    ranked_csv: `${AI_API_BASE}/downloads/${analysisId}/ranked_water_bodies.csv`,
    statistics_csv: `${AI_API_BASE}/downloads/${analysisId}/statistics.csv`,
  }
}

/** Reshapes the real backend's AnalysisResponse into the
 * {success, statistics, geojson} shape AISidebar/AIReportPanel
 * already consume, so those components need zero changes. */
function shapeAnalysisResponse(data, place, aoi) {
  const summary = data.summary
  const totalAoiKm2 = Math.PI * aoi.radius_km ** 2 // circle area, matches create_aoi()'s buffer
  const waterAreaSqkm = summary.total_water_area_ha / 100
  const largestSqkm = (summary.largest_water_body_area_ha || 0) / 100

  // 10m pixels -> 100 m^2/px. Derived (not measured) — the backend
  // doesn't build a full-AOI raster mosaic in this version, so exact
  // pixel counts aren't tracked; this is a reasonable approximation
  // for the "Pixel Statistics" bars, not a precise measurement.
  const waterPixels = Math.round((summary.total_water_area_m2 || 0) / 100)
  const totalPixels = Math.round((totalAoiKm2 * 1_000_000) / 100)

  return {
    success: true,
    place,
    analysis_id: data.analysis_id,
    aoi: data.aoi,
    analysis_crs: data.analysis_crs,
    model_threshold: data.model_threshold,
    patch_count: data.patch_count,
    patch_error_count: data.patch_error_count,
    timings: data.timings,
    statistics: {
      water_body_count: summary.total_water_bodies,
      water_area_sqkm: waterAreaSqkm,
      water_percentage: totalAoiKm2 > 0 ? (waterAreaSqkm / totalAoiKm2) * 100 : 0,
      largest_water_body_sqkm: largestSqkm,
      water_pixels: waterPixels,
      total_pixels: totalPixels,
    },
    geojson: data.geojson,
    water_bodies: data.water_bodies, // full per-body detail incl. rank, quality_flags, probability stats
    summary,
    downloads: buildDownloadUrls(data.analysis_id),
  }
}

/**
 * Runs a real U-Net analysis for the given place/bbox and returns a
 * result object shaped exactly like the old mock contract expected
 * ({success, statistics, geojson, ...}), plus extra fields
 * (water_bodies, downloads, summary) that newer UI can use directly.
 */
export async function runAiDetection({ place, bbox }) {
  if (!bbox || bbox.length !== 4) {
    throw new Error('No area selected — search and select a location first.')
  }

  const aoi = bboxToAoi(bbox)

  let res
  try {
    res = await fetch(`${AI_API_BASE}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: aoi.latitude,
        longitude: aoi.longitude,
        radius_km: aoi.radius_km,
      }),
    })
  } catch (err) {
    throw new Error(
      `Cannot reach the U-Net backend at ${AI_API_BASE} — make sure it's running ` +
      `(uvicorn app:app --port 8001) and reachable from the browser.`
    )
  }

  if (!res.ok) {
    let detail = `Server returned ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch { /* non-JSON error body */ }
    throw new Error(detail)
  }

  const data = await res.json()
  return shapeAnalysisResponse(data, place, aoi)
}

export { AI_API_BASE }
