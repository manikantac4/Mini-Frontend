import { useState, useCallback } from 'react'
import MapView    from './components/MapView'
import Sidebar    from './components/Sidebar'
import ReportPanel from './components/ReportPanel'

const MESSAGES = [
  'Connecting to Google Earth Engine...',
  'Loading Sentinel-2 imagery...',
  'Applying NDWI + MNDWI dual index...',
  'Removing noise and small patches...',
  'Vectorizing water boundaries...',
  'Filtering by area threshold...',
  'Building tile URLs + GeoJSON...',
]

export default function App() {
  const [geojson,       setGeojson]       = useState(null)
  const [tileUrls,      setTileUrls]      = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [featureCount,  setFeatureCount]  = useState(null)
  const [bbox,          setBbox]          = useState([80.4, 16.2, 81.0, 16.8])
  const [activeCity,    setActiveCity]    = useState('Vijayawada')
  const [processingMsg, setProcessingMsg] = useState('')
  const [reportOpen,    setReportOpen]    = useState(false)
  const [layers, setLayers] = useState({
    satellite:  true,
    ndwi:       false,
    water_mask: false,
    boundaries: true,
  })

  const toggleLayer = (key) =>
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))

  const detectWater = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    setGeojson(null)
    setTileUrls(null)
    setFeatureCount(null)
    setReportOpen(false)

    let idx = 0
    setProcessingMsg(MESSAGES[0])
    const interval = setInterval(() => {
      idx = (idx + 1) % MESSAGES.length
      setProcessingMsg(MESSAGES[idx])
    }, 4000)

    try {
      const res  = await fetch('https://mini-backend-lhd8.onrender.com/detect-water', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      })
      const data = await res.json()
      if (data.status === 'error') {
        setError(data.message)
      } else {
        setGeojson(data.geojson)
        setTileUrls(data.tile_urls)
        setFeatureCount(data.feature_count)
        setBbox(data.bbox)
        setLayers(prev => ({ ...prev, satellite: true, boundaries: true }))
        // Auto-open report on success
        setTimeout(() => setReportOpen(true), 600)
      }
    } catch {
      setError('Cannot reach backend — is Flask running on port 5000?')
    } finally {
      clearInterval(interval)
      setLoading(false)
      setProcessingMsg('')
    }
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14]">
      <Sidebar
        onDetect={detectWater}
        loading={loading}
        error={error}
        featureCount={featureCount}
        bbox={bbox}
        setBbox={setBbox}
        activeCity={activeCity}
        setActiveCity={setActiveCity}
        layers={layers}
        toggleLayer={toggleLayer}
        hasResult={!!tileUrls}
        onOpenReport={() => setReportOpen(true)}
      />

      <main className="flex-1 relative overflow-hidden">
        <MapView
          geojson={geojson}
          tileUrls={tileUrls}
          bbox={bbox}
          loading={loading}
          processingMsg={processingMsg}
          layers={layers}
        />

        {/* Report panel slides in from right */}
        <ReportPanel
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          data={geojson}
          cityName={activeCity}
        />

        {/* Toggle button — visible when report closed + result exists */}
        {geojson && !reportOpen && (
          <button
            onClick={() => setReportOpen(true)}
            className="absolute top-4 right-4 z-[1000]
                       flex items-center gap-2 px-3.5 py-2 rounded-xl
                       bg-[#0d1117]/95 border border-slate-700/60
                       text-xs font-semibold text-slate-300
                       hover:text-white hover:border-cyan-700/50
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