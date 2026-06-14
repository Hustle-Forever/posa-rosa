import { motion } from 'framer-motion'

const WA = 'https://wa.me/971501234567?text=' + encodeURIComponent("Hi! I'd like to order from Posa Rosa 🦋")

const STEPS = [
  { num: '01', title: 'Message us on WhatsApp', body: 'Send us a message — no calls please. We\'re here 9AM to 8PM, seven days a week.' },
  { num: '02', title: 'Choose your butterflies', body: 'Pick from Kinder, Matcha, Red Velvet, S\'mores, Cappuccino, and more. Mix and match freely.' },
  { num: '03', title: 'We deliver to your door', body: 'Fresh, handcrafted, and beautifully packaged. Delivered across Abu Dhabi.' },
]

export default function HowToOrder() {
  return (
    <section
      id="order"
      style={{
        backgroundColor: '#3D1A1A',
        padding: 'clamp(5rem, 10vw, 9rem) clamp(1.2rem, 5vw, 5rem)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 44 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 'clamp(4rem, 8vw, 7rem)' }}
        >
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.68rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            marginBottom: '1.2rem',
            opacity: 0.85,
          }}>
            Simple & Sweet
          </p>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.6rem, 7vw, 5.5rem)',
            fontWeight: 300,
            color: '#FDF6F0',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}>
            How to Order
          </h2>
        </motion.div>

        {/* Steps */}
        <div style={{
          display: 'flex',
          gap: 'clamp(2rem, 5vw, 4rem)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 'clamp(4rem, 8vw, 7rem)',
        }}>
          {STEPS.map(({ num, title, body }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
              style={{
                flex: '1 1 260px',
                maxWidth: '340px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
              }}
            >
              <div className="step-number">{num}</div>

              <div style={{
                width: '40px',
                height: '1px',
                backgroundColor: 'var(--color-gold)',
                opacity: 0.45,
              }} />

              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
                fontWeight: 400,
                color: '#FDF6F0',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}>
                {title}
              </h3>

              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.88rem',
                color: 'rgba(253,246,240,0.55)',
                lineHeight: 1.75,
                letterSpacing: '0.01em',
              }}>
                {body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* WhatsApp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: 'clamp(1rem, 1.8vw, 1.2rem) clamp(2.5rem, 5vw, 4rem)',
              borderRadius: '100px',
              background: 'var(--color-gold)',
              color: '#3D1A1A',
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(0.82rem, 1.4vw, 0.95rem)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              fontWeight: 600,
              boxShadow: '0 12px 48px rgba(201,169,110,0.28)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(201,169,110,0.38)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(201,169,110,0.28)' }}
          >
            <WhatsAppIcon />
            Start Your Order
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L.057 23.214a.75.75 0 00.92.92l5.36-1.476A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.727 9.727 0 01-4.964-1.36l-.356-.212-3.685 1.014 1.014-3.685-.212-.356A9.727 9.727 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
    </svg>
  )
}
