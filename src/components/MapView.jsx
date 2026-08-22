import { useEffect } from 'react'
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Circle,
  ScaleControl,
  useMap,
} from 'react-leaflet'


// ============================================================
// FIT MAP TO DETECTION AREA
// ============================================================

function FitBounds({ bbox }) {

  const map = useMap()

  useEffect(() => {

    if (
      !bbox ||
      !Array.isArray(bbox) ||
      bbox.length !== 4
    ) {
      return
    }

    const [
      west,
      south,
      east,
      north
    ] = bbox

    // Small delay allows Leaflet to finish rendering
    // before fitting the map.
    setTimeout(() => {

      map.fitBounds(
        [
          [south, west],
          [north, east]
        ],
        {
          paddingTopLeft: [50, 50],
          paddingBottomRight: [50, 50],

          // Prevent the map from zooming ridiculously close
          maxZoom: 14,

          animate: true,

          duration: 1.2,
        }
      )

    }, 100)

  }, [bbox, map])

  return null
}


// ============================================================
// SCAN RADIUS CIRCLE
// ============================================================

function ScanRadiusCircle({
  bbox,
  radiusKm
}) {

  if (
    !bbox ||
    !Array.isArray(bbox) ||
    bbox.length !== 4 ||
    !radiusKm
  ) {
    return null
  }

  const [
    west,
    south,
    east,
    north
  ] = bbox

  const centerLat =
    (south + north) / 2

  const centerLon =
    (west + east) / 2

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

        weight: 1.5,

        opacity: 0.75,

        fillColor: '#22d3ee',

        fillOpacity: 0.025,

        dashArray: '7 8',

      }}

    />

  )
}


// ============================================================
// MAIN MAP VIEW
// ============================================================

