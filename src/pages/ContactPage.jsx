import { motion } from 'framer-motion'

const WA_URL  = 'https://wa.me/971500000000?text=' + encodeURIComponent("Hi! I'd like to get in touch with Posa Rosa 🦋")
const EMAIL   = 'hello@posarosa.ae'
const INSTA   = 'https://www.instagram.com/posarosa.ae/'

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }
}

export default function ContactPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        paddingTop: 'calc(var(--bar-h) + var(--nav-h))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--bar-h) + var(--nav-h) + 4rem) 2rem 6rem',
      }}
    >
      <style>{`
        .contact-link:hover { opacity: 1 !important; }
        .wa-btn-contact:hover { background: #1da851 !important; }
      `}</style>

      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* Overline */}
        <motion.p
          {...fade(0.05)}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.62rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            fontWeight: 600,
            margin: '0 0 1.2rem',
          }}
        >
          Reach Out
        </motion.p>

        {/* Heading */}
        <motion.h1
          {...fade(0.12)}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.6rem, 8vw, 4.5rem)',
            fontWeight: 300,
            color: 'var(--color-dark)',
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            margin: '0 0 1.2rem',
          }}
        >
          We'd Love to Hear From You
        </motion.h1>

        <motion.p
          {...fade(0.2)}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            color: 'rgba(61,26,26,0.72)',
            lineHeight: 1.75,
            margin: '0 0 0.6rem',
          }}
        >
          Questions, custom orders, or just want to say hi? Reach us any time.
        </motion.p>
        <motion.p
          {...fade(0.24)}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            color: 'rgba(61,26,26,0.62)',
            letterSpacing: '0.06em',
            margin: '0 0 3rem',
          }}
        >
          We typically respond within 2 hours
        </motion.p>

        {/* WhatsApp — primary CTA */}
        <motion.a
          {...fade(0.28)}
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-btn-contact"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '1.2rem',
            background: '#25D366',
            color: '#fff',
            borderRadius: '10px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            marginBottom: '1.25rem',
            transition: 'background 0.25s ease',
            boxSizing: 'border-box',
            boxShadow: '0 6px 24px rgba(37,211,102,0.28)',
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Chat on WhatsApp
        </motion.a>

        {/* Divider */}
        <motion.div
          {...fade(0.32)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'rgba(61,26,26,0.1)' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(61,26,26,0.60)', letterSpacing: '0.1em' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(61,26,26,0.1)' }} />
        </motion.div>

        {/* Email */}
        <motion.a
          {...fade(0.36)}
          href={`mailto:${EMAIL}`}
          className="contact-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '1rem',
            background: '#fff',
            color: 'var(--color-dark)',
            border: '1px solid rgba(201,160,163,0.25)',
            borderRadius: '10px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.84rem',
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: '0.875rem',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            boxSizing: 'border-box',
            opacity: 0.85,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-dark)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,160,163,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,160,163,0.25)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {EMAIL}
        </motion.a>

        {/* Instagram */}
        <motion.a
          {...fade(0.4)}
          href={INSTA}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '1rem',
            background: '#fff',
            color: 'var(--color-dark)',
            border: '1px solid rgba(201,160,163,0.25)',
            borderRadius: '10px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.84rem',
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: '2.5rem',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
            boxSizing: 'border-box',
            opacity: 0.85,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-dark)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,160,163,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,160,163,0.25)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          @posarosa
        </motion.a>

        {/* Response time */}
        <motion.p
          {...fade(0.44)}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            color: 'rgba(61,26,26,0.60)',
            letterSpacing: '0.08em',
            textAlign: 'center',
          }}
        >
          No calls please · WhatsApp only · Open 9AM – 8PM daily
        </motion.p>
      </div>
    </motion.div>
  )
}
