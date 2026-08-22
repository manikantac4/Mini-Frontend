import { useState, useEffect, useRef, useCallback } from 'react'

// ── Nominatim geocoder ────────────────────────────────────────
// Free OSM geocoder, no API key needed, works in browser
async function searchPlaces(query) {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&limit=6&addressdetails=1&extratags=1`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' }
  })
  return res.json()
}

// ── Format display name ───────────────────────────────────────
function formatPlace(item) {
  const a = item.address || {}
  const primary =
    a.city || a.town || a.village || a.county ||
    a.state_district || a.state || item.name || ''
  const secondary = [a.state, a.country].filter(Boolean).join(', ')
  return { primary, secondary, type: item.type || item.class || '' }
}

// ── bbox from Nominatim boundingbox [s,n,w,e] → [w,s,e,n] ───
function toBbox(bb) {
  // bb = ["lat_min","lat_max","lon_min","lon_max"]  (s,n,w,e)
  return [
    parseFloat(bb[2]), // west  (lon_min)
    parseFloat(bb[0]), // south (lat_min)
    parseFloat(bb[3]), // east  (lon_max)
    parseFloat(bb[1]), // north (lat_max)
  ]
}

// ── Type icon ─────────────────────────────────────────────────
function PlaceTypeIcon({ type }) {
  const icons = {
    city:             'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    town:             'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    village:          'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    administrative:   'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
    water:            'M3 12 C5 8 8 6 12 6 C16 6 19 8 21 12',
    reservoir:        'M3 12 C5 8 8 6 12 6 C16 6 19 8 21 12',
    default:          'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
  }
  const d = icons[type] || icons.default
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d={d}/>
    </svg>
  )
}

export default function AISidebar({
  onDetect, loading, error, result,
  bbox, setBbox, activeCity, setActiveCity,
  hasResult, onOpenReport,
}) {
  const [query,        setQuery]        = useState('')
  const [suggestions,  setSuggestions]  = useState([])
  const [searching,    setSearching]    = useState(false)
  const [searchError,  setSearchError]  = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected,     setSelected]     = useState(null)
  const [tab,          setTab]          = useState('search') // 'search' | 'model'

  const inputRef    = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  // ── Debounced live search ──────────────────────────────────
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setSearchError(null)
      try {
        const results = await searchPlaces(query)
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } catch {
        setSearchError('Search unavailable')
        setShowDropdown(false)
      } finally {
        setSearching(false)
      }
    }, 380)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // ── Close dropdown on outside click ───────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current    && !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Select a suggestion ────────────────────────────────────
  const handleSelect = useCallback((item) => {
    const { primary } = formatPlace(item)
    const newBbox = toBbox(item.boundingbox)
    const placeName = primary || item.display_name?.split(',')[0] || 'Unknown'

    setSelected(item)
    setQuery(item.display_name?.split(',').slice(0,2).join(', ') || placeName)
    setShowDropdown(false)
    setActiveCity(placeName)
    setBbox(newBbox)
  }, [setActiveCity, setBbox])

  // ── Run detection on selected place ───────────────────────
  const handleDetect = useCallback(() => {
    if (!selected && !bbox) return
    onDetect({ place: activeCity, bbox })
  }, [selected, bbox, activeCity, onDetect])

  // ── Clear search ───────────────────────────────────────────
  const handleClear = () => {
    setQuery('')
    setSelected(null)
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const hasSelection = !!selected || !!activeCity

  return (
    <aside className="w-[300px] shrink-0 bg-[#0b0f18] border-r border-slate-800/50
                      flex flex-col h-full overflow-hidden">

      {/* ── Brand header ────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20
                          flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round">
              <rect x="2" y="2" width="8" height="8" rx="1.5"/>
              <rect x="14" y="2" width="8" height="8" rx="1.5"/>
              <rect x="2" y="14" width="8" height="8" rx="1.5"/>
              <rect x="14" y="14" width="8" height="8" rx="1.5"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white tracking-wider
                          uppercase leading-none">HydroDetect</p>
            <p className="text-[10px] text-slate-600 mt-0.5 tracking-widest uppercase">
              U-Net AI Model
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"/>
            <span className="text-[10px] text-violet-500 font-medium">AI</span>
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          {[
            { label: 'U-Net',     color: 'text-violet-400 bg-violet-950/50 border-violet-900/50' },
            { label: 'ResNet-34', color: 'text-indigo-400 bg-indigo-950/50 border-indigo-900/50' },
            { label: 'OSM',       color: 'text-slate-400  bg-slate-800/50  border-slate-700/40'  },
          ].map(b => (
            <span key={b.label}
              className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold border ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="flex mx-3 mt-3 mb-0 bg-slate-900/60 rounded-xl p-1 gap-0.5">
        {[['search','Search'], ['model','Model Info']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider
                        transition-all rounded-lg
                        ${tab === key
                          ? 'text-white bg-slate-700/80'
                          : 'text-slate-600 hover:text-slate-400'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: SEARCH ─────────────────────────────────────── */}
      {tab === 'search' && (
        <div className="flex-1 flex flex-col min-h-0 px-3 pt-3 pb-2 overflow-hidden">

          {/* ── Big search box ── */}
          <div className="relative mb-3">
            <div className={`relative flex items-center rounded-xl border
                             transition-all duration-200
                             ${showDropdown
                               ? 'border-violet-600/70 bg-slate-800/80 rounded-b-none'
                               : 'border-slate-700/60 bg-slate-900/60'
                             }
                             focus-within:border-violet-600/70
                             focus-within:bg-slate-800/80`}>

              {/* Search icon */}
              <div className="pl-3.5 pr-2 shrink-0">
                {searching ? (
                  <svg className="animate-spin" width="15" height="15"
                       viewBox="0 0 24 24" fill="none"
                       stroke="#7c3aed" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                       stroke={query ? '#a78bfa' : '#475569'}
                       strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder="Search any city, region, lake…"
                className="flex-1 py-3 pr-3 text-[13px] bg-transparent
                           text-slate-200 placeholder-slate-600
                           focus:outline-none"
              />

              {/* Clear button */}
              {query && (
                <button onClick={handleClear}
                  className="pr-3 text-slate-600 hover:text-slate-300 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {/* ── Dropdown suggestions ── */}
            {showDropdown && (
              <div ref={dropdownRef}
                className="absolute left-0 right-0 z-50
                           bg-slate-800/98 border border-violet-600/50
                           border-t-0 rounded-b-xl
                           shadow-[0_8px_32px_rgba(0,0,0,0.6)]
                           overflow-hidden">
                {suggestions.map((item, i) => {
                  const { primary, secondary, type } = formatPlace(item)
                  return (
                    <button key={item.place_id || i}
                      onMouseDown={e => { e.preventDefault(); handleSelect(item) }}
                      className="w-full text-left px-4 py-3 flex items-start gap-3
                                 border-b border-slate-700/40 last:border-0
                                 hover:bg-violet-900/30 transition-colors group">
                      {/* Place type dot */}
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-slate-700/60
                                      border border-slate-600/40 flex items-center
                                      justify-center shrink-0 text-slate-500
                                      group-hover:text-violet-400 group-hover:border-violet-800/60
                                      transition-colors">
                        <PlaceTypeIcon type={type}/>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-200
                                       truncate group-hover:text-white">
                          {primary || item.display_name?.split(',')[0]}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {secondary}
                        </p>
                      </div>

                      {/* Type badge */}
                      {type && (
                        <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[8px]
                                         font-mono font-semibold uppercase
                                         text-slate-600 bg-slate-700/50
                                         group-hover:text-violet-500">
                          {type}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* No results */}
            {!searching && !showDropdown && query.length >= 2 && suggestions.length === 0 && (
              <div className="mt-2 px-4 py-3 rounded-xl bg-slate-900/40
                              border border-slate-800/40 text-center">
                <p className="text-[11px] text-slate-600">
                  No places found for "<span className="text-slate-400">{query}</span>"
                </p>
              </div>
            )}

            {searchError && (
              <p className="mt-1.5 text-[10px] text-red-400 px-1">{searchError}</p>
            )}
          </div>

          {/* ── Selected place card ── */}
          {hasSelection && !showDropdown && (
            <div className="mb-3 px-4 py-3.5 rounded-xl
                            bg-violet-950/30 border border-violet-800/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                         stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    <span className="text-[9px] font-semibold text-violet-500
                                     uppercase tracking-widest">Selected</span>
                  </div>
                  <p className="text-[14px] font-bold text-white truncate">
                    {activeCity}
                  </p>
                </div>
                <button onClick={handleClear}
                  className="text-slate-600 hover:text-slate-400 transition-colors shrink-0 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* BBox display */}
              <div className="mt-2.5 grid grid-cols-4 gap-1">
                {['W','S','E','N'].map((dir, i) => (
                  <div key={dir}
                    className="bg-slate-900/60 rounded-lg px-1.5 py-1.5 text-center">
                    <p className="text-[8px] text-slate-600 uppercase tracking-widest">{dir}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {bbox[i]?.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Prompt when nothing selected ── */}
          {!hasSelection && !query && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3
                            text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/60
                              border border-slate-800/40
                              flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="#475569" strokeWidth="1.4" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-500 mb-1">
                  Search any location
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Type a city, reservoir, river basin,
                  or any region worldwide
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                {['Tirupati', 'Hussain Sagar', 'Kolleru Lake', 'Krishna Delta'].map(hint => (
                  <button key={hint}
                    onClick={() => { setQuery(hint); inputRef.current?.focus() }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium
                               text-slate-600 bg-slate-800/60 border border-slate-700/40
                               hover:text-violet-400 hover:border-violet-800/60
                               transition-colors">
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Spacer ── */}
          <div className="flex-1"/>
        </div>
      )}

      {/* ── Tab: MODEL INFO ─────────────────────────────────── */}
      {tab === 'model' && (
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-2 space-y-3">
          <div className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase
                           tracking-widest mb-3">Architecture</p>
            <div className="space-y-2">
              {[
                ['Model',      'U-Net'],
                ['Encoder',    'ResNet-34'],
                ['Framework',  'PyTorch'],
                ['Input size', '512×512 tiles'],
                ['Classes',    'Water / Non-water'],
                ['Backend',    'localhost:5000'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center
                                        border-b border-slate-800/40 pb-2
                                        last:border-0 last:pb-0">
                  <span className="text-[11px] text-slate-500">{k}</span>
                  <span className="text-[11px] text-slate-300 font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-violet-950/20 border border-violet-900/30 rounded-xl p-3.5">
            <p className="text-[10px] font-semibold text-violet-400 uppercase
                           tracking-widest mb-2">How It Works</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The U-Net model tiles the selected region, runs semantic
              segmentation on each 512×512 patch, stitches the results
              together, then vectorizes pixel masks into GeoJSON polygons
              with area statistics.
            </p>
          </div>
        </div>
      )}

      {/* ── Result summary ──────────────────────────────────── */}
      {result && !loading && (
        <div className="mx-3 mb-2 px-3.5 py-3 rounded-xl
                        bg-violet-950/30 border border-violet-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-violet-400
                             uppercase tracking-wider">Detection Complete</span>
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"/>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Bodies</p>
              <p className="text-lg font-bold text-white font-mono leading-tight">
                {result.statistics?.water_body_count ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Area</p>
              <p className="text-lg font-bold text-violet-300 font-mono leading-tight">
                {result.statistics?.water_area_sqkm?.toFixed(3) ?? '—'}
                <span className="text-[9px] text-slate-500 ml-1">km²</span>
              </p>
            </div>
          </div>
          <button onClick={onOpenReport}
            className="w-full py-1.5 rounded-lg text-[11px] font-semibold
                       bg-slate-800/60 border border-slate-700/50 text-slate-300
                       hover:text-white hover:bg-slate-700/60 transition-all
                       flex items-center justify-center gap-1.5">
            View Full Report
          </button>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl
                        bg-red-950/30 border border-red-900/40">
          <div className="flex items-start gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="#f87171" strokeWidth="2" strokeLinecap="round"
                 className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* ── Detect button ───────────────────────────────────── */}
      <div className="p-3 border-t border-slate-800/50">
        <button
          onClick={handleDetect}
          disabled={loading || !hasSelection}
          className="w-full py-2.5 rounded-xl text-[13px] font-bold tracking-wide
                     transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     active:scale-[0.98] text-white
                     bg-gradient-to-r from-violet-700 to-violet-600
                     hover:from-violet-600 hover:to-violet-500
                     shadow-[0_0_24px_rgba(139,92,246,0.2)]
                     hover:shadow-[0_0_32px_rgba(139,92,246,0.35)]
                     flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin" width="15" height="15"
                   viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              <span>Running U-Net...</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="2" width="8" height="8" rx="1.5"/>
                <rect x="14" y="2" width="8" height="8" rx="1.5"/>
                <rect x="2" y="14" width="8" height="8" rx="1.5"/>
                <rect x="14" y="14" width="8" height="8" rx="1.5"/>
              </svg>
              <span>{hasSelection ? 'Run AI Detection' : 'Search a location first'}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}