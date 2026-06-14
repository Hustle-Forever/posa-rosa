import { motion } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 44 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1], delay },
})

export default function BrandStory() {
  return (
    <section
      id="about"
      style={{
        backgroundColor: 'var(--color-bg)',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(1.2rem, 5vw, 5rem)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          gap: 'clamp(3rem, 8vw, 8rem)',
          alignItems: 'center',
          flexWrap: 'wrap-reverse',
        }}
      >
        {/* Text */}
        <motion.div
          {...fadeUp(0)}
          style={{
            flex: '1 1 340px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1.2rem, 2.5vw, 2rem)',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.68rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
          }}>
            Our Story
          </p>

          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
            fontWeight: 300,
            color: 'var(--color-dark)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
          }}>
            Born in<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-pink)' }}>Abu Dhabi</em>
          </h2>

          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.92rem, 1.6vw, 1.02rem)',
            color: 'var(--color-text)',
            opacity: 0.65,
            lineHeight: 1.82,
            maxWidth: '480px',
          }}>
            Posa Rosa was born from a love of beautiful things. Every butterfly
            is handcrafted with care, shaped with precision, and filled with the
            finest ingredients. From Kinder to Matcha, Red Velvet to S&apos;mores —
            there&apos;s a butterfly for every taste.
          </p>

          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(0.92rem, 1.6vw, 1.02rem)',
            color: 'var(--color-text)',
            opacity: 0.55,
            lineHeight: 1.82,
            maxWidth: '480px',
          }}>
            Made in small batches, by hand, with intention. Because we believe
            the most beautiful moments deserve the most beautiful chocolate.
          </p>

          {/* Decorative divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginTop: '0.5rem',
          }}>
            <div style={{ width: '48px', height: '1px', backgroundColor: 'var(--color-gold)', opacity: 0.4 }} />
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.1rem',
              color: 'var(--color-gold)',
              fontStyle: 'italic',
              opacity: 0.7,
            }}>
              Handcrafted with love
            </span>
          </div>
        </motion.div>

        {/* Image */}
        <motion.div
          {...fadeUp(0.15)}
          style={{
            flex: '1 1 360px',
            minWidth: 0,
            position: 'relative',
          }}
        >
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 30px 90px rgba(61,26,26,0.12)',
            aspectRatio: '4/5',
          }}>
            <img
              src="/assets/images/One classic bite at a time..jpg"
              alt="One classic bite at a time"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Floating accent */}
          <div style={{
            position: 'absolute',
            bottom: '-1.5rem',
            left: '-1.5rem',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'var(--color-pink)',
            opacity: 0.12,
            zIndex: -1,
            filter: 'blur(20px)',
          }} />
        </motion.div>
      </div>
    </section>
  )
}
