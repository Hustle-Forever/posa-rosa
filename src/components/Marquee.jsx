import { useEffect, useRef } from 'react'

// Enough copies that one copy can scroll off while the rest still cover
// any viewport up to ~5x the copy width (covers 4K screens).
const COPIES = 6

/**
 * Infinite marquee driven by requestAnimationFrame instead of a CSS
 * animation. The transform wraps with a modulo at exactly one copy width,
 * so the loop is seamless by construction and can never stall the way
 * compositor-driven animations can inside position:fixed containers
 * (a known iOS Safari issue).
 *
 * speed is in CSS px per second.
 */
export default function Marquee({ text, speed = 60, spanStyle, trackStyle }) {
  const trackRef = useRef(null)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    let raf
    let x = 0
    let last = performance.now()

    const tick = now => {
      // Clamp dt so a background tab doesn't fast-forward on return
      const dt = Math.min(now - last, 100) / 1000
      last = now
      const copyWidth = el.scrollWidth / COPIES
      x -= speed * dt
      if (copyWidth > 0) x = -(-x % copyWidth)
      el.style.transform = `translate3d(${x}px, 0, 0)`
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [speed])

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        whiteSpace: 'nowrap',
        willChange: 'transform',
        ...trackStyle,
      }}
    >
      {Array.from({ length: COPIES }, (_, i) => (
        <span key={i} style={spanStyle}>{text}</span>
      ))}
    </div>
  )
}
