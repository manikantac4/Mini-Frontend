import { useMemo } from 'react'

const Metric = ({ label, value, sub, accent = 'violet' }) => {
  const colors = {
    violet:  'text-violet-400',
    indigo:  'text-indigo-400',
    emerald: 'text-emerald-400',
    rose:    'text-rose-400',
    amber:   'text-amber-400',
  }
  return (
    <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-3.5">
      <p className="text-[10px] font-medium text-slate-500 uppercase
                    tracking-widest mb-1.5">{label}</p>
      <p className={`text-xl font-bold font-mono leading-none ${colors[accent]}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  )
}

const BarRow = ({ label, value, max, color }) => {
  const pct = Math.min(100, Math.max(0, (value / Math.max(max, 1)) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-mono">
          {typeof value === 'number' && value > 1000
            ? value.toLocaleString()
            : value}
        </span>
      </div>
      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
             style={{ width: `${pct}%`, background: color }}/>
      </div>
    </div>
  )
}

export default function AIReportPanel({ open, onClose, result, cityName }) {
  const stats = result?.statistics

  const geoStats = useMemo(() => {
    if (!result?.geojson?.features?.length) return null
    const features = result.geojson.features
    const areas    = features.map(f => f.properties?.area_m2 || 0)
    const total    = areas.reduce((a, b) => a + b, 0)
    const largest  = Math.max(...areas)
    const smallest = Math.min(...areas)
    const avg      = total / areas.length
    const largeCount = areas.filter(a => a > 100000).length
    const medCount   = areas.filter(a => a > 10000 && a <= 100000).length
    const smallCount = areas.filter(a => a <= 10000).length
    return {
      total, largest, smallest, avg,
      count: features.length,
      largeCount, medCount, smallCount,
      totalKm2:   (total   / 1e6).toFixed(4),
      largestKm2: (largest / 1e6).toFixed(4),
      avgKm2:     (avg     / 1e6).toFixed(4),
    }
  }, [result])

  const handleDownload = () => {
    if (!result?.geojson) return
    const blob = new Blob([JSON.stringify(result.geojson, null, 2)],
                          { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${cityName || 'water'}_unet_boundaries.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {open && (
        <div className="absolute inset-0 z-[1099] bg-black/20
                        backdrop-blur-[1px] lg:hidden"
             onClick={onClose}/>
      )}

      <div className={`absolute top-0 right-0 h-full z-[1100]
                       w-[340px] bg-[#0d1117] border-l border-slate-800/70
                       flex flex-col shadow-2xl
                       transition-transform duration-300 ease-out
                       ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-800/60
                        flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                   stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="2" width="8" height="8" rx="1.5"/>
                <rect x="14" y="2" width="8" height="8" rx="1.5"/>
                <rect x="2" y="14" width="8" height="8" rx="1.5"/>
                <rect x="14" y="14" width="8" height="8" rx="1.5"/>
              </svg>
              <span className="text-[10px] font-semibold text-violet-400
                               uppercase tracking-widest">
                AI Detection Report
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-tight">
              {cityName || 'Unknown Location'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              U-Net · ResNet-34 · Semantic Segmentation
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/50
                       flex items-center justify-center text-slate-400
                       hover:text-white hover:bg-slate-700/60 transition-all shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {!stats && !geoStats ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="#475569" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-xs text-slate-500 text-center">
                Run AI detection to generate report
              </p>
            </div>
          ) : (
            <>
              {/* Raw model stats (from backend JSON) */}
              {stats && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase
                                tracking-widest mb-3">
                    Model Output
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Metric label="Water Bodies"
                            value={stats.water_body_count ?? '—'}
                            sub="segments detected"
                            accent="violet"/>
                    <Metric label="Water Area"
                            value={`${stats.water_area_sqkm?.toFixed(3) ?? '—'}`}
                            sub="km² total"
                            accent="indigo"/>
                    <Metric label="Water Coverage"
                            value={`${stats.water_percentage?.toFixed(1) ?? '—'}%`}
                            sub="of AOI"
                            accent="emerald"/>
                    <Metric label="Largest Body"
                            value={`${stats.largest_water_body_sqkm?.toFixed(3) ?? '—'}`}
                            sub="km²"
                            accent="amber"/>
                  </div>
                </div>
              )}

              {/* Pixel stats */}
              {stats && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase
                                tracking-widest mb-3">
                    Pixel Statistics
                  </p>
                  <div className="bg-slate-900/60 border border-slate-800/50
                                  rounded-xl p-3.5 space-y-3">
                    <BarRow label="Water pixels"
                            value={stats.water_pixels ?? 0}
                            max={stats.total_pixels ?? 1}
                            color="#a78bfa"/>
                    <BarRow label="Total pixels"
                            value={stats.total_pixels ?? 0}
                            max={stats.total_pixels ?? 1}
                            color="#64748b"/>
                  </div>
                </div>
              )}

              {/* GeoJSON polygon stats */}
              {geoStats && (
                <>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase
                                  tracking-widest mb-3">
                      Size Distribution
                    </p>
                    <div className="bg-slate-900/60 border border-slate-800/50
                                    rounded-xl p-3.5 space-y-3">
                      <BarRow label="Large  (> 0.1 km²)"
                              value={geoStats.largeCount}
                              max={geoStats.count}
                              color="#a78bfa"/>
                      <BarRow label="Medium (0.01–0.1 km²)"
                              value={geoStats.medCount}
                              max={geoStats.count}
                              color="#818cf8"/>
                      <BarRow label="Small  (< 0.01 km²)"
                              value={geoStats.smallCount}
                              max={geoStats.count}
                              color="#34d399"/>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase
                                  tracking-widest mb-3">
                      Top 5 Largest Bodies
                    </p>
                    <div className="bg-slate-900/60 border border-slate-800/50
                                    rounded-xl overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-800/60">
                            <th className="text-left px-3.5 py-2 text-slate-600 font-medium">#</th>
                            <th className="text-right px-3.5 py-2 text-slate-600 font-medium">km²</th>
                            <th className="text-right px-3.5 py-2 text-slate-600 font-medium">m²</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.geojson.features
                            .slice()
                            .sort((a, b) =>
                              (b.properties?.area_m2 || 0) - (a.properties?.area_m2 || 0)
                            )
                            .slice(0, 5)
                            .map((f, i) => {
                              const a = f.properties?.area_m2 || 0
                              return (
                                <tr key={i}
                                  className="border-b border-slate-800/30 last:border-0
                                             hover:bg-slate-800/30 transition-colors">
                                  <td className="px-3.5 py-2.5 text-slate-500">{i + 1}</td>
                                  <td className="px-3.5 py-2.5 text-right text-violet-400 font-mono">
                                    {(a / 1e6).toFixed(4)}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-right text-slate-400 font-mono">
                                    {Math.round(a).toLocaleString()}
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Model parameters */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase
                              tracking-widest mb-3">
                  Model Parameters
                </p>
                <div className="bg-slate-900/60 border border-slate-800/50
                                rounded-xl p-3.5 space-y-2">
                  {[
                    ['Architecture', 'U-Net'],
                    ['Encoder',      'ResNet-34'],
                    ['Framework',    'PyTorch'],
                    ['Input size',   '512×512 px'],
                    ['Classes',      'Water / Non-water'],
                    ['Endpoint',     'localhost:5000/ai/detect-water'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center
                                            border-b border-slate-800/40 pb-2
                                            last:border-0 last:pb-0">
                      <span className="text-[11px] text-slate-500">{k}</span>
                      <span className="text-[11px] text-slate-300 font-mono
                                       text-right max-w-[160px] truncate">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        {(stats || geoStats) && (
          <div className="p-4 border-t border-slate-800/60 shrink-0">
            <button onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2
                         py-2.5 rounded-xl text-xs font-semibold
                         bg-slate-800 hover:bg-slate-700 border border-slate-700/60
                         hover:border-violet-700/50 text-slate-300 hover:text-white
                         transition-all active:scale-[0.98]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export GeoJSON
            </button>
          </div>
        )}
      </div>
    </>
  )
}