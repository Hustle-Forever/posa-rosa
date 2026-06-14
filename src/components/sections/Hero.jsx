import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const WA = 'https://wa.me/971501234567?text=' + encodeURIComponent("Hi! I'd like to order from Posa Rosa 🦋")

function ButterflySVG({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="51" cy="52" rx="34" ry="14" fill="#3D1A1A" opacity="0.07" />
      <path d="M 50,38 C 42,16 6,14 8,32 C 10,46 28,54 50,46 Z" fill="var(--color-pink)" opacity="0.9" />
      <path d="M 50,38 C 58,16 94,14 92,32 C 90,46 72,54 50,46 Z" fill="var(--color-pink)" opacity="0.9" />
      <path d="M 50,46 C 40,50 12,54 14,65 C 16,73 34,71 50,58 Z" fill="var(--color-pink)" opacity="0.55" />
      <path d="M 50,46 C 60,50 88,54 86,65 C 84,73 66,71 50,58 Z" fill="var(--color-pink)" opacity="0.55" />
      <ellipse cx="24" cy="26" rx="13" ry="7" fill="white" opacity="0.22" transform="rotate(-22 24 26)" />
      <ellipse cx="76" cy="26" rx="13" ry="7" fill="white" opacity="0.22" transform="rotate(22 76 26)" />
      <ellipse cx="50" cy="48" rx="5.5" ry="18" fill="#3D1A1A" opacity="0.75" />
      <ellipse cx="49" cy="42" rx="2" ry="8" fill="white" opacity="0.15" />
      <circle cx="50" cy="29" r="5" fill="#3D1A1A" opacity="0.75" />
      <path d="M 48,25 Q 42,14 46,8" stroke="#3D1A1A" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="46" cy="8" r="2.2" fill="var(--color-gold)" opacity="0.95" />
      <path d="M 52,25 Q 58,14 54,8" stroke="#3D1A1A" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="54" cy="8" r="2.2" fill="var(--color-gold)" opacity="0.95" />
    </svg>
  )
}

