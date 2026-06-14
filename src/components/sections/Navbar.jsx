import { useState, useEffect } from 'react'

const WA = 'https://wa.me/971501234567?text=' + encodeURIComponent("Hi! I'd like to order from Posa Rosa 🦋")

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkColor = scrolled ? 'var(--color-dark)' : '#FDF6F0'

  return (
    <nav
      style={{
        position: 'fixed',
        top: 'var(--bar-h)',
        left: 0,
        right: 0,
        height: 'var(--nav-h)',
        zIndex: 90,
        transition: 'background-color 0.45s ease, box-shadow 0.45s ease',
        backgroundColor: scrolled ? '#FDF6F0' : 'transparent',
        boxShadow: scrolled ? '0 1px 24px rgba(61,26,26,0.07)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: '0 2.5rem',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Left links */}
        <div
          className="nav-links-left"
          style={{ display: 'flex', gap: '2.8rem', alignItems: 'center' }}
        >
          <a href="#chocolates" style={linkStyle(linkColor)}>Our Chocolates</a>
          <a href="#gift-boxes" style={linkStyle(linkColor)}>Gift Boxes</a>
        </div>

        {/* Center logo */}
        <a
          href="#"
          aria-label="Posa Rosa home"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            lineHeight: 0,
          }}
        >
          <img
            src="/assets/logo/main-logo.svg"
            alt="Posa Rosa"
            style={{
              height: '105px',
              width: 'auto',
              filter: scrolled ? 'none' : 'brightness(0) invert(1)',
              transition: 'filter 0.45s ease',
            }}
          />
        </a>

        {/* Right links */}
        <div
          className="nav-links-right"
          style={{ display: 'flex', gap: '2.8rem', alignItems: 'center' }}
        >
          <a href={WA} target="_blank" rel="noopener noreferrer" style={linkStyle(linkColor)}>Order</a>
          <a href="#about" style={linkStyle(linkColor)}>About</a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: linkColor,
            transition: 'color 0.45s ease',
          }}
        >
          <svg width="22" height="16" viewBox="0 0 22 16" fill="currentColor">
            <rect y="0" width="22" height="1.5" rx="1" />
            <rect y="7.25" width="22" height="1.5" rx="1" />
            <rect y="14.5" width="22" height="1.5" rx="1" />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#FDF6F0',
            borderTop: '1px solid rgba(61,26,26,0.08)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 2.5rem',
            gap: '1.4rem',
            boxShadow: '0 8px 40px rgba(61,26,26,0.1)',
          }}
        >
          {[
            { label: 'Our Chocolates', href: '#chocolates' },
            { label: 'Gift Boxes', href: '#gift-boxes' },
            { label: 'Order on WhatsApp', href: WA },
            { label: 'About', href: '#about' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              onClick={() => setMenuOpen(false)}
              style={{
                ...linkStyle('var(--color-dark)'),
                fontSize: '0.9rem',
              }}
            >
              {label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links-left, .nav-links-right { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

function linkStyle(color) {
  return {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.78rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color,
    textDecoration: 'none',
    transition: 'color 0.45s ease, opacity 0.3s ease',
    opacity: 0.88,
    whiteSpace: 'nowrap',
  }
}
