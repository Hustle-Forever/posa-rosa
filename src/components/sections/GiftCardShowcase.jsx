import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function GiftCardShowcase() {
  const sectionRef = useRef(null)
  const cardRef    = useRef(null)   // receives rotateY from GSAP

  useEffect(() => {
    const mm = gsap.matchMedia()

    // Desktop: full 180-deg flip, 2× viewport scroll distance
    mm.add('(min-width: 769px)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(cardRef.current,
          { rotateY: -180 },
          {
            rotateY: 0,
            ease: 'none',
            scrollTrigger: {
              id: 'gc-pin-desktop',
              trigger: sectionRef.current,
              pin: true,
              anticipatePin: 1,
              scrub: 1,
              start: 'top top',
              end: () => '+=' + window.innerHeight * 2,
            },
          }
        )
      }, sectionRef)
      return () => ctx.revert()
    })

    // Mobile: same flip, shorter pin (1.5× viewport) for UX
    mm.add('(max-width: 768px)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(cardRef.current,
          { rotateY: -180 },
          {
            rotateY: 0,
            ease: 'none',
            scrollTrigger: {
              id: 'gc-pin-mobile',
              trigger: sectionRef.current,
              pin: true,
              anticipatePin: 1,
              scrub: 1,
              start: 'top top',
              end: () => '+=' + window.innerHeight * 1.5,
            },
          }
        )
      }, sectionRef)
      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        background: 'var(--color-bg)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        /* offset for fixed navbar+bar so content isn't hidden behind them */
        paddingTop: 'calc(var(--bar-h) + var(--nav-h))',
        boxSizing: 'border-box',
      }}
    >
      {/* Heading */}
      <div style={{
        textAlign: 'center',
        marginBottom: 'clamp(2rem, 4vw, 3.5rem)',
        padding: '0 1.5rem',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.65rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'var(--color-gold)',
          margin: '0 0 0.9rem',
          opacity: 0.85,
        }}>
          The Perfect Gift
        </p>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2.2rem, 4.5vw, 4rem)',
          fontWeight: 300,
          color: 'var(--color-dark)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          margin: '0 0 1rem',
        }}>
          Gift a Little{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-pink)' }}>Bliss</em>
        </h2>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(0.85rem, 1.4vw, 0.95rem)',
          color: 'rgba(61,26,26,0.68)',
          lineHeight: 1.7,
          margin: 0,
        }}>
          Add a Posa Rosa Gift Card to any order —{' '}
          <strong style={{ color: 'var(--color-dark)', fontWeight: 600 }}>AED 5</strong>
        </p>
      </div>

      {/* Perspective wrapper — static, never animated */}
      <div style={{ perspective: '1200px', perspectiveOrigin: 'center center' }}>
        {/*
          cardRef: receives rotateY from GSAP (-180 → 0).
          transform-style: preserve-3d makes children participate in 3D space.
          Faces use backface-visibility: hidden so only the forward-facing one is visible.
        */}
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            width: 'clamp(240px, 38vw, 360px)',
            aspectRatio: '1.588 / 1',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* ── FRONT FACE (rotateY = 0, visible when card is at 0 deg) ── */}
          <div
            style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <img
              src="/assets/brand-reference/Gift-Card-front.png"
              alt="Posa Rosa Gift Card"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                borderRadius: '14px',
                boxShadow: '0 28px 80px rgba(61,26,26,0.22)',
              }}
            />
          </div>

          {/* ── BACK FACE (rotateY = 180deg, visible when card is at ±180 deg) ── */}
          {/*
            Pre-rotated 180 deg on the Y axis. When the parent's rotateY is -180,
            net rotation seen by viewer = -180 + 180 = 0, so the back image renders
            without mirroring. backface-visibility hides it once the parent rotates
            past ±90 deg to show the front.
          */}
          <div
            style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src="/assets/brand-reference/Gift-Card-back.png"
              alt=""
              aria-hidden="true"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                borderRadius: '14px',
                boxShadow: '0 28px 80px rgba(61,26,26,0.22)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator — subtle nudge */}
      <div style={{
        marginTop: 'clamp(1.5rem, 3vw, 2.5rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.3rem',
        opacity: 0.3,
      }}>
        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true"
          style={{ animation: 'gcChevron 1.8s ease-in-out infinite' }}>
          <style>{`@keyframes gcChevron { 0%,100% { transform: translateY(0); } 50% { transform: translateY(3px); } }`}</style>
          <path d="M1 1l6 6 6-6" stroke="var(--color-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}