export default function MapView({

  geojson,

  tileUrls,

  bbox,

  loading,

  processingMsg,

  layers,

  radiusKm,

}) {

  return (

    <div
      style={{
        width: '100%',
        height: '100%',
      }}
      className="
        relative
        bg-[#07101a]
      "
    >

      {/* ======================================================
          LOADING OVERLAY
          ====================================================== */}

      {loading && (

        <div
          className="
            absolute
            inset-0
            z-[1000]
            pointer-events-none

            bg-[#080c14]/65
            backdrop-blur-[1.5px]

            flex
            flex-col
            items-center
            justify-center
            gap-4
          "
        >

          <div
            className="
              relative
              w-14
              h-14
            "
          >

            <div
              className="
                absolute
                w-14
                h-14
                rounded-full
                border-[3px]
                border-slate-700
              "
            />

            <div
              className="
                absolute
                w-14
                h-14
                rounded-full

                border-[3px]
                border-t-cyan-400
                border-r-transparent
                border-b-transparent
                border-l-transparent

                animate-spin
              "
            />

            <div
              className="
                absolute
                w-14
                h-14
                rounded-full

                border-[3px]
                border-b-violet-400
                border-t-transparent
                border-r-transparent
                border-l-transparent

                animate-spin
              "
              style={{
                animationDuration: '1.5s',
                animationDirection: 'reverse',
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
                max-w-[260px]
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
                  w-1.5
                  h-1.5
                  rounded-full
                  bg-cyan-400
                  animate-bounce
                "
                style={{
                  animationDelay:
                    `${i * 0.15}s`,
                }}
              />

            ))}

          </div>

        </div>

      )}


      {/* ======================================================
          EMPTY STATE
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
              px-4
              py-2

              rounded-full

              text-xs
              text-slate-400

              bg-slate-900/85

              border
              border-slate-700/60

              backdrop-blur-sm

              shadow-lg
            "
          >
            Select a city → choose radius → Run Detection
          </div>

        </div>

      )}


      {/* ======================================================
          RESULT INFORMATION
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
              px-3
              py-2

              rounded-xl

              text-xs
              font-mono

              bg-slate-950/90

              border
              border-emerald-800/50

              backdrop-blur-md

              text-emerald-400

              shadow-lg
            "
          >

            <div className="flex items-center gap-2">

              <span>
                ✓
              </span>

              <span>
                {geojson?.features?.length || 0}
                {' '}
                water bodies
              </span>

            </div>


            {radiusKm && (

              <div
                className="
                  text-[10px]
                  text-slate-500
                  mt-1
                  text-right
                "
              >
                Scan radius: {radiusKm} km
              </div>

            )}

          </div>

        </div>

      )}


      {/* ======================================================
          LEAFLET MAP
          ====================================================== */}

      <MapContainer

        center={[
          16.5062,
          80.6480
        ]}

        zoom={11}

        minZoom={5}

        maxZoom={20}

        zoomControl={true}

        scrollWheelZoom={true}

        doubleClickZoom={true}

        dragging={true}

        touchZoom={true}

        keyboard={true}

        zoomSnap={0.5}

        zoomDelta={0.5}

        wheelDebounceTime={40}

        wheelPxPerZoomLevel={90}

        preferCanvas={true}

        style={{
          width: '100%',
          height: '100%',
          background: '#07101a',
        }}

      >


        {/* ====================================================
            HIGH-QUALITY BASE SATELLITE
            ==================================================== */}

        <TileLayer

          url="
            https://server.arcgisonline.com/
            ArcGIS/rest/services/
            World_Imagery/
            MapServer/tile/{z}/{y}/{x}
          "

          attribution="
            Tiles © Esri
          "

          maxZoom={20}

          maxNativeZoom={19}

          tileSize={256}

          detectRetina={true}

          updateWhenZooming={false}

          updateWhenIdle={true}

          keepBuffer={4}

          opacity={1}

        />


        {/* ====================================================
            SENTINEL-2 GEE SATELLITE
            ==================================================== */}

        {tileUrls?.satellite &&
          layers.satellite && (

            <TileLayer

              key="gee-satellite"

              url={tileUrls.satellite}

              attribution="
                Google Earth Engine · Sentinel-2
              "

              maxZoom={20}

              maxNativeZoom={18}

              tileSize={256}

              detectRetina={true}

              updateWhenZooming={false}

              updateWhenIdle={true}

              keepBuffer={3}

              /*
                Keep Sentinel semi-transparent so the
                sharper Esri imagery remains visible.
              */

              opacity={0.28}

            />

          )}


        {/* ====================================================
            NDWI
            ==================================================== */}

        {tileUrls?.ndwi &&
          layers.ndwi && (

            <TileLayer

              key="gee-ndwi"

              url={tileUrls.ndwi}

              maxZoom={20}

              maxNativeZoom={18}

              tileSize={256}

              detectRetina={true}

              updateWhenZooming={false}

              updateWhenIdle={true}

              keepBuffer={3}

              opacity={0.72}

            />

          )}


        {/* ====================================================
            WATER MASK
            ==================================================== */}

        {tileUrls?.water_mask &&
          layers.water_mask && (

            <TileLayer

              key="gee-water-mask"

              url={tileUrls.water_mask}

              maxZoom={20}

              maxNativeZoom={18}

              tileSize={256}

              detectRetina={true}

              updateWhenZooming={false}

              updateWhenIdle={true}

              keepBuffer={3}

              opacity={0.55}

            />

          )}


        {/* ====================================================
            SCAN RADIUS
            ==================================================== */}

        {bbox &&
          radiusKm &&
          !loading && (

            <ScanRadiusCircle

              bbox={bbox}

              radiusKm={radiusKm}

            />

          )}


        {/* ====================================================
            WATER BOUNDARIES
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

                color:
                  '#ff1744',

                weight:
                  2.2,

                opacity:
                  1,

                fillColor:
                  '#00bfff',

                fillOpacity:
                  0.07,

                lineCap:
                  'round',

                lineJoin:
                  'round',

              })}


              onEachFeature={(
                feature,
                layer
              ) => {

                const properties =
                  feature.properties || {}


                // ==================================================
                // WATER BODY NUMBER
                // ==================================================

                const waterBodyId =
                  properties.water_body_id


                const waterBodyName =
                  properties.water_body_name ||
                  (
                    waterBodyId
                      ? `Water Body ${waterBodyId}`
                      : 'Water Body'
                  )


                // ==================================================
                // AREA
                // ==================================================

                const area =
                  Number(
                    properties.area_m2 || 0
                  )


                const areaKm2 =
                  Number(
                    properties.area_km2 ??
                    (
                      area / 1000000
                    )
                  )


                // ==================================================
                // POPUP
                // ==================================================

                layer.bindPopup(

                  `
                  <div
                    style="
                      font-family:
                        Arial,
                        sans-serif;

                      color:#e2e8f0;

                      background:#0f172a;

                      padding:13px 15px;

                      border-radius:11px;

                      border:
                        1px solid
                        #334155;

                      min-width:205px;

                      box-shadow:
                        0 10px 35px
                        rgba(0,0,0,.5);
                    "
                  >

                    <div
                      style="
                        color:#64748b;

                        font-size:9px;

                        text-transform:
                          uppercase;

                        letter-spacing:
                          .13em;

                        margin-bottom:5px;
                      "
                    >
                      Detected Water Body
                    </div>


                    <div
                      style="
                        color:#f8fafc;

                        font-size:15px;

                        font-weight:700;

                        margin-bottom:11px;
                      "
                    >
                      ${waterBodyName}
                    </div>


                    <div
                      style="
                        height:1px;

                        background:#1e293b;

                        margin-bottom:5px;
                      "
                    ></div>


                    <div
                      style="
                        display:flex;

                        justify-content:
                          space-between;

                        align-items:center;

                        padding:6px 0;
                      "
                    >

                      <span
                        style="
                          color:#64748b;
                          font-size:10px;
                        "
                      >
                        Water Body ID
                      </span>

                      <span
                        style="
                          color:#22d3ee;
                          font-size:11px;
                          font-weight:700;
                        "
                      >
                        #${waterBodyId ?? '-'}
                      </span>

                    </div>


                    <div
                      style="
                        display:flex;

                        justify-content:
                          space-between;

                        align-items:center;

                        padding:6px 0;

                        border-top:
                          1px solid
                          #1e293b;
                      "
                    >

                      <span
                        style="
                          color:#64748b;
                          font-size:10px;
                        "
                      >
                        Area
                      </span>

                      <span
                        style="
                          color:#f1f5f9;
                          font-size:11px;
                          font-weight:700;
                        "
                      >
                        ${areaKm2.toFixed(4)}
                        km²
                      </span>

                    </div>


                    <div
                      style="
                        color:#64748b;

                        font-size:9px;

                        text-align:right;

                        margin-top:2px;
                      "
                    >
                      ${Math.round(
                        area
                      ).toLocaleString()} m²
                    </div>

                  </div>
                  `,

                  {
                    className:
                      'dark-popup',

                    maxWidth:
                      280,

                    closeButton:
                      true,

                  }

                )


                // ==================================================
                // HOVER EFFECT
                // ==================================================

                layer.on({

                  mouseover: e => {

                    e.target.setStyle({

                      fillOpacity:
                        0.24,

                      weight:
                        3,

                      color:
                        '#ff4d6d',

                    })

                    e.target.bringToFront()

                  },


                  mouseout: e => {

                    e.target.setStyle({

                      fillOpacity:
                        0.07,

                      weight:
                        2.2,

                      color:
                        '#ff1744',

                    })

                  },


                  click: e => {

                    e.target.bringToFront()

                  }

                })

              }}

            />

          )}


        {/* ====================================================
            SCALE
            ==================================================== */}

        <ScaleControl

          position="bottomleft"

          imperial={false}

          metric={true}

          maxWidth={120}

        />


        {/* ====================================================
            FIT DETECTION AREA
            ==================================================== */}

        <FitBounds
          bbox={bbox}
        />


      </MapContainer>


      {/* ======================================================
          MAP STYLES
          ====================================================== */}

      <style>{`

        .dark-popup
          .leaflet-popup-content-wrapper {

          background:
            transparent !important;

          border:
            none !important;

          box-shadow:
            none !important;

          padding:
            0 !important;

          border-radius:
            11px !important;

        }


        .dark-popup
          .leaflet-popup-content {

          margin:
            0 !important;

        }


        .dark-popup
          .leaflet-popup-tip-container {

          display:
            none !important;

        }


        /* ----------------------------------------------
           Zoom controls
        ---------------------------------------------- */

        .leaflet-control-zoom {

          border:
            1px solid
            rgba(51,65,85,.85)
            !important;

          border-radius:
            11px !important;

          overflow:
            hidden !important;

          box-shadow:
            0 8px 25px
            rgba(0,0,0,.35)
            !important;

        }


        .leaflet-control-zoom a {

          background:
            rgba(9,15,27,.94)
            !important;

          color:
            #94a3b8
            !important;

          width:
            32px !important;

          height:
            32px !important;

          line-height:
            32px !important;

          border:
            none !important;

          transition:
            all .15s ease;

        }


        .leaflet-control-zoom a:hover {

          background:
            rgba(30,41,59,.98)
            !important;

          color:
            #22d3ee
            !important;

        }


        /* ----------------------------------------------
           Scale control
        ---------------------------------------------- */

        .leaflet-control-scale {

          background:
            rgba(9,15,27,.85)
            !important;

          border:
            1px solid
            rgba(51,65,85,.75)
            !important;

          color:
            #94a3b8
            !important;

          padding:
            2px 5px !important;

          border-radius:
            5px !important;

          font-size:
            9px !important;

          backdrop-filter:
            blur(6px);

        }


        .leaflet-control-scale-line {

          border:
            1px solid
            #94a3b8 !important;

          border-top:
            none !important;

          color:
            #cbd5e1 !important;

          background:
            transparent !important;

        }


        /* ----------------------------------------------
           Better map rendering
        ---------------------------------------------- */

        .leaflet-container {

          background:
            #07101a !important;

          font-family:
            Arial,
            sans-serif;

        }


        .leaflet-tile {

          image-rendering:
            auto;

        }


        /* ----------------------------------------------
           Attribution
        ---------------------------------------------- */

        .leaflet-control-attribution {

          background:
            rgba(9,15,27,.75)
            !important;

          color:
            #64748b
            !important;

          font-size:
            8px !important;

          backdrop-filter:
            blur(4px);

        }


        .leaflet-control-attribution a {

          color:
            #94a3b8
            !important;

        }

      `}</style>

    </div>

  )

}