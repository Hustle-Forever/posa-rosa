import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const WA = 'https://wa.me/971501234567?text=' + encodeURIComponent("Hi! I'd like to order from Posa Rosa 🦋")

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const { pathname } = useLocation()
  const { cartCount } = useCart()

  const isHome    = pathname === '/'
  const isScrolled = scrolled || !isHome

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  const linkColor = isScrolled ? 'var(--color-dark)' : '#FDF6F0'

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
        backgroundColor: isScrolled ? '#FDF6F0' : 'transparent',
        boxShadow: isScrolled ? '0 1px 24px rgba(61,26,26,0.07)' : 'none',
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
        <div className="nav-links-left" style={{ display: 'flex', gap: '2.8rem', alignItems: 'center' }}>
          <a href="#chocolates" style={linkStyle(linkColor)}>Our Chocolates</a>
          <a href="#gift-boxes" style={linkStyle(linkColor)}>Gift Boxes</a>
        </div>

        {/* Center logo */}
        <Link
          to="/"
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
              filter: isScrolled ? 'none' : 'brightness(0) invert(1)',
              transition: 'filter 0.45s ease',
            }}
          />
        </Link>

        {/* Right links */}
        <div className="nav-links-right" style={{ display: 'flex', gap: '2.8rem', alignItems: 'center' }}>
          <Link to="/shop" style={linkStyle(linkColor)}>Shop</Link>
          <a href={WA} target="_blank" rel="noopener noreferrer" style={linkStyle(linkColor)}>Order</a>
          <a href="#about" style={linkStyle(linkColor)}>About</a>

          {/* Cart icon */}
          <Link
            to="/cart"
            aria-label={`Cart${cartCount > 0 ? ` — ${cartCount} items` : ''}`}
            style={{
              position: 'relative',
              color: linkColor,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.45s ease',
              textDecoration: 'none',
            }}
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-9px',
                  minWidth: '16px',
                  height: '16px',
                  background: 'var(--color-gold)',
                  color: 'var(--color-dark)',
                  borderRadius: '8px',
                  fontSize: '0.58rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  padding: '0 3px',
                  letterSpacing: 0,
                }}
              >
                {cartCount}
              </motion.span>
            )}
          </Link>
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
          <a href="#chocolates"  onClick={() => setMenuOpen(false)} style={{ ...linkStyle('var(--color-dark)'), fontSize: '0.9rem' }}>Our Chocolates</a>
          <a href="#gift-boxes"  onClick={() => setMenuOpen(false)} style={{ ...linkStyle('var(--color-dark)'), fontSize: '0.9rem' }}>Gift Boxes</a>
          <Link to="/shop"       onClick={() => setMenuOpen(false)} style={{ ...linkStyle('var(--color-dark)'), fontSize: '0.9rem' }}>Shop</Link>
          <a href={WA} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} style={{ ...linkStyle('var(--color-dark)'), fontSize: '0.9rem' }}>Order on WhatsApp</a>
          <Link to="/cart"       onClick={() => setMenuOpen(false)} style={{ ...linkStyle('var(--color-dark)'), fontSize: '0.9rem' }}>
            Cart{cartCount > 0 ? ` (${cartCount})` : ''}
          </Link>
          <a href="#about"       onClick={() => setMenuOpen(false)} style={{ ...linkStyle('var(--color-dark)'), fontSize: '0.9rem' }}>About</a>
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
