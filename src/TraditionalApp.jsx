import { useState, useCallback } from 'react'
import MapView     from './components/MapView'
import Sidebar     from './components/Sidebar'
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

export default function TraditionalApp({ onBack }) {

  // ============================================================
  // RESULT DATA
  // ============================================================

  const [geojson, setGeojson] = useState(null)

  const [tileUrls, setTileUrls] = useState(null)

  const [featureCount, setFeatureCount] = useState(null)


  // ============================================================
  // MAP / SCAN AREA
  // ============================================================

 const [bbox,          setBbox]          = useState([80.4, 16.2, 81.0, 16.8])
const [activeCity,    setActiveCity]    = useState('Vijayawada')

// Scan radius in kilometres
const [radiusKm,      setRadiusKm]      = useState(50)


  // ============================================================
  // RADIUS
  // ============================================================


  // ============================================================
  // UI STATE
  // ============================================================

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState(null)

  const [processingMsg, setProcessingMsg] = useState('')

  const [reportOpen, setReportOpen] = useState(false)


  // ============================================================
  // MAP LAYERS
  // ============================================================

  const [layers, setLayers] = useState({

    satellite: true,

    ndwi: false,

    water_mask: false,

    boundaries: true,

  })


  // ============================================================
  // TOGGLE MAP LAYER
  // ============================================================

  const toggleLayer = (key) => {

    setLayers(prev => ({
      ...prev,
      [key]: !prev[key],
    }))

  }


  // ============================================================
  // WATER DETECTION
  // ============================================================

  const detectWater = useCallback(
    async (params) => {

      setLoading(true)

      setError(null)

      setGeojson(null)

      setTileUrls(null)

      setFeatureCount(null)

      setReportOpen(false)


      // --------------------------------------------------------
      // PROCESSING MESSAGE ANIMATION
      // --------------------------------------------------------

      let idx = 0

      setProcessingMsg(
        MESSAGES[0]
      )

      const interval = setInterval(() => {

        idx = (
          idx + 1
        ) % MESSAGES.length

        setProcessingMsg(
          MESSAGES[idx]
        )

      }, 4000)


      try {

        // ======================================================
        // BUILD REQUEST
        // ======================================================

        /*
          Sidebar should provide:

          params = {
            latitude: ...,
            longitude: ...,
            radius_km: ...
          }

          We also support the existing params structure,
          so the application does not break if Sidebar
          already sends additional values.
        */

       const requestBody = {
  ...params,
  radius_km: radiusKm,
}


        // ======================================================
        // BACKEND REQUEST
        // ======================================================

        const res = await fetch(
          'https://mini-backend-lhd8.onrender.com/detect-water',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

           body: JSON.stringify(requestBody),
          }
        )


        // ======================================================
        // RESPONSE
        // ======================================================

        const data =
          await res.json()


        // ======================================================
        // ERROR
        // ======================================================

        if (
          !res.ok ||
          data.status === 'error'
        ) {

          setError(
            data.message ||
            'Water detection failed'
          )

          return
        }


        // ======================================================
        // STORE RESULT
        // ======================================================

        setGeojson(
          data.geojson
        )

        setTileUrls(
          data.tile_urls
        )

        setFeatureCount(
          data.feature_count
        )


        // ======================================================
        // UPDATE MAP BOUNDS
        // ======================================================

        if (
          data.bbox &&
          Array.isArray(data.bbox) &&
          data.bbox.length === 4
        ) {

          setBbox(
            data.bbox
          )

        }


        // ======================================================
        // UPDATE RADIUS
        // ======================================================

        


        // ======================================================
        // ENABLE RELEVANT LAYERS
        // ======================================================

        setLayers(prev => ({

          ...prev,

          satellite: true,

          boundaries: true,

        }))


        // =================================aaaa=====================
        // OPEN REPORT
        // ======================================================

        setTimeout(
          () => setReportOpen(true),
          600
        )


      } catch (err) {

        console.error(
          'Water detection error:',
          err
        )

        setError(
          'Cannot reach backend — please check the GEE server.'
        )

      } finally {

        clearInterval(
          interval
        )

        setLoading(false)

        setProcessingMsg('')

      }

    },
    [radiusKm]
  )


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div
      className="
        flex
        h-screen
        w-screen
        overflow-hidden
        bg-[#080c14]
        relative
      "
    >

      {/* ======================================================
          BACK BUTTON
          ====================================================== */}

      <button

        onClick={onBack}

        className="
          absolute
          top-4
          left-[276px]
          z-[2000]

          flex
          items-center
          gap-1.5

          px-3
          py-1.5

          rounded-lg

          text-[11px]
          font-semibold

          text-slate-500

          bg-slate-900/80

          border
          border-slate-800/60

          hover:text-white
          hover:border-slate-700/60

          transition-all

          backdrop-blur-sm
        "
      >

        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >

          <path
            d="M19 12H5M12 19l-7-7 7-7"
          />

        </svg>

        Methods

      </button>


      {/* ======================================================
          SIDEBAR
          ====================================================== */}

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
  radiusKm={radiusKm}
  setRadiusKm={setRadiusKm}
  onOpenReport={() => setReportOpen(true)}
/>

       


      {/* ======================================================
          MAIN MAP AREA
          ====================================================== */}

      <main
        className="
          flex-1
          relative
          overflow-hidden
        "
      >

        <MapView
  geojson={geojson}
  tileUrls={tileUrls}
  bbox={bbox}
  loading={loading}
  processingMsg={processingMsg}
  layers={layers}
  radiusKm={radiusKm}
/>


        {/* ====================================================
            REPORT PANEL
            ==================================================== */}

        <ReportPanel

          open={reportOpen}

          onClose={() =>
            setReportOpen(false)
          }

          data={geojson}

          cityName={activeCity}

        />


        {/* ====================================================
            VIEW REPORT BUTTON
            ==================================================== */}

        {geojson &&
          !reportOpen && (

            <button

              onClick={() =>
                setReportOpen(true)
              }

              className="
                absolute
                top-4
                right-4
                z-[1000]

                flex
                items-center
                gap-2

                px-3.5
                py-2

                rounded-xl

                bg-[#0d1117]/95

                border
                border-slate-700/60

                text-xs
                font-semibold
                text-slate-300

                hover:text-white
                hover:border-cyan-700/50
                hover:bg-slate-800/90

                transition-all

                shadow-lg

                backdrop-blur-sm
              "
            >

              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />

                <line
                  x1="9"
                  y1="3"
                  x2="9"
                  y2="21"
                />

              </svg>

              View Report

            </button>

          )}

      </main>

    </div>

  )
}