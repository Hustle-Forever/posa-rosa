import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const APPAREL_IMAGES = [
  '/assets/t-shert/front.jpg',
  '/assets/t-shert/back.jpg',
]

export default function ApparelHighlight() {
  const images = APPAREL_IMAGES

  return (
    <section
      data-testid="apparel-highlight-section"
      style={{
        background: 'var(--color-dark)',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(1.2rem, 5vw, 5rem)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 44 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}
        >
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'var(--color-gold)', marginBottom: '1.2rem', opacity: 0.85,
          }}>
            Exclusive Drop
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.6rem, 7vw, 5.5rem)', fontWeight: 300,
            color: '#FDF6F0', letterSpacing: '-0.02em', lineHeight: 1.05,
            margin: 0,
          }}>
            The Collection
          </h2>
        </motion.div>

        {/* Image panels */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(0.75rem, 2vw, 1.5rem)',
          maxWidth: '760px', margin: '0 auto',
          marginBottom: 'clamp(3rem, 6vw, 5rem)',
        }}>
          {[0, 1].map(idx => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: idx * 0.15 }}
              style={{
                position: 'relative', paddingBottom: '125%', overflow: 'hidden',
                borderRadius: '8px', background: 'rgba(253,246,240,0.05)',
              }}
            >
              {images[idx] ? (
                <img
                  src={images[idx]}
                  alt={`Posa Rosa apparel – ${idx === 0 ? 'front' : 'back'}`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: '40px', height: '1px', background: 'rgba(253,246,240,0.15)' }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <Link
            to="/shop?category=collection"
            data-testid="shop-collection-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
              padding: 'clamp(1rem, 1.8vw, 1.2rem) clamp(2.5rem, 5vw, 4rem)',
              borderRadius: '100px',
              background: 'var(--color-gold)', color: '#3D1A1A',
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(0.82rem, 1.4vw, 0.95rem)',
              letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
              fontWeight: 600,
              boxShadow: '0 12px 48px rgba(201,169,110,0.28)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(201,169,110,0.38)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(201,169,110,0.28)' }}
          >
            Shop the Collection
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

      </div>
    </section>
  )
}
