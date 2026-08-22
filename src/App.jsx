import { useState } from 'react'
import TraditionalApp from './TraditionalApp'
import AIApp from './AIApp'

export default function App() {
  const [mode, setMode] = useState(null) // null | 'traditional' | 'ai'

  if (mode === 'traditional') return <TraditionalApp onBack={() => setMode(null)} />
  if (mode === 'ai')          return <AIApp          onBack={() => setMode(null)} />

  return (
    <div className="min-h-screen w-screen bg-[#080c14] flex flex-col
                    items-center justify-center px-4 overflow-hidden relative">

      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2
                        w-[600px] h-[600px] rounded-full opacity-[0.07]"
             style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}/>
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px]
                        rounded-full opacity-[0.04]"
             style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}/>
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]"
             xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* ── Logo / brand ── */}
      <div className="relative z-10 flex flex-col items-center mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25
                          flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 12 C5 8, 8 6, 12 6 C16 6, 19 8, 21 12"/>
              <path d="M3 16 C5 12, 8 10, 12 10 C16 10, 19 12, 21 16"/>
              <path d="M3 20 C5 16, 8 14, 12 14 C16 14, 19 16, 21 20"/>
            </svg>
          </div>
          <div>
            <p className="text-[18px] font-bold text-white tracking-widest uppercase
                          leading-none">
              HydroDetect
            </p>
            <p className="text-[10px] text-slate-600 tracking-widest uppercase mt-0.5">
              Water Body Extraction System
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {['Sentinel-2', 'NDWI', 'U-Net AI', 'GEE'].map(tag => (
            <span key={tag}
              className="px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold
                         border text-slate-500 bg-slate-800/40 border-slate-700/40">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Heading ── */}
      <div className="relative z-10 text-center mb-12">
        <h1 className="text-[13px] font-semibold text-slate-500 uppercase
                       tracking-[0.25em] mb-3">
          Select Detection Method
        </h1>
        <div className="w-12 h-px bg-gradient-to-r from-transparent
                        via-slate-600 to-transparent mx-auto"/>
      </div>

      {/* ── Method cards ── */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-5 w-full max-w-xl">

        {/* Traditional card */}
        <button
          onClick={() => setMode('traditional')}
          className="flex-1 group relative text-left p-6 rounded-2xl
                     bg-slate-900/60 border border-slate-800/70
                     hover:border-cyan-700/50 hover:bg-slate-800/70
                     transition-all duration-300 active:scale-[0.98]
                     shadow-lg overflow-hidden">

          {/* Hover glow */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                          transition-opacity duration-300 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at top left, rgba(6,182,212,0.06) 0%, transparent 70%)' }}/>

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-900/50
                          flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h6M9 12h6M9 15h4"/>
            </svg>
          </div>

          <p className="text-[11px] font-semibold text-cyan-500 uppercase
                        tracking-widest mb-1.5">
            Traditional Method
          </p>
          <h2 className="text-[16px] font-bold text-white mb-2 leading-tight">
            NDWI + MNDWI
          </h2>
          <p className="text-[12px] text-slate-500 leading-relaxed mb-5">
            Index-based water detection using Sentinel-2 spectral bands
            via Google Earth Engine.
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {['NDWI', 'MNDWI', 'Sentinel-2', 'GEE'].map(t => (
              <span key={t}
                className="px-2 py-0.5 text-[9px] font-mono font-semibold
                           rounded-md border text-cyan-500 bg-cyan-950/30
                           border-cyan-900/40">
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold
                          text-slate-500 group-hover:text-cyan-400 transition-colors">
            <span>Launch</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </button>

        {/* Divider */}
        <div className="hidden sm:flex flex-col items-center justify-center gap-2 shrink-0">
          <div className="w-px flex-1 bg-slate-800/60"/>
          <span className="text-[10px] text-slate-700 font-semibold uppercase
                           tracking-wider bg-[#080c14] px-1 py-1">
            or
          </span>
          <div className="w-px flex-1 bg-slate-800/60"/>
        </div>

        {/* AI card */}
        <button
          onClick={() => setMode('ai')}
          className="flex-1 group relative text-left p-6 rounded-2xl
                     bg-slate-900/60 border border-slate-800/70
                     hover:border-violet-700/50 hover:bg-slate-800/70
                     transition-all duration-300 active:scale-[0.98]
                     shadow-lg overflow-hidden">

          {/* Hover glow */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                          transition-opacity duration-300 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.08) 0%, transparent 70%)' }}/>

          {/* "NEW" badge */}
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px]
                          font-bold text-violet-300 bg-violet-950/60
                          border border-violet-800/50 uppercase tracking-widest">
            AI
          </div>

          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-900/50
                          flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="#a78bfa" strokeWidth="1.6" strokeLinecap="round">
              <rect x="2" y="2" width="8" height="8" rx="1.5"/>
              <rect x="14" y="2" width="8" height="8" rx="1.5"/>
              <rect x="2" y="14" width="8" height="8" rx="1.5"/>
              <rect x="14" y="14" width="8" height="8" rx="1.5"/>
              <path d="M10 6h4M6 10v4M18 10v4M10 18h4"/>
            </svg>
          </div>

          <p className="text-[11px] font-semibold text-violet-400 uppercase
                        tracking-widest mb-1.5">
            AI Method
          </p>
          <h2 className="text-[16px] font-bold text-white mb-2 leading-tight">
            U-Net Deep Learning
          </h2>
          <p className="text-[12px] text-slate-500 leading-relaxed mb-5">
            Semantic segmentation model trained on satellite imagery
            for precise water body detection.
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {['U-Net', 'PyTorch', 'ResNet-34', 'Local'].map(t => (
              <span key={t}
                className="px-2 py-0.5 text-[9px] font-mono font-semibold
                           rounded-md border text-violet-400 bg-violet-950/30
                           border-violet-900/40">
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold
                          text-slate-500 group-hover:text-violet-400 transition-colors">
            <span>Launch</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </button>
      </div>

      {/* ── Footer ── */}
      <p className="relative z-10 mt-14 text-[10px] text-slate-700 tracking-widest uppercase">
        Andhra Pradesh · Telangana · Water Bodies
      </p>
    </div>
  )
}