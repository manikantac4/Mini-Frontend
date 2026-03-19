import { useState } from 'react'
import {
  IconSatellite, IconLayers, IconSettings, IconMapPin,
  IconWater, IconCheck, IconLoader, IconAlertCircle,
  IconActivity, IconSearch
} from '../icons'

const CITIES = [
  { name: 'Vijayawada',  bbox: [80.4, 16.2, 81.0, 16.8], river: 'Krishna'        },
  { name: 'Rajahmundry', bbox: [81.6, 16.9, 82.2, 17.4], river: 'Godavari'       },
  { name: 'Guntur',      bbox: [80.2, 16.1, 80.6, 16.5], river: 'Krishna'        },
  { name: 'Vizag',       bbox: [83.1, 17.5, 83.5, 17.9], river: 'Bay of Bengal'  },
  { name: 'Hyderabad',   bbox: [78.2, 17.2, 78.8, 17.6], river: 'Musi'           },
  { name: 'Kakinada',    bbox: [82.1, 16.8, 82.4, 17.1], river: 'Godavari Delta' },
  { name: 'Amaravati',   bbox: [80.3, 16.4, 80.6, 16.6], river: 'Krishna'        },
  { name: 'Kurnool',     bbox: [78.0, 15.6, 78.4, 16.0], river: 'Tungabhadra'    },
]

const LAYER_CONFIG = [
  {
    key:   'boundaries',
    label: 'Water Boundaries',
    desc:  'Red polygon outlines',
    dot:   '#f43f5e',
  },
  {
    key:   'water_mask',
    label: 'Water Mask',
    desc:  'Blue filled raster',
    dot:   '#22d3ee',
  },
  {
    key:   'ndwi',
    label: 'NDWI Heatmap',
    desc:  'Index visualisation',
    dot:   '#818cf8',
  },
  {
    key:   'satellite',
    label: 'Satellite (GEE)',
    desc:  'Sentinel-2 RGB',
    dot:   '#94a3b8',
  },
]

function LayerRow({ config, enabled, onChange, disabled }) {
  return (
    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                       border transition-all duration-150 group
                       ${disabled
                         ? 'opacity-40 cursor-not-allowed'
                         : 'cursor-pointer'
                       }
                       ${enabled
                         ? 'bg-slate-800/70 border-slate-700/60'
                         : 'bg-transparent border-slate-800/40 hover:border-slate-700/50'
                       }`}>
      {/* Color indicator */}
      <span className="w-2 h-2 rounded-full shrink-0 transition-opacity"
            style={{
              background: config.dot,
              opacity: enabled ? 1 : 0.25
            }}/>

      <div className="flex-1 min-w-0">
        <p className={`text-[12px] font-medium leading-none truncate
                       ${enabled ? 'text-slate-200' : 'text-slate-500'}`}>
          {config.label}
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5 truncate">
          {config.desc}
        </p>
      </div>

      {/* Custom checkbox */}
      <div className={`w-[18px] h-[18px] rounded-md border flex items-center
                       justify-center shrink-0 transition-all duration-150
                       ${enabled
                         ? 'bg-cyan-500 border-cyan-400'
                         : 'bg-transparent border-slate-700'
                       }`}>
        {enabled && <IconCheck size={10} className="text-white"/>}
      </div>
      <input type="checkbox" className="sr-only"
             checked={enabled} disabled={disabled} onChange={onChange}/>
    </label>
  )
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2.5
                  text-[10px] font-semibold uppercase tracking-wider
                  transition-all rounded-lg
                  ${active
                    ? 'text-white bg-slate-700/80'
                    : 'text-slate-600 hover:text-slate-400'
                  }`}>
      <Icon size={15}/>
      {label}
    </button>
  )
}

