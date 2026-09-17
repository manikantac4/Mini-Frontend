import { useEffect, useState } from 'react'

// ================================================================
// TOAST NOTIFICATION
//
// Fired whenever a new map viewport finishes auto-analyzing, e.g.
// "New viewport analyzed · 4 water bodies · 12.3 km²". Stacks
// multiple toasts, auto-dismisses each after `duration` ms.
// ================================================================

let idCounter = 0

export function useViewportToasts() {
  const [toasts, setToasts] = useState([])

  const pushToast = (message, tone = 'info', duration = 4200) => {
    const id = ++idCounter
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }

  return { toasts, pushToast }
}

const TONE_STYLES = {
  info: { border: '#bae6fd', bg: '#f0f9ff', dot: '#0284c7', text: '#0c4a6e' },
  success: { border: '#bbf7d0', bg: '#f0fdf4', dot: '#16a34a', text: '#14532d' },
  error: { border: '#fecaca', bg: '#fef2f2', dot: '#dc2626', text: '#7f1d1d' },
}

export default function ViewportToastStack({ toasts }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 4000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 340,
      }}
    >
      {toasts.map((t) => {
        const tone = TONE_STYLES[t.tone] || TONE_STYLES.info
        return (
          <ToastItem key={t.id} message={t.message} tone={tone} />
        )
      })}
    </div>
  )
}

function ToastItem({ message, tone }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 12,
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
        transform: entered ? 'translateX(0)' : 'translateX(24px)',
        opacity: entered ? 1 : 0,
        transition: 'all 220ms ease',
      }}
    >
      <span
        style={{
          marginTop: 5,
          width: 7,
          height: 7,
          borderRadius: 999,
          background: tone.dot,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12.5, color: tone.text, lineHeight: 1.4, fontWeight: 500 }}>
        {message}
      </span>
    </div>
  )
}