export default function Hero() {
  const sectionRef = useRef(null)
  const bgRef      = useRef(null)
  const headingRef = useRef(null)
  const labelRef   = useRef(null)
  const subRef     = useRef(null)
  const btnsRef    = useRef(null)
  const scrollHintRef = useRef(null)
  const bf1Ref     = useRef(null)
  const bf2Ref     = useRef(null)
  const bf3Ref     = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial states
      gsap.set([labelRef.current, headingRef.current, subRef.current, btnsRef.current, scrollHintRef.current], {
        opacity: 0, y: 48,
      })
      gsap.set([bf1Ref.current, bf2Ref.current, bf3Ref.current], { opacity: 0, scale: 0.3 })

      // Entry timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
      tl.to(labelRef.current,   { opacity: 1, y: 0, duration: 0.9 })
        .to(headingRef.current, { opacity: 1, y: 0, duration: 1.1 }, '-=0.5')
        .to(subRef.current,     { opacity: 1, y: 0, duration: 0.85 }, '-=0.65')
        .to(btnsRef.current,    { opacity: 1, y: 0, duration: 0.75 }, '-=0.55')
        .to(scrollHintRef.current, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
        .to([bf1Ref.current, bf2Ref.current, bf3Ref.current], {
          opacity: 1, scale: 1, duration: 1.3, stagger: 0.18, ease: 'back.out(1.4)',
        }, '-=0.8')

      // Parallax background on scroll
      gsap.to(bgRef.current, {
        y: '28%',
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      // Floating butterfly animations
      const float = (el, yAmt, dur, xAmt) =>
        gsap.to(el, {
          y: `+=${yAmt}`, x: `+=${xAmt}`, rotation: '+=6',
          duration: dur, ease: 'sine.inOut', repeat: -1, yoyo: true,
        })

      const flutter = (el, dur) =>
        gsap.to(el, {
          scaleX: 0.82, duration: dur, ease: 'sine.inOut',
          repeat: -1, yoyo: true, transformOrigin: 'center center',
        })

      float(bf1Ref.current, 22, 3.6,  12)
      float(bf2Ref.current, 28, 4.4, -10)
      float(bf3Ref.current, 16, 3.0,   7)

      flutter(bf1Ref.current, 0.68)
      flutter(bf2Ref.current, 0.54)
      flutter(bf3Ref.current, 0.76)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Parallax background image */}
      <div
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: '-25% 0',
          backgroundImage: "url('/assets/images/Original, simple, perfect..jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
          willChange: 'transform',
        }}
      />

      {/* Dark cinematic overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(175deg, rgba(20,8,8,0.58) 0%, rgba(30,10,10,0.38) 48%, rgba(20,8,8,0.68) 100%)',
          zIndex: 1,
        }}
      />

      {/* Floating butterflies */}
      <div ref={bf1Ref} style={{ position: 'absolute', top: '12%', left: '6%', width: 'clamp(70px, 9vw, 128px)', zIndex: 5, pointerEvents: 'none' }}>
        <ButterflySVG className="w-full h-auto" />
      </div>
      <div ref={bf2Ref} style={{ position: 'absolute', top: '8%', right: '8%', width: 'clamp(90px, 12vw, 160px)', zIndex: 5, pointerEvents: 'none' }}>
        <ButterflySVG className="w-full h-auto" />
      </div>
      <div ref={bf3Ref} style={{ position: 'absolute', bottom: '15%', right: '5%', width: 'clamp(55px, 7vw, 96px)', zIndex: 5, pointerEvents: 'none' }}>
        <ButterflySVG className="w-full h-auto" />
      </div>

      {/* Hero content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '1000px',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(1rem, 2.5vh, 1.6rem)',
        }}
      >
        <p
          ref={labelRef}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.8rem',
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'var(--color-pink)',
            fontWeight: 400,
          }}
        >
          Posa Rosa
        </p>

        <h1
          ref={headingRef}
          style={{
            fontFamily: 'var(--font-serif)',
            color: '#FDF6F0',
            fontSize: 'clamp(4rem, 11.5vw, 9.5rem)',
            fontWeight: 300,
            lineHeight: 0.98,
            letterSpacing: '-0.025em',
          }}
        >
          Born to be<br />
          <em style={{ fontStyle: 'italic', color: 'var(--color-pink)' }}>Beautiful</em>
        </h1>

        <p
          ref={subRef}
          style={{
            fontFamily: 'var(--font-sans)',
            color: 'rgba(253,246,240,0.72)',
            fontSize: 'clamp(0.85rem, 1.6vw, 1rem)',
            letterSpacing: '0.04em',
            lineHeight: 1.65,
          }}
        >
          Handcrafted butterfly chocolates · Abu Dhabi
        </p>

        <div
          ref={btnsRef}
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '0.5rem',
          }}
        >
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            style={pillBtn('filled')}
          >
            <WhatsAppIcon />
            Order on WhatsApp
          </a>
          <a
            href="#chocolates"
            style={pillBtn('outline')}
          >
            Explore Collection
          </a>
        </div>
      </div>

    </section>
  )
}

function pillBtn(variant) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.55rem',
    padding: 'clamp(0.75rem, 1.5vw, 0.95rem) clamp(1.6rem, 3vw, 2.4rem)',
    borderRadius: '100px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'clamp(0.78rem, 1.3vw, 0.88rem)',
    letterSpacing: '0.07em',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
    cursor: 'pointer',
  }
  if (variant === 'filled') {
    return {
      ...base,
      background: 'rgba(61,26,26,0.92)',
      color: '#FDF6F0',
      boxShadow: '0 8px 36px rgba(0,0,0,0.28)',
      backdropFilter: 'blur(8px)',
    }
  }
  return {
    ...base,
    background: 'transparent',
    color: '#FDF6F0',
    border: '1.5px solid rgba(253,246,240,0.55)',
    backdropFilter: 'blur(8px)',
  }
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L.057 23.214a.75.75 0 00.92.92l5.36-1.476A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.727 9.727 0 01-4.964-1.36l-.356-.212-3.685 1.014 1.014-3.685-.212-.356A9.727 9.727 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  )
}

function ScrollArrow() {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden="true"
      style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}>
      <rect x="5" y="0" width="4" height="11" rx="2" fill="currentColor" opacity="0.6" />
      <path d="M3 14 L7 19 L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </svg>
  )
}
