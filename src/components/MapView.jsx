import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Circle,
  useMap
} from 'react-leaflet'


function FitBounds({ bbox }) {

  const map = useMap()

  useEffect(() => {

    if (bbox) {

      map.fitBounds(
        [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]]
        ],
        {
          padding: [40, 40],
          animate: true,
          duration: 1
        }
      )

    }

  }, [bbox, map])

  return null
}


// ============================================================
// SCAN RADIUS CIRCLE
// ============================================================
//
// This uses the returned bbox to find the center of the
// detection area and draws the selected radius around it.
//
// IMPORTANT:
// This is only a visual circle.
// The actual detection radius is handled by the backend/GEE.
// ============================================================

function ScanCircle({ bbox, radiusKm }) {

  if (
    !bbox ||
    !Array.isArray(bbox) ||
    bbox.length !== 4 ||
    !radiusKm
  ) {
    return null
  }

  const west = bbox[0]
  const south = bbox[1]
  const east = bbox[2]
  const north = bbox[3]

  // Center of the returned bounding box
  const centerLat = (south + north) / 2
  const centerLon = (west + east) / 2

  return (

    <Circle

      center={[
        centerLat,
        centerLon
      ]}

      radius={
        Number(radiusKm) * 1000
      }

      pathOptions={{

        color: '#22d3ee',

        weight: 2,

        opacity: 0.75,

        fillColor: '#22d3ee',

        fillOpacity: 0.03,

        dashArray: '7 7'

      }}

    />

  )
}


