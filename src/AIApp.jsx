import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import AISidebar    from './AISidebar'
import AIReportPanel from './AIReportPanel'

// ── Local U-Net backend endpoint ──────────────────────────────
const AI_BACKEND = 'http://127.0.0.1:5001/ai/detect-water'

const AI_MESSAGES = [
  'Loading satellite tiles...',
  'Tiling region into 512×512 patches...',
  'Running U-Net inference...',
  'Aggregating segmentation masks...',
  'Vectorizing water boundaries...',
  'Computing area statistics...',
  'Finalising GeoJSON output...',
]

// ── FitBounds helper (same as MapView) ──────────────────────
function FitBounds({ bbox }) {
  const map = useMap()
  useEffect(() => {
    if (bbox) {
      map.fitBounds(
        [[bbox[1], bbox[0]], [bbox[3], bbox[2]]],
        { padding: [40, 40], animate: true, duration: 1 }
      )
    }
  }, [bbox, map])
  return null
}

// ── Inline AI Map (violet theme) ─────────────────────────────
function AIMapView({ geojson, bbox, loading, processingMsg }) {
  return (
    <div style={{ width: '100%', height: '100vh' }} className="relative">

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] pointer-events-none
                        bg-[#080c14]/70 backdrop-blur-[2px]
                        flex flex-col items-center justify-center gap-4">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-full border-[3px]
                            border-slate-700 absolute"/>
            <div className="w-14 h-14 rounded-full border-[3px]
                            border-t-violet-400 border-r-transparent
                            border-b-transparent border-l-transparent
                            animate-spin absolute"/>
            <div className="w-14 h-14 rounded-full border-[3px]
                            border-b-indigo-400 border-t-transparent
                            border-r-transparent border-l-transparent
                            animate-spin absolute"
                 style={{ animationDuration:'1.5s', animationDirection:'reverse' }}/>
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-semibold mb-1">
              Running AI Segmentation
            </p>
            <p className="text-slate-400 text-xs max-w-[240px] min-h-[16px]">
              {processingMsg}
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i}
                className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}/>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!geojson && !loading && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[999]
                        pointer-events-none">
          <div className="px-4 py-2 rounded-full text-xs text-slate-400
                          bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm">
            Select a city → click Run AI Detection
          </div>
        </div>
      )}

      {/* Result badge */}
      {geojson && !loading && (
        <div className="absolute top-4 right-4 z-[999] pointer-events-none">
          <div className="px-3 py-2 rounded-xl text-xs font-mono
                          bg-slate-900/90 border border-violet-800/50
                          backdrop-blur-sm text-violet-400">
            ✓ {geojson?.features?.length} polygons
          </div>
        </div>
      )}

      <MapContainer
        center={[16.5062, 80.6480]}
        zoom={11}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri"
          maxZoom={18}
        />

        {geojson &&
         Array.isArray(geojson?.features) &&
         geojson.features.length > 0 && (
          <GeoJSON
            key={JSON.stringify(bbox)}
            data={geojson}
            style={() => ({
              color:       '#a78bfa',
              weight:      1.8,
              opacity:     0.95,
              fillColor:   '#7c3aed',
              fillOpacity: 0.15,
            })}
            onEachFeature={(feature, layer) => {
              const area = feature.properties?.area_m2
              if (!area) return
              layer.bindPopup(`
                <div style="font-family:'Courier New',monospace;font-size:11px;
                            color:#e2e8f0;background:#0f172a;padding:10px 12px;
                            border-radius:8px;border:1px solid #334155;min-width:160px">
                  <div style="color:#94a3b8;font-size:10px;text-transform:uppercase;
                              letter-spacing:.08em;margin-bottom:6px">Water Body · U-Net</div>
                  <div style="color:#c4b5fd;font-size:13px;font-weight:700;margin-bottom:4px">
                    ${(area / 1e6).toFixed(4)} km²
                  </div>
                  <div style="color:#64748b">${Math.round(area).toLocaleString()} m²</div>
                </div>
              `, { className: 'dark-popup' })
              layer.on({
                mouseover: e => e.target.setStyle({
                  fillOpacity: 0.35, weight: 2.5, color: '#c4b5fd'
                }),
                mouseout: e => e.target.setStyle({
                  fillOpacity: 0.15, weight: 1.8, color: '#a78bfa'
                }),
              })
            }}
          />
        )}
        <FitBounds bbox={bbox} />
      </MapContainer>

      <style>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background:transparent!important;border:none!important;
          box-shadow:0 8px 32px rgba(0,0,0,.5)!important;
          padding:0!important;border-radius:10px!important;
        }
        .dark-popup .leaflet-popup-content{margin:0!important;}
        .dark-popup .leaflet-popup-tip-container{display:none;}
        .leaflet-control-zoom{
          border:1px solid rgba(51,65,85,.8)!important;
          border-radius:10px!important;overflow:hidden!important;
        }
        .leaflet-control-zoom a{
          background:rgba(15,23,42,.9)!important;color:#94a3b8!important;
        }
        .leaflet-control-zoom a:hover{
          background:rgba(30,41,59,.95)!important;color:#e2e8f0!important;
        }
      `}</style>
    </div>
  )
}

// ── Main AIApp component ──────────────────────────────────────
export default function AIApp({ onBack }) {
  const [result,        setResult]        = useState(null)   // full backend response
  const [geojson,       setGeojson]       = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [bbox,          setBbox]          = useState([80.4, 16.2, 81.0, 16.8])
  const [activeCity,    setActiveCity]    = useState('Vijayawada')
  const [processingMsg, setProcessingMsg] = useState('')
  const [reportOpen,    setReportOpen]    = useState(false)

  const detectWater = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setGeojson(null)
    setReportOpen(false)

    let idx = 0
    setProcessingMsg(AI_MESSAGES[0])
    const interval = setInterval(() => {
      idx = (idx + 1) % AI_MESSAGES.length
      setProcessingMsg(AI_MESSAGES[idx])
    }, 3500)

    try {
      const res  = await fetch(AI_BACKEND, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      })

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`)
      }

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'AI detection failed')
      } else {
        // Backend shape: { success, place, statistics, geojson }
        setResult(data)
        setGeojson(data.geojson || null)

        // Update bbox from result if available, else keep current
        if (params.bbox) setBbox(params.bbox)

        setTimeout(() => setReportOpen(true), 600)
      }
    } catch (err) {
      setError(
        err.message.includes('fetch')
          ? 'Cannot reach AI backend — make sure Flask is running on localhost:5000'
          : err.message
      )
    } finally {
      clearInterval(interval)
      setLoading(false)
      setProcessingMsg('')
    }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] relative">

      {/* ── Back button ── */}
      <button
        onClick={onBack}
        className="absolute top-4 left-[276px] z-[2000]
                   flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]
                   font-semibold text-slate-500 bg-slate-900/80
                   border border-slate-800/60 hover:text-white
                   hover:border-slate-700/60 transition-all backdrop-blur-sm">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Methods
      </button>

      <AISidebar
        onDetect={detectWater}
        loading={loading}
        error={error}
        result={result}
        bbox={bbox}
        setBbox={setBbox}
        activeCity={activeCity}
        setActiveCity={setActiveCity}
        hasResult={!!result}
        onOpenReport={() => setReportOpen(true)}
      />

      <main className="flex-1 relative overflow-hidden">
        <AIMapView
          geojson={geojson}
          bbox={bbox}
          loading={loading}
          processingMsg={processingMsg}
        />

        <AIReportPanel
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          result={result}
          cityName={activeCity}
        />

        {result && !reportOpen && (
          <button
            onClick={() => setReportOpen(true)}
            className="absolute top-4 right-4 z-[1000]
                       flex items-center gap-2 px-3.5 py-2 rounded-xl
                       bg-[#0d1117]/95 border border-slate-700/60
                       text-xs font-semibold text-slate-300
                       hover:text-white hover:border-violet-700/50
                       hover:bg-slate-800/90 transition-all
                       shadow-lg backdrop-blur-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.5"
                 strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            View Report
          </button>
        )}
      </main>
    </div>
  )
}