export default function Sidebar({
  onDetect, loading, error, featureCount,
  bbox, setBbox, activeCity, setActiveCity,
  layers, toggleLayer, hasResult, onOpenReport,
}) {
  const [threshold,  setThreshold]  = useState(0.1)
  const [areaMin,    setAreaMin]     = useState(8000)
  const [tab,        setTab]         = useState('cities')
  const [search,     setSearch]      = useState('')

  const filteredCities = CITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCityClick = (city) => {
    setActiveCity(city.name)
    setBbox(city.bbox)
    onDetect({ bbox: city.bbox, threshold, area_min: areaMin })
  }

  return (
    <aside className="w-[268px] shrink-0 bg-[#0b0f18] border-r border-slate-800/50
                      flex flex-col h-full overflow-hidden">

      {/* ── Brand header ────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20
                          flex items-center justify-center shrink-0">
            <IconWater size={15} className="text-cyan-400"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white tracking-wider
                          uppercase leading-none">
              HydroDetect
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5 tracking-widest uppercase">
              Water Boundary System
            </p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[10px] text-emerald-500 font-medium">GEE</span>
          </div>
        </div>

        {/* Index badges */}
        <div className="flex gap-1.5 mt-3">
          {[
            { label: 'NDWI',       color: 'text-cyan-400   bg-cyan-950/50   border-cyan-900/50'   },
            { label: 'MNDWI',      color: 'text-violet-400 bg-violet-950/50 border-violet-900/50' },
            { label: 'Sentinel-2', color: 'text-slate-400  bg-slate-800/50  border-slate-700/40'  },
          ].map(b => (
            <span key={b.label}
              className={`px-2 py-0.5 rounded-md text-[9px] font-mono
                         font-semibold border ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="flex mx-3 mt-3 mb-2 bg-slate-900/60 rounded-xl p-1 gap-0.5">
        <TabBtn active={tab==='cities'}  onClick={()=>setTab('cities')}
                icon={IconMapPin}  label="Cities"/>
        <TabBtn active={tab==='layers'}  onClick={()=>setTab('layers')}
                icon={IconLayers}  label="Layers"/>
        <TabBtn active={tab==='params'}  onClick={()=>setTab('params')}
                icon={IconSettings} label="Params"/>
      </div>

      {/* ── Tab content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">

        {/* ── CITIES ── */}
        {tab === 'cities' && (
          <div className="space-y-1.5">
            {/* Search */}
            <div className="relative mb-3 mt-1">
              <IconSearch size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
              <input
                type="text"
                placeholder="Search city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800/60
                           rounded-xl pl-8 pr-3 py-2 text-xs text-slate-300
                           placeholder:text-slate-700 focus:outline-none
                           focus:border-cyan-800/60 transition-colors"
              />
            </div>

            {filteredCities.map((city) => {
              const isActive = activeCity === city.name
              return (
                <button key={city.name}
                  onClick={() => handleCityClick(city)}
                  disabled={loading}
                  className={`w-full text-left px-3.5 py-3 rounded-xl border
                             transition-all duration-150 group
                             disabled:opacity-40 disabled:cursor-not-allowed
                             ${isActive
                               ? 'bg-cyan-950/40 border-cyan-800/50'
                               : 'bg-transparent border-slate-800/40 hover:bg-slate-800/30 hover:border-slate-700/50'
                             }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <IconMapPin size={12}
                        className={isActive ? 'text-cyan-400' : 'text-slate-600'}/>
                      <span className={`text-[12px] font-semibold
                                        ${isActive ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {city.name}
                      </span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full
                                       bg-cyan-400 animate-pulse"/>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5 pl-[22px]">
                    {city.river}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {/* ── LAYERS ── */}
        {tab === 'layers' && (
          <div className="space-y-1.5 mt-1">
            {!hasResult && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl
                              bg-amber-950/20 border border-amber-900/30 mb-3">
                <IconAlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5"/>
                <p className="text-[11px] text-amber-500/80 leading-relaxed">
                  Run detection to unlock GEE layers
                </p>
              </div>
            )}

            <p className="text-[10px] font-semibold text-slate-600
                          uppercase tracking-widest px-1 mb-2 mt-1">
              Layer Visibility
            </p>

            {LAYER_CONFIG.map(config => (
              <LayerRow
                key={config.key}
                config={config}
                enabled={layers[config.key]}
                onChange={() => toggleLayer(config.key)}
                disabled={loading || (!hasResult && config.key !== 'satellite')}
              />
            ))}

            {/* NDWI Legend */}
            {hasResult && (
              <div className="mt-4 px-3 py-3 rounded-xl bg-slate-900/40
                              border border-slate-800/40">
                <p className="text-[10px] font-semibold text-slate-600
                               uppercase tracking-widest mb-2">
                  NDWI Scale
                </p>
                <div className="flex h-2 rounded-lg overflow-hidden mb-1.5">
                  {['#8B4513','#DAA520','#228B22','#00CED1','#0000FF'].map(c => (
                    <span key={c} className="flex-1" style={{ background: c }}/>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>− 0.3  Dry</span>
                  <span>+ 0.5  Water</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PARAMS ── */}
        {tab === 'params' && (
          <div className="space-y-3 mt-1 pb-1">

            {/* Threshold */}
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-300">
                    NDWI Threshold
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Sensitivity control
                  </p>
                </div>
                <span className="text-sm font-mono font-bold text-cyan-400
                                 bg-cyan-950/40 px-2 py-0.5 rounded-lg
                                 border border-cyan-900/40">
                  {threshold.toFixed(2)}
                </span>
              </div>
              <input type="range" min="-0.2" max="0.5" step="0.05"
                value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1"/>
              <div className="flex justify-between text-[9px] text-slate-700 mt-1.5">
                <span>More water</span>
                <span>Less water</span>
              </div>
            </div>

            {/* Min area */}
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-300">
                    Min Area
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Noise filter
                  </p>
                </div>
                <span className="text-sm font-mono font-bold text-violet-400
                                 bg-violet-950/40 px-2 py-0.5 rounded-lg
                                 border border-violet-900/40">
                  {(areaMin/1000).toFixed(0)}k m²
                </span>
              </div>
              <input type="range" min="1000" max="50000" step="1000"
                value={areaMin}
                onChange={e => setAreaMin(parseInt(e.target.value))}
                className="w-full accent-violet-500 h-1"/>
              <div className="flex justify-between text-[9px] text-slate-700 mt-1.5">
                <span>More detail</span>
                <span>Less noise</span>
              </div>
            </div>

            {/* BBox inputs */}
            <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3.5">
              <p className="text-[12px] font-semibold text-slate-300 mb-3">
                Bounding Box
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['West','South','East','North'].map((label, i) => (
                  <div key={label}>
                    <label className="text-[9px] text-slate-600 block mb-1
                                      uppercase tracking-widest">
                      {label}
                    </label>
                    <input type="number" step="0.01" value={bbox[i]}
                      onChange={e => {
                        const u = [...bbox]
                        u[i] = parseFloat(e.target.value)
                        setBbox(u)
                      }}
                      className="w-full bg-slate-800/60 border border-slate-700/50
                                 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300
                                 font-mono focus:outline-none
                                 focus:border-cyan-700/50 transition-colors"/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Result summary ──────────────────────────────────── */}
      {featureCount !== null && !loading && (
        <div className="mx-3 mb-2 px-3.5 py-3 rounded-xl
                        bg-emerald-950/30 border border-emerald-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconActivity size={13} className="text-emerald-400"/>
              <span className="text-[10px] font-semibold text-emerald-400
                               uppercase tracking-wider">
                Detection Complete
              </span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
          </div>
          <div className="flex items-end gap-1.5 mt-2">
            <span className="text-2xl font-bold text-white leading-none font-mono">
              {featureCount}
            </span>
            <span className="text-[11px] text-slate-500 mb-0.5">
              water bodies found
            </span>
          </div>
          <button onClick={onOpenReport}
            className="mt-2 w-full py-1.5 rounded-lg text-[11px] font-semibold
                       bg-slate-800/60 border border-slate-700/50 text-slate-300
                       hover:text-white hover:bg-slate-700/60 transition-all
                       flex items-center justify-center gap-1.5">
            <IconSearch size={11}/>
            View Full Report
          </button>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl
                        bg-red-950/30 border border-red-900/40">
          <div className="flex items-start gap-2">
            <IconAlertCircle size={13} className="text-red-400 shrink-0 mt-0.5"/>
            <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* ── Detect button ───────────────────────────────────── */}
      <div className="p-3 border-t border-slate-800/50">
        <button
          onClick={() => onDetect({ bbox, threshold, area_min: areaMin })}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-[13px] font-bold
                     tracking-wide transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] text-white
                     bg-gradient-to-r from-cyan-700 to-cyan-600
                     hover:from-cyan-600 hover:to-cyan-500
                     shadow-[0_0_24px_rgba(6,182,212,0.2)]
                     hover:shadow-[0_0_32px_rgba(6,182,212,0.35)]
                     flex items-center justify-center gap-2 group">
          {loading ? (
            <>
              <IconLoader size={15}/>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <IconSatellite size={15}/>
              <span>Run Detection</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}