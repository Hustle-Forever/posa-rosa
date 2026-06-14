import { motion } from 'framer-motion'

const WA = 'https://wa.me/971501234567?text=' + encodeURIComponent("Hi! I'd like to order a gift box from Posa Rosa 🦋🎁")

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 44 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay },
})

export default function GiftBoxes() {
  return (
    <section
      id="gift-boxes"
      style={{
        backgroundColor: '#FAF3EC',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(1.2rem, 5vw, 5rem)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          gap: 'clamp(3rem, 8vw, 7rem)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Image */}
        <motion.div
          {...fadeUp(0)}
          style={{
            flex: '1 1 360px',
            minWidth: 0,
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(61,26,26,0.1)',
            aspectRatio: '4/5',
          }}
        >
          <img
            src="/assets/images/Sweet and simple..jpg"
            alt="Posa Rosa Gift Box"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </motion.div>

        {/* Text */}
        <motion.div
          {...fadeUp(0.15)}
          style={{
            flex: '1 1 340px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1.2rem, 2.5vw, 2rem)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.68rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
            }}
          >
            Gift & Celebrate
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
              fontWeight: 300,
              color: 'var(--color-dark)',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
            }}
          >
            The Perfect<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-pink)' }}>Gift</em>
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(0.9rem, 1.6vw, 1rem)',
              color: 'var(--color-text)',
              opacity: 0.65,
              lineHeight: 1.75,
              maxWidth: '420px',
            }}
          >
            Custom gift boxes for Eid, weddings, birthdays &
            every celebration worth remembering. Each box is
            assembled by hand with love — filled with butterfly
            chocolates and wrapped with care.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {['Eid & Ramadan Gifts', 'Wedding Favours', 'Birthday Boxes', 'Corporate Gifting'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  backgroundColor: 'var(--color-gold)', flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.88rem',
                  color: 'var(--color-text)',
                  opacity: 0.72,
                  letterSpacing: '0.02em',
                }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: '0.6rem',
              marginTop: '0.5rem',
              padding: '0.9rem 2.4rem',
              borderRadius: '100px',
              background: 'var(--color-dark)',
              color: '#FDF6F0',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.82rem',
              letterSpacing: '0.09em',
              textDecoration: 'none',
              fontWeight: 500,
              boxShadow: '0 8px 36px rgba(61,26,26,0.18)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 44px rgba(61,26,26,0.24)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(61,26,26,0.18)' }}
          >
            Order a Gift Box on WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  )
}
