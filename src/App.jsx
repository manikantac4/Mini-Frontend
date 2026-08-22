import { useState } from 'react'

// In your real project, keep these two lines and delete the placeholder
// components defined further below — they only exist here so this file
// can preview standalone.
// import TraditionalApp from './TraditionalApp'
// import AIApp from './AIApp'

const FONT_STACK =
  "'Product Sans', 'Google Sans', 'Söhne', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export default function App() {
  const [mode, setMode] = useState(null) // null | 'traditional' | 'ai'

  if (mode === 'traditional') return <TraditionalApp onBack={() => setMode(null)} />
  if (mode === 'ai')          return <AIApp          onBack={() => setMode(null)} />

  return (
    <div
      className="min-h-screen w-screen bg-black flex items-center justify-center p-2 sm:p-4"
      style={{ fontFamily: FONT_STACK }}
    >
      {/* ── Outer bezel: rounded corners, black border, image sits beneath ── */}
      <div className="relative w-full min-h-[calc(100vh-16px)] sm:min-h-[calc(100vh-32px)]
                      rounded-[20px] sm:rounded-[32px] overflow-hidden
                      border-[3px] border-black
                      shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_80px_-20px_rgba(0,0,0,0.9)]">

        {/* Background photograph layer — swap the urls for your real assets */}
        {/* Mobile (< sm breakpoint) */}
        <div
          className="absolute inset-0 bg-[#050b14] block sm:hidden"
          style={{
            backgroundImage: "url('/assets/mobilebackground.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Tablet / desktop (>= sm breakpoint) */}
        <div
          className="absolute inset-0 bg-[#050b14] hidden sm:block"
          style={{
            backgroundImage: "url('/assets/background.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Legibility scrim over the photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/96 via-[#060c16]/93 to-[#050b14]/97" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050b14]/40 via-transparent to-[#050b14]/40" />

        {/* Topographic contour texture — signature motif (elevation/water-line data) */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" preserveAspectRatio="none">
          <defs>
            <pattern id="contours" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M0 60 Q30 20 60 60 T120 60" fill="none" stroke="#22d3ee" strokeWidth="0.6"/>
              <path d="M0 90 Q30 50 60 90 T120 90" fill="none" stroke="#22d3ee" strokeWidth="0.6"/>
              <path d="M0 30 Q30 -10 60 30 T120 30" fill="none" stroke="#22d3ee" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contours)"/>
        </svg>

        {/* Fine grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.035]">
          <defs>
            <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>

        {/* Ambient glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                        rounded-full opacity-[0.08] pointer-events-none"
             style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}/>
        <div className="absolute bottom-0 right-0 w-[420px] h-[320px]
                        rounded-full opacity-[0.06] pointer-events-none"
             style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}/>

        {/* Scanning sweep — signature animation, evokes a satellite imaging pass */}
        <div className="absolute inset-x-0 h-32 pointer-events-none animate-[scan_9s_linear_infinite]"
             style={{ background: 'linear-gradient(to bottom, transparent, rgba(34,211,238,0.05), transparent)' }}/>

        {/* ── HUD corner readouts ── */}
        <div className="hidden sm:flex absolute top-5 left-6 items-center gap-2 text-[9px]
                        font-mono tracking-widest text-slate-500 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>
          SYS · HYDRODETECT v2.4
        </div>
        <div className="hidden sm:block absolute top-5 right-6 text-[9px] font-mono
                        tracking-widest text-slate-500 z-10">
          16.5062°N&nbsp;&nbsp;80.6480°E
        </div>
        <div className="hidden sm:block absolute bottom-5 left-6 text-[9px] font-mono
                        tracking-widest text-slate-600 z-10">
          REGION · ANDHRA&nbsp;PRADESH&nbsp;/&nbsp;TELANGANA
        </div>
        <div className="hidden sm:flex absolute bottom-5 right-6 items-center gap-1.5 text-[9px]
                        font-mono tracking-widest text-slate-600 z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
          FEED ACTIVE
        </div>

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-col items-center justify-center
                        min-h-[calc(100vh-16px)] sm:min-h-[calc(100vh-32px)] px-5 py-16">

          {/* Logo / brand */}
          <div className="flex flex-col items-center mb-14">
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
                <p className="text-[18px] font-bold text-white tracking-widest uppercase leading-none">
                  HydroDetect
                </p>
                <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">
                  Water Body Extraction System
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-center">
              {['Sentinel-2', 'NDWI', 'U-Net AI', 'GEE'].map(tag => (
                <span key={tag}
                  className="px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold
                             border text-slate-400 bg-slate-800/40 border-slate-700/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-[13px] font-semibold text-slate-400 uppercase tracking-[0.28em] mb-3">
              Select Detection Method
            </h1>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent mx-auto"/>
          </div>

          {/* Method cards */}
          <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">

            {/* Traditional card */}
            <button
              onClick={() => setMode('traditional')}
              className="flex-1 group relative text-left p-6 rounded-2xl
                         bg-slate-900/70 backdrop-blur-sm border border-slate-700/60
                         hover:border-cyan-600/60 hover:bg-slate-800/80
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70
                         transition-all duration-300 active:scale-[0.98]
                         shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                              transition-opacity duration-300 pointer-events-none"
                   style={{ background: 'radial-gradient(ellipse at top left, rgba(6,182,212,0.08) 0%, transparent 70%)' }}/>

              <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60
                              flex items-center justify-center mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6M9 12h6M9 15h4"/>
                </svg>
              </div>

              <p className="text-[11px] font-semibold text-cyan-400 uppercase tracking-widest mb-1.5">
                Traditional Method
              </p>
              <h2 className="text-[16px] font-bold text-white mb-2 leading-tight">
                NDWI + MNDWI
              </h2>
              <p className="text-[12px] text-slate-400 leading-relaxed mb-5">
                Index-based water detection using Sentinel-2 spectral bands via Google Earth Engine.
              </p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {['NDWI', 'MNDWI', 'Sentinel-2', 'GEE'].map(t => (
                  <span key={t}
                    className="px-2 py-0.5 text-[9px] font-mono font-semibold rounded-md
                               border text-cyan-400 bg-cyan-950/40 border-cyan-800/50">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold
                              text-slate-400 group-hover:text-cyan-300 transition-colors">
                <span>Launch</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </button>

            {/* Divider */}
            <div className="hidden sm:flex flex-col items-center justify-center gap-2 shrink-0">
              <div className="w-px flex-1 bg-slate-700/60"/>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-1 py-1">
                or
              </span>
              <div className="w-px flex-1 bg-slate-700/60"/>
            </div>

            {/* AI card */}
            <button
              onClick={() => setMode('ai')}
              className="flex-1 group relative text-left p-6 rounded-2xl
                         bg-slate-900/70 backdrop-blur-sm border border-slate-700/60
                         hover:border-violet-600/60 hover:bg-slate-800/80
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70
                         transition-all duration-300 active:scale-[0.98]
                         shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                              transition-opacity duration-300 pointer-events-none"
                   style={{ background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.1) 0%, transparent 70%)' }}/>

              <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px]
                              font-bold text-violet-300 bg-violet-950/70 border border-violet-700/60
                              uppercase tracking-widest">
                AI
              </div>

              <div className="w-10 h-10 rounded-xl bg-violet-950/60 border border-violet-800/60
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

              <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-widest mb-1.5">
                AI Method
              </p>
              <h2 className="text-[16px] font-bold text-white mb-2 leading-tight">
                U-Net Deep Learning
              </h2>
              <p className="text-[12px] text-slate-400 leading-relaxed mb-5">
                Semantic segmentation model trained on satellite imagery for precise water body detection.
              </p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {['U-Net', 'PyTorch', 'ResNet-34', 'Local'].map(t => (
                  <span key={t}
                    className="px-2 py-0.5 text-[9px] font-mono font-semibold rounded-md
                               border text-violet-400 bg-violet-950/40 border-violet-800/50">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold
                              text-slate-400 group-hover:text-violet-300 transition-colors">
                <span>Launch</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     className="group-hover:translate-x-0.5 transition-transform">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Footer */}
          <p className="mt-14 text-[10px] text-slate-500 tracking-widest uppercase text-center">
            Andhra Pradesh · Telangana · Water Bodies
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: -8rem; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   Placeholder components for standalone preview only.
   Delete these and use your real `TraditionalApp` / `AIApp` imports
   at the top of the file in your actual project.
   ──────────────────────────────────────────────────────────────── */
function TraditionalApp({ onBack }) {
  return (
    <div className="min-h-screen w-screen bg-[#050b14] text-white flex items-center
                    justify-center flex-col gap-4" style={{ fontFamily: FONT_STACK }}>
      <p className="text-sm tracking-widest uppercase text-cyan-400">Traditional Method</p>
      <button onClick={onBack}
        className="px-4 py-2 rounded-lg border border-slate-700 text-sm hover:bg-slate-800">
        ← Back
      </button>
    </div>
  )
}
function AIApp({ onBack }) {
  return (
    <div className="min-h-screen w-screen bg-[#050b14] text-white flex items-center
                    justify-center flex-col gap-4" style={{ fontFamily: FONT_STACK }}>
      <p className="text-sm tracking-widest uppercase text-violet-400">AI Method</p>
      <button onClick={onBack}
        className="px-4 py-2 rounded-lg border border-slate-700 text-sm hover:bg-slate-800">
        ← Back
      </button>
    </div>
  )
}