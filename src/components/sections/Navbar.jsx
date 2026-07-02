import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const WA = 'https://wa.me/971503509459?text=' + encodeURIComponent("Hi! I'd like to order from Posa Rosa 🦋")

const LEFT_LINKS = [
  { label: 'Our Chocolates', href: '/#chocolates' },
  { label: 'Gift Boxes',     href: '/#gift-boxes' },
]

const RIGHT_LINKS = [
  { label: 'Shop',      to: '/shop' },
  { label: 'About',     to: '/about' },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const { pathname } = useLocation()
  const { cartCount, openDrawer } = useCart()

  const isHome     = pathname === '/'
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
        top: 'var(--bar-h)', left: 0, right: 0,
        height: 'var(--nav-h)', zIndex: 90,
        transition: 'background-color 0.45s ease, box-shadow 0.45s ease',
        backgroundColor: isScrolled ? '#FDF6F0' : 'transparent',
        boxShadow: isScrolled ? '0 1px 24px rgba(61,26,26,0.07)' : 'none',
      }}
    >
      <div style={{
        maxWidth: '1380px', margin: '0 auto', padding: '0 2rem',
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'relative',
      }}>

        {/* Left nav links (desktop only) */}
        <div className="nav-links-left" style={{ display: 'flex', gap: '2.2rem', alignItems: 'center' }}>
          {LEFT_LINKS.map(l => (
            <a key={l.label} href={l.href} style={linkStyle(linkColor)}>{l.label}</a>
          ))}
        </div>

        {/* Center logo */}
        <Link
          to="/"
          aria-label="Posa Rosa home"
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', lineHeight: 0,
          }}
        >
          <img
            src="/assets/logo/main-logo.svg"
            alt="Posa Rosa"
            style={{
              height: '105px', width: 'auto',
              filter: isScrolled ? 'none' : 'brightness(0) invert(1)',
              transition: 'filter 0.45s ease',
            }}
          />
        </Link>

        {/* Right side: desktop links + cart (always) + hamburger (mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.2rem' }}>

          {/* Page links — desktop only */}
          <div className="nav-links-right" style={{ display: 'flex', gap: '2.2rem', alignItems: 'center' }}>
            {RIGHT_LINKS.map(l => (
              <Link key={l.label} to={l.to} style={linkStyle(linkColor)}>{l.label}</Link>
            ))}
            <a href={WA} target="_blank" rel="noopener noreferrer" style={linkStyle(linkColor)}>Order</a>
          </div>

          {/* Cart icon — ALWAYS visible on every viewport */}
          <button
            onClick={openDrawer}
            aria-label={`Cart${cartCount > 0 ? ` — ${cartCount} items` : ''}`}
            style={{
              position: 'relative', background: 'none', border: 'none',
              cursor: 'pointer', color: linkColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px',
              transition: 'color 0.45s ease',
            }}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                style={{
                  position: 'absolute', top: '-2px', right: '-4px',
                  minWidth: '17px', height: '17px',
                  background: 'var(--color-gold)', color: '#3D1A1A',
                  borderRadius: '9px', fontSize: '0.58rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontFamily: 'var(--font-sans)', padding: '0 3px', letterSpacing: 0,
                  pointerEvents: 'none',
                }}
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', padding: '6px', color: linkColor,
              transition: 'color 0.45s ease',
            }}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 2l16 16M18 2L2 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="16" viewBox="0 0 22 16" fill="currentColor">
                <rect y="0"    width="22" height="1.5" rx="1" />
                <rect y="7.25" width="22" height="1.5" rx="1" />
                <rect y="14.5" width="22" height="1.5" rx="1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              backgroundColor: '#FDF6F0',
              borderTop: '1px solid rgba(61,26,26,0.08)',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 12px 40px rgba(61,26,26,0.12)',
            }}
          >
            {[
              { label: 'Our Chocolates', href: '/#chocolates' },
              { label: 'Gift Boxes',     href: '/#gift-boxes' },
              { label: 'Shop',           to: '/shop' },
              { label: 'About',          to: '/about' },
              { label: 'Contact',        to: '/contact' },
              { label: 'Order on WhatsApp', href: WA, external: true },
            ].map((item, i, arr) => {
              const st = {
                ...mobileLinkStyle,
                borderBottom: i < arr.length - 1 ? '1px solid rgba(61,26,26,0.06)' : 'none',
              }
              if (item.to) {
                return (
                  <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} style={st}>
                    {item.label}
                  </Link>
                )
              }
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  onClick={() => setMenuOpen(false)}
                  style={st}
                >
                  {item.label}
                </a>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
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
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color,
    textDecoration: 'none',
    transition: 'color 0.45s ease, opacity 0.3s ease',
    opacity: 0.85,
    whiteSpace: 'nowrap',
  }
}

const mobileLinkStyle = {
  fontFamily: 'var(--font-sans)',
  fontSize: '0.88rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-dark)',
  textDecoration: 'none',
  padding: '1rem 2rem',
  display: 'block',
  fontWeight: 400,
  opacity: 0.85,
}
