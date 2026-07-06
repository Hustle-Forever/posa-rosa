import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function GiftCardShowcase() {
  const sectionRef   = useRef(null)
  const contentRef   = useRef(null)
  const textRef      = useRef(null)
  const cardGroupRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()

    // Desktop: full 3D flip entrance + scrubbed exit
    mm.add('(min-width: 769px)', () => {
      const ctx = gsap.context(() => {
        gsap.from(cardGroupRef.current, {
          rotateY: -82,
          opacity: 0,
          duration: 1.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            toggleActions: 'play none none reverse',
          },
        })

        gsap.from(textRef.current, {
          opacity: 0,
          x: -28,
          duration: 0.9,
          delay: 0.18,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            toggleActions: 'play none none reverse',
          },
        })

        gsap.to(contentRef.current, {
          opacity: 0,
          y: -20,
          scale: 0.96,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'bottom 65%',
            end: 'bottom top',
            scrub: 1.5,
          },
        })
      }, sectionRef)
      return () => ctx.revert()
    })

    // Mobile: simple fade + scale (no 3D for performance)
    mm.add('(max-width: 768px)', () => {
      const ctx = gsap.context(() => {
        gsap.from(contentRef.current, {
          opacity: 0,
          y: 28,
          scale: 0.97,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        })

        gsap.to(contentRef.current, {
          opacity: 0,
          scale: 0.96,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'bottom 70%',
            end: 'bottom top',
            scrub: 1.2,
          },
        })
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
        padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 5vw, 5rem)',
        overflow: 'hidden',
      }}
    >
      <div
        ref={contentRef}
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(3rem, 6vw, 7rem)',
          flexWrap: 'wrap',
        }}
      >
        {/* Text */}
        <div ref={textRef} style={{ flex: '1 1 300px' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.65rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            marginBottom: '1rem',
            opacity: 0.85,
            margin: '0 0 1rem',
          }}>
            The Perfect Gift
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 300,
            color: 'var(--color-dark)',
            letterSpacing: '-0.01em',
            lineHeight: 1.08,
            margin: '0 0 1.5rem',
          }}>
            Gift a Little{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--color-pink)' }}>Bliss</em>
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.88rem, 1.5vw, 1rem)',
            color: 'rgba(61,26,26,0.68)',
            lineHeight: 1.75,
            letterSpacing: '0.02em',
            maxWidth: '380px',
            margin: 0,
          }}>
            Add a Posa Rosa Gift Card to any order —{' '}
            <strong style={{ color: 'var(--color-dark)', fontWeight: 600 }}>AED 5</strong>
          </p>
        </div>

        {/* Card visual — perspective wrapper stays static, inner group is animated */}
        <div style={{
          flex: '1 1 300px',
          display: 'flex',
          justifyContent: 'center',
          perspective: '1400px',
          perspectiveOrigin: 'center center',
        }}>
          <div
            ref={cardGroupRef}
            style={{
              position: 'relative',
              width: 'clamp(240px, 38vw, 360px)',
              aspectRatio: '1.588 / 1',
            }}
          >
            {/* Back card — static offset for depth illusion */}
            <div style={{
              position: 'absolute',
              inset: 0,
              transform: 'translateX(18px) translateY(-12px) rotateY(-8deg)',
              borderRadius: '14px',
              overflow: 'hidden',
              opacity: 0.55,
              boxShadow: '0 12px 40px rgba(61,26,26,0.10)',
            }}>
              <img
                src="/assets/brand-reference/Gift-Card-back.png"
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* Front card */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 24px 72px rgba(61,26,26,0.20)',
            }}>
              <img
                src="/assets/brand-reference/Gift-Card-front.png"
                alt="Posa Rosa Gift Card"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