export default function MapView({

  geojson,

  tileUrls,

  bbox,

  loading,

  processingMsg,

  layers,

  radiusKm

}) {

  return (

    <div
      style={{
        width: '100%',
        height: '100vh'
      }}
      className="relative"
    >


      {/* ======================================================
          Loading overlay
          ====================================================== */}

      {loading && (

        <div
          className="
            absolute inset-0 z-[1000]
            pointer-events-none
            bg-[#080c14]/70
            backdrop-blur-[2px]
            flex flex-col
            items-center
            justify-center
            gap-4
          "
        >

          <div className="relative w-14 h-14">

            <div
              className="
                w-14 h-14
                rounded-full
                border-[3px]
                border-slate-700
                absolute
              "
            />

            <div
              className="
                w-14 h-14
                rounded-full
                border-[3px]
                border-t-cyan-400
                border-r-transparent
                border-b-transparent
                border-l-transparent
                animate-spin
                absolute
              "
            />

            <div
              className="
                w-14 h-14
                rounded-full
                border-[3px]
                border-b-violet-400
                border-t-transparent
                border-r-transparent
                border-l-transparent
                animate-spin
                absolute
              "
              style={{
                animationDuration: '1.5s',
                animationDirection: 'reverse'
              }}
            />

          </div>


          <div className="text-center">

            <p
              className="
                text-white
                text-sm
                font-semibold
                mb-1
              "
            >
              Analysing Satellite Data
            </p>

            <p
              className="
                text-slate-400
                text-xs
                max-w-[240px]
                min-h-[16px]
              "
            >
              {processingMsg}
            </p>

          </div>


          <div className="flex gap-1.5">

            {[0, 1, 2].map(i => (

              <div
                key={i}
                className="
                  w-1.5 h-1.5
                  rounded-full
                  bg-cyan-400
                  animate-bounce
                "
                style={{
                  animationDelay:
                    `${i * 0.15}s`
                }}
              />

            ))}

          </div>

        </div>

      )}


      {/* ======================================================
          Empty state
          ====================================================== */}

      {!geojson && !loading && (

        <div
          className="
            absolute
            bottom-8
            left-1/2
            -translate-x-1/2
            z-[999]
            pointer-events-none
          "
        >

          <div
            className="
              px-4 py-2
              rounded-full
              text-xs
              text-slate-400
              bg-slate-900/80
              border
              border-slate-700/60
              backdrop-blur-sm
            "
          >
            Select a city → click Detect Water
          </div>

        </div>

      )}


      {/* ======================================================
          Result badge
          ====================================================== */}

      {geojson && !loading && (

        <div
          className="
            absolute
            top-4
            right-4
            z-[999]
            pointer-events-none
          "
        >

          <div
            className="
              px-3 py-2
              rounded-xl
              text-xs
              font-mono
              bg-slate-900/90
              border
              border-emerald-800/50
              backdrop-blur-sm
              text-emerald-400
            "
          >
            ✓ {geojson?.features?.length} polygons
          </div>

        </div>

      )}


      {/* ======================================================
          MAP
          ====================================================== */}

      <MapContainer

        center={[
          16.5062,
          80.6480
        ]}

        zoom={11}

        style={{
          width: '100%',
          height: '100%'
        }}

        zoomControl={true}

        scrollWheelZoom={true}

      >


        {/* ====================================================
            ORIGINAL ESRI BASE MAP
            ==================================================== */}

        <TileLayer

          url="
            https://server.arcgisonline.com/
            ArcGIS/rest/services/
            World_Imagery/
            MapServer/tile/{z}/{y}/{x}
          "

          attribution="Esri"

          maxZoom={18}

          opacity={1}

        />


        {/* ====================================================
            ORIGINAL GEE SATELLITE
            ==================================================== */}

        {tileUrls?.satellite &&
          layers.satellite && (

            <TileLayer

              key="gee-satellite"

              url={tileUrls.satellite}

              attribution="
                Google Earth Engine · Sentinel-2
              "

              maxZoom={18}

              opacity={1}

            />

          )}


        {/* ====================================================
            ORIGINAL NDWI
            ==================================================== */}

        {tileUrls?.ndwi &&
          layers.ndwi && (

            <TileLayer

              key="gee-ndwi"

              url={tileUrls.ndwi}

              maxZoom={18}

              opacity={0.8}

            />

          )}


        {/* ====================================================
            ORIGINAL WATER MASK
            ==================================================== */}

        {tileUrls?.water_mask &&
          layers.water_mask && (

            <TileLayer

              key="gee-water-mask"

              url={tileUrls.water_mask}

              maxZoom={18}

              opacity={0.7}

            />

          )}


        {/* ====================================================
            NEW: SCAN RADIUS CIRCLE
            ==================================================== */}

        {bbox &&
          radiusKm &&
          !loading && (

            <ScanCircle

              bbox={bbox}

              radiusKm={radiusKm}

            />

          )}


        {/* ====================================================
            ORIGINAL WATER BOUNDARIES
            ==================================================== */}

        {geojson &&
          layers.boundaries &&
          Array.isArray(
            geojson?.features
          ) &&
          geojson.features.length > 0 && (

            <GeoJSON

              data={geojson}

              style={() => ({

                color: '#f43f5e',

                weight: 1.8,

                opacity: 0.95,

                fillColor: '#f43f5e',

                fillOpacity: 0.1,

              })}


              onEachFeature={(
                feature,
                layer
              ) => {

                const area =
                  feature.properties?.area_m2

                if (!area) return


                // ==================================================
                // WATER BODY NUMBER
                // ==================================================

                const waterBodyId =
                  feature.properties
                    ?.water_body_id


                const waterBodyName =
                  feature.properties
                    ?.water_body_name ||
                  (
                    waterBodyId
                      ? `Water Body ${waterBodyId}`
                      : 'Water Body'
                  )


                // ==================================================
                // ORIGINAL POPUP
                // ==================================================

                layer.bindPopup(`

                  <div
                    style="
                      font-family:'Courier New',monospace;
                      font-size:11px;
                      color:#e2e8f0;
                      background:#0f172a;
                      padding:10px 12px;
                      border-radius:8px;
                      border:1px solid #334155;
                      min-width:160px
                    "
                  >

                    <div
                      style="
                        color:#94a3b8;
                        font-size:10px;
                        text-transform:uppercase;
                        letter-spacing:.08em;
                        margin-bottom:6px
                      "
                    >
                      ${waterBodyName}
                    </div>


                    <div
                      style="
                        color:#f1f5f9;
                        font-size:13px;
                        font-weight:700;
                        margin-bottom:4px
                      "
                    >
                      ${(area / 1e6).toFixed(4)} km²
                    </div>


                    <div
                      style="
                        color:#64748b
                      "
                    >
                      ${Math.round(area)
                        .toLocaleString()} m²
                    </div>

                  </div>

                `, {
                  className:
                    'dark-popup'
                })


                // ==================================================
                // HOVER
                // ==================================================

                layer.on({

                  mouseover: e => {

                    e.target.setStyle({

                      fillOpacity: 0.3,

                      weight: 2.5,

                      color: '#fb7185'

                    })

                  },


                  mouseout: e => {

                    e.target.setStyle({

                      fillOpacity: 0.1,

                      weight: 1.8,

                      color: '#f43f5e'

                    })

                  }

                })

              }}

            />

          )}


        {/* ====================================================
            FIT ORIGINAL BBOX
            ==================================================== */}

        <FitBounds
          bbox={bbox}
        />


      </MapContainer>


      {/* ======================================================
          ORIGINAL STYLES
          ====================================================== */}

      <style>{`

        .dark-popup
          .leaflet-popup-content-wrapper {

          background:
            transparent !important;

          border:
            none !important;

          box-shadow:
            0 8px 32px
            rgba(0,0,0,.5) !important;

          padding:
            0 !important;

          border-radius:
            10px !important;
        }


        .dark-popup
          .leaflet-popup-content {

          margin:
            0 !important;
        }


        .dark-popup
          .leaflet-popup-tip-container {

          display:
            none;
        }


        .leaflet-control-zoom {

          border:
            1px solid
            rgba(51,65,85,.8)
            !important;

          border-radius:
            10px !important;

          overflow:
            hidden !important;
        }


        .leaflet-control-zoom a {

          background:
            rgba(15,23,42,.9)
            !important;

          color:
            #94a3b8
            !important;
        }


        .leaflet-control-zoom a:hover {

          background:
            rgba(30,41,59,.95)
            !important;

          color:
            #e2e8f0
            !important;
        }

      `}</style>

    </div>

  )

}