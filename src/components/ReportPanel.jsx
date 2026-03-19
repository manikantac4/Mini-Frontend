import { useMemo } from 'react'
import {
  IconX, IconWater, IconActivity, IconGrid,
  IconMaximize, IconDownload, IconInfo, IconMap
} from '../icons'

const Metric = ({ label, value, sub, accent = 'cyan' }) => {
  const colors = {
    cyan:    'text-cyan-400',
    violet:  'text-violet-400',
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
      {sub && (
        <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
      )}
    </div>
  )
}

const BarRow = ({ label, value, max, color }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
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

export default function ReportPanel({ open, onClose, data, cityName }) {
  const stats = useMemo(() => {
    if (!data?.features?.length) return null
    const features  = data.features
    const areas     = features.map(f => f.properties?.area_m2 || 0)
    const total     = areas.reduce((a, b) => a + b, 0)
    const largest   = Math.max(...areas)
    const smallest  = Math.min(...areas)
    const avgArea   = total / areas.length
    const largeCount = areas.filter(a => a > 100000).length
    const medCount   = areas.filter(a => a > 10000 && a <= 100000).length
    const smallCount = areas.filter(a => a <= 10000).length
    return {
      total, largest, smallest, avgArea,
      count: features.length,
      largeCount, medCount, smallCount,
      totalKm2:   (total   / 1e6).toFixed(4),
      largestKm2: (largest / 1e6).toFixed(4),
      avgKm2:     (avgArea / 1e6).toFixed(4),
    }
  }, [data])

  const handleDownload = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)],
                          { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${cityName || 'water'}_boundaries.geojson`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div className="absolute inset-0 z-[1099] bg-black/20
                        backdrop-blur-[1px] lg:hidden"
             onClick={onClose}/>
      )}

      {/* Panel */}
      <div className={`absolute top-0 right-0 h-full z-[1100]
                       w-[340px] bg-[#0d1117] border-l border-slate-800/70
                       flex flex-col shadow-2xl
                       transition-transform duration-300 ease-out
                       ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-800/60
                        flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IconMap size={14} className="text-cyan-400"/>
              <span className="text-[10px] font-semibold text-cyan-400
                               uppercase tracking-widest">
                Detection Report
              </span>
            </div>
            <h2 className="text-base font-bold text-white leading-tight">
              {cityName || 'Unknown Location'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sentinel-2 · NDWI + MNDWI · Nov 2023 – Mar 2024
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/60 border border-slate-700/50
                       flex items-center justify-center text-slate-400
                       hover:text-white hover:bg-slate-700/60 transition-all shrink-0">
            <IconX size={14}/>
          </button>
        </div>

        {/* ── Scrollable body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {!stats ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <IconInfo size={20} className="text-slate-600"/>
              <p className="text-xs text-slate-500 text-center">
                Run detection to generate report
              </p>
            </div>
          ) : (
            <>
              {/* ── Overview metrics ──────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconActivity size={13} className="text-slate-500"/>
                  <span className="text-[10px] font-semibold text-slate-500
                                   uppercase tracking-widest">
                    Overview
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Total Water Bodies"
                          value={stats.count}
                          sub="polygons detected"
                          accent="cyan"/>
                  <Metric label="Total Water Area"
                          value={`${stats.totalKm2}`}
                          sub="km² covered"
                          accent="emerald"/>
                  <Metric label="Largest Body"
                          value={`${stats.largestKm2}`}
                          sub="km²"
                          accent="violet"/>
                  <Metric label="Avg Body Size"
                          value={`${stats.avgKm2}`}
                          sub="km² average"
                          accent="amber"/>
                </div>
              </div>

              {/* ── Size distribution ─────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconGrid size={13} className="text-slate-500"/>
                  <span className="text-[10px] font-semibold text-slate-500
                                   uppercase tracking-widest">
                    Size Distribution
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/50
                                rounded-xl p-3.5 space-y-3">
                  <BarRow label="Large  (> 0.1 km²)"
                          value={stats.largeCount}
                          max={stats.count}
                          color="#06b6d4"/>
                  <BarRow label="Medium (0.01–0.1 km²)"
                          value={stats.medCount}
                          max={stats.count}
                          color="#a78bfa"/>
                  <BarRow label="Small  (< 0.01 km²)"
                          value={stats.smallCount}
                          max={stats.count}
                          color="#34d399"/>
                </div>
              </div>

              {/* ── Area breakdown ────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconWater size={13} className="text-slate-500"/>
                  <span className="text-[10px] font-semibold text-slate-500
                                   uppercase tracking-widest">
                    Area Breakdown
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/50
                                rounded-xl p-3.5 space-y-3">
                  <BarRow label="Total area (m²)"
                          value={Math.round(stats.total)}
                          max={stats.total}
                          color="#06b6d4"/>
                  <BarRow label="Largest body (m²)"
                          value={Math.round(stats.largest)}
                          max={stats.total}
                          color="#f43f5e"/>
                  <BarRow label="Smallest body (m²)"
                          value={Math.round(stats.smallest)}
                          max={stats.largest}
                          color="#34d399"/>
                </div>
              </div>

              {/* ── Detection parameters ──────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconInfo size={13} className="text-slate-500"/>
                  <span className="text-[10px] font-semibold text-slate-500
                                   uppercase tracking-widest">
                    Parameters Used
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/50
                                rounded-xl p-3.5 space-y-2">
                  {[
                    ['Dataset',    'Sentinel-2 SR Harmonized'],
                    ['Index',      'NDWI + MNDWI Dual'],
                    ['Period',     'Nov 2023 – Mar 2024'],
                    ['Resolution', '20m / pixel'],
                    ['Cloud cover','< 5%'],
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

              {/* ── Top 5 largest bodies ──────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <IconMaximize size={13} className="text-slate-500"/>
                  <span className="text-[10px] font-semibold text-slate-500
                                   uppercase tracking-widest">
                    Top 5 Largest Bodies
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/50
                                rounded-xl overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800/60">
                        <th className="text-left px-3.5 py-2 text-slate-600
                                       font-medium">#</th>
                        <th className="text-right px-3.5 py-2 text-slate-600
                                       font-medium">Area (km²)</th>
                        <th className="text-right px-3.5 py-2 text-slate-600
                                       font-medium">Area (m²)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.features
                        .slice()
                        .sort((a, b) =>
                          (b.properties?.area_m2 || 0) -
                          (a.properties?.area_m2 || 0)
                        )
                        .slice(0, 5)
                        .map((f, i) => {
                          const a = f.properties?.area_m2 || 0
                          return (
                            <tr key={i}
                              className="border-b border-slate-800/30
                                         last:border-0 hover:bg-slate-800/30
                                         transition-colors">
                              <td className="px-3.5 py-2.5 text-slate-500">
                                {i + 1}
                              </td>
                              <td className="px-3.5 py-2.5 text-right
                                             text-cyan-400 font-mono">
                                {(a / 1e6).toFixed(4)}
                              </td>
                              <td className="px-3.5 py-2.5 text-right
                                             text-slate-400 font-mono">
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
        </div>

        {/* ── Footer actions ───────────────────────────────────── */}
        {stats && (
          <div className="p-4 border-t border-slate-800/60 shrink-0">
            <button onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2
                         py-2.5 rounded-xl text-xs font-semibold
                         bg-slate-800 hover:bg-slate-700 border border-slate-700/60
                         hover:border-slate-600/60 text-slate-300 hover:text-white
                         transition-all active:scale-[0.98]">
              <IconDownload size={14}/>
              Export GeoJSON
            </button>
          </div>
        )}
      </div>
    </>
  )
}