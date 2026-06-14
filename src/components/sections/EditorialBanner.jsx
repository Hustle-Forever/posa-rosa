import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const WA = 'https://wa.me/971501234567?text=' + encodeURIComponent("Hi! I'd like to order from Posa Rosa 🦋")

export default function EditorialBanner() {
  const sectionRef = useRef(null)
  const bgRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(bgRef.current, {
        y: '22%',
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: 'clamp(480px, 75vh, 900px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Parallax bg */}
      <div
        ref={bgRef}
        style={{
          position: 'absolute',
          inset: '-20% 0',
          backgroundImage: "url('/assets/images/Soft, melty, perfect..jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          willChange: 'transform',
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(20,6,6,0.62) 0%, rgba(30,10,10,0.5) 50%, rgba(20,6,6,0.7) 100%)',
        }}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 2rem',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            marginBottom: '1.4rem',
            opacity: 0.9,
          }}
        >
          The Posa Rosa Experience
        </p>

        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            color: '#FDF6F0',
            fontSize: 'clamp(2.8rem, 8vw, 6.5rem)',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            marginBottom: 'clamp(2rem, 4vh, 3.5rem)',
          }}
        >
          Every Bite<br />
          <em style={{ fontStyle: 'italic', color: 'var(--color-pink)' }}>Tells a Story</em>
        </h2>

        <a
          href={WA}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.9rem 2.6rem',
            borderRadius: '100px',
            background: 'rgba(253,246,240,0.12)',
            border: '1.5px solid rgba(253,246,240,0.5)',
            color: '#FDF6F0',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.82rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            backdropFilter: 'blur(10px)',
            transition: 'background 0.35s ease, border-color 0.35s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(253,246,240,0.22)'
            e.currentTarget.style.borderColor = 'rgba(253,246,240,0.8)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(253,246,240,0.12)'
            e.currentTarget.style.borderColor = 'rgba(253,246,240,0.5)'
          }}
        >
          Order Now on WhatsApp
        </a>
      </motion.div>
    </section>
  )
}
