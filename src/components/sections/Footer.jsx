const WA = 'https://wa.me/971503509459?text=' + encodeURIComponent("Hi! I'd like to order from Posa Rosa 🦋")

const LINKS = [
  { label: 'Instagram',  href: 'https://www.instagram.com/posarosa.ae/' },
  { label: 'WhatsApp',   href: WA },
  { label: 'Deliveroo',  href: 'https://deliveroo.ae' },
  { label: 'talabat',    href: 'https://www.talabat.com' },
]

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(4rem, 8vw, 7rem) clamp(1.2rem, 5vw, 5rem) clamp(2.5rem, 5vw, 4rem)',
      }}
    >
      {/* Warpaper botanical texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("/assets/brand-reference/Warpaper.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        zIndex: 0,
      }} />
      {/* Deep rose overlay for text contrast */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(148, 88, 95, 0.78)',
        zIndex: 1,
      }} />
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        {/* Logo */}
        <div style={{ marginBottom: 'clamp(2rem, 4vw, 3.5rem)' }}>
          <img
            src="/assets/logo/logo.png"
            alt="Posa Rosa"
            style={{
              height: '56px',
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.92,
              display: 'block',
              margin: '0 auto',
            }}
          />
        </div>

        {/* Tagline */}
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)',
          fontStyle: 'italic',
          color: 'rgba(253,246,240,0.55)',
          fontWeight: 300,
          marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
          letterSpacing: '0.01em',
        }}>
          A Bite of Bliss
        </p>

        {/* Links */}
        <nav aria-label="Footer navigation">
          <ul style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(1.5rem, 4vw, 3rem)',
            listStyle: 'none',
            flexWrap: 'wrap',
            marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
          }}>
            {LINKS.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(253,246,240,0.55)',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-gold)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(253,246,240,0.55)' }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Divider */}
        <div style={{
          width: '48px',
          height: '1px',
          background: 'rgba(201,169,110,0.35)',
          margin: '0 auto clamp(2rem, 4vw, 3rem)',
        }} />

        {/* Hours */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.82rem',
          color: 'rgba(253,246,240,0.45)',
          letterSpacing: '0.06em',
          marginBottom: '0.6rem',
        }}>
          Open 9AM – 8PM · Every Day
        </p>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.78rem',
          color: 'rgba(253,246,240,0.3)',
          letterSpacing: '0.06em',
          marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
          fontStyle: 'italic',
        }}>
          No calls please — WhatsApp only
        </p>

        {/* Copyright */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.7rem',
          color: 'rgba(253,246,240,0.22)',
          letterSpacing: '0.08em',
        }}>
          © 2025 Posa Rosa · Abu Dhabi
        </p>
      </div>
    </footer>
  )
}
