import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProducts, normalizeProduct } from '../lib/shopify'

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────

function ProductModal({ product, onClose }) {
  const [qty, setQty]     = useState(1)
  const [added, setAdded] = useState(false)
  const { addToCart, openDrawer } = useCart()

  const handleAdd = useCallback(() => {
    addToCart(product, qty)
    setAdded(true)
    // Brief flash then open the cart drawer
    setTimeout(() => {
      setAdded(false)
      onClose()
      openDrawer()
    }, 600)
  }, [addToCart, openDrawer, onClose, product, qty])

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(22,7,7,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div
          key="modal-panel"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          className="product-modal-panel"
          style={{
            background: '#FDF6F0',
            borderRadius: '20px 20px 0 0',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '92vh',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(61,26,26,0.08)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#3D1A1A', transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(61,26,26,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(61,26,26,0.08)'}
          >
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
              <path d="M2 2l14 14M16 2L2 16" strokeLinecap="round" />
            </svg>
          </button>

          {/* Product image — large, square */}
          <div style={{
            width: '100%', paddingBottom: '85%',
            position: 'relative', overflow: 'hidden',
            borderRadius: '20px 20px 0 0',
            background: 'rgba(61,26,26,0.04)',
          }}>
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(61,26,26,0.18)"
                  strokeWidth="1" width="48" height="48">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: '1.75rem 1.75rem 2rem' }}>
            {product.collection && (
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.58rem',
                letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'var(--color-gold)', fontWeight: 600, display: 'block', marginBottom: '0.5rem',
              }}>
                {product.collection}
              </span>
            )}

            <h2 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
              fontWeight: 400, color: '#3D1A1A', letterSpacing: '0.02em',
              lineHeight: 1.2, margin: '0 0 0.5rem',
            }}>
              {product.name}
            </h2>

            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '1.05rem',
              fontWeight: 700, color: '#3D1A1A', margin: '0 0 1rem',
              letterSpacing: '0.02em',
            }}>
              AED {Number(product.price).toFixed(0)}
              {product.unit && (
                <span style={{ fontWeight: 400, opacity: 0.42, fontSize: '0.82rem', marginLeft: '0.3em' }}>
                  / {product.unit}
                </span>
              )}
            </p>

            {product.description && (
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.88rem',
                color: 'rgba(61,26,26,0.62)', lineHeight: 1.75, margin: '0 0 1.5rem',
              }}>
                {product.description}
              </p>
            )}

            {/* Qty + Add */}
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'stretch' }}>
              {/* Quantity selector */}
              <div style={{
                display: 'flex', alignItems: 'stretch',
                border: '1px solid rgba(61,26,26,0.18)', borderRadius: '8px',
                overflow: 'hidden', height: '48px', flexShrink: 0,
              }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{
                    width: '42px', background: 'transparent', border: 'none',
                    borderRight: '1px solid rgba(61,26,26,0.13)',
                    cursor: 'pointer', color: '#3D1A1A',
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(61,26,26,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  −
                </button>
                <span style={{
                  width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', color: '#3D1A1A',
                }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  style={{
                    width: '42px', background: 'transparent', border: 'none',
                    borderLeft: '1px solid rgba(61,26,26,0.13)',
                    cursor: 'pointer', color: '#3D1A1A',
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(61,26,26,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <motion.button
                onClick={handleAdd}
                whileTap={{ scale: 0.97 }}
                animate={added ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                style={{
                  flex: 1, height: '48px',
                  background: added ? 'var(--color-gold)' : '#3D1A1A',
                  color: added ? '#3D1A1A' : 'var(--color-gold)',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
                  letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
                  transition: 'background 0.3s ease, color 0.3s ease',
                }}
              >
                {added ? '✓ Added to Cart' : 'Add to Cart'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

function ProductCard({ product, onOpen }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="shop-card"
      onClick={() => onOpen(product)}
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 16px rgba(61,26,26,0.06)',
        border: '1px solid rgba(61,26,26,0.06)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Photo — 75% of card */}
      <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="shop-card-img"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
        {/* Collection badge */}
        {product.collection && (
          <span style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            background: 'rgba(253,246,240,0.9)',
            color: '#3D1A1A',
            fontFamily: 'var(--font-sans)', fontSize: '0.55rem',
            letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
            padding: '0.28rem 0.65rem', borderRadius: '100px',
          }}>
            {product.collection}
          </span>
        )}
      </div>

      {/* Info strip — name + price, minimal */}
      <div style={{ padding: '1rem 1.1rem 1.2rem' }}>
        <h3 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(1rem, 3vw, 1.2rem)',
          fontWeight: 400, color: '#3D1A1A',
          lineHeight: 1.25, margin: '0 0 0.3rem',
          letterSpacing: '0.01em',
        }}>
          {product.name}
        </h3>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
          fontWeight: 700, color: '#3D1A1A', margin: 0,
          letterSpacing: '0.03em',
        }}>
          AED {Number(product.price).toFixed(0)}
          {product.unit && (
            <span style={{ fontWeight: 400, opacity: 0.42, fontSize: '0.68rem', marginLeft: '0.28em' }}>
              / {product.unit}
            </span>
          )}
        </p>
      </div>
    </motion.article>
  )
}

// ─── SHOP PAGE ────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeFilter, setActiveFilter] = useState('All')
  const [products,     setProducts]     = useState([])
  const [collections,  setCollections]  = useState(['All'])
  const [loading,      setLoading]      = useState(true)
  const [openProduct,  setOpenProduct]  = useState(null)

  useEffect(() => {
    getProducts()
      .then(raw => {
        const normalized = raw.map(normalizeProduct)
        setProducts(normalized)
        const HIDDEN = new Set(['Home page', 'home page', 'frontpage'])
        const unique = [...new Set(normalized.map(p => p.collection).filter(c => c && !HIDDEN.has(c)))]
        setCollections(['All', ...unique])

        // Auto-open from URL param
        const handle = searchParams.get('product')
        if (handle) {
          const found = normalized.find(p => p.handle === handle)
          if (found) setOpenProduct(found)
        }
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function closeModal() {
    setOpenProduct(null)
    // Remove ?product= from URL without navigation
    const next = new URLSearchParams(searchParams)
    next.delete('product')
    setSearchParams(next, { replace: true })
  }

  const filtered = activeFilter === 'All'
    ? products
    : products.filter(p => p.collection === activeFilter)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: 'calc(var(--bar-h) + var(--nav-h))' }}
    >
      <style>{`
        .shop-card { transition: box-shadow 0.4s ease, transform 0.4s ease !important; }
        .shop-card:hover { box-shadow: 0 16px 52px rgba(61,26,26,0.13) !important; transform: translateY(-4px); }
        .shop-card:hover .shop-card-img { transform: scale(1.06) !important; }
        .shop-filter-btn { transition: all 0.22s ease; }
        .shop-filter-btn:hover { opacity: 1 !important; }
        @keyframes shimmer { 0%,100% { opacity: 0.35; } 50% { opacity: 0.7; } }
        .shop-skeleton { animation: shimmer 1.6s ease-in-out infinite; }
        .product-modal-panel::-webkit-scrollbar { width: 0; }
        @media (max-width: 900px) {
          .shop-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
        }
        @media (max-width: 520px) {
          .shop-grid { gap: 0.75rem !important; padding: 1.5rem 0.875rem 5rem !important; }
        }
        @media (min-width: 769px) {
          .product-modal-panel {
            border-radius: 16px !important;
            max-height: 88vh !important;
          }
        }
      `}</style>

      {/* Hero Banner */}
      <section style={{
        height: 'clamp(240px, 45vw, 400px)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('/assets/images/Original, simple, perfect..jpg')`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,7,7,0.52)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 2rem' }}>
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2.6rem, 7vw, 5.5rem)',
              fontWeight: 300, color: '#FDF6F0',
              margin: 0, letterSpacing: '0.06em', lineHeight: 1.1,
            }}
          >
            Our Collection
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'rgba(253,246,240,0.75)', marginTop: '1rem',
            }}
          >
            Handcrafted butterfly chocolates · Abu Dhabi
          </motion.p>
        </div>
      </section>

      {/* Filter Bar */}
      <div
        className="shop-filter-bar"
        style={{
          position: 'sticky', top: 'calc(var(--bar-h) + var(--nav-h))', zIndex: 50,
          background: 'var(--color-bg)', borderBottom: '1px solid rgba(61,26,26,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', padding: '0.875rem 1.5rem', flexWrap: 'nowrap',
          overflowX: 'auto',
        }}
      >
        {collections.map(col => {
          const active = activeFilter === col
          return (
            <button
              key={col}
              className="shop-filter-btn"
              onClick={() => setActiveFilter(col)}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '100px',
                border: `1px solid ${active ? '#3D1A1A' : 'rgba(61,26,26,0.2)'}`,
                background: active ? '#3D1A1A' : 'transparent',
                color: active ? '#FDF6F0' : '#3D1A1A',
                fontFamily: 'var(--font-sans)', fontSize: '0.66rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', fontWeight: active ? 600 : 400,
                opacity: active ? 1 : 0.68, whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {col}
            </button>
          )
        })}
      </div>

      {/* Skeleton loading */}
      {loading && (
        <div className="shop-grid" style={{
          maxWidth: '1380px', margin: '0 auto',
          padding: '2.5rem 2rem 6rem',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem',
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shop-skeleton" style={{
              background: 'rgba(61,26,26,0.07)', borderRadius: '12px', height: '360px',
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '7rem 2rem', textAlign: 'center',
          }}
        >
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300,
            color: '#3D1A1A', margin: '0 0 0.75rem', letterSpacing: '0.05em',
          }}>
            Coming Soon
          </p>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(61,26,26,0.42)', margin: 0,
          }}>
            Something beautiful is on its way
          </p>
        </motion.div>
      )}

      {/* Product Grid */}
      {!loading && products.length > 0 && (
        <div
          className="shop-grid"
          style={{
            maxWidth: '1380px', margin: '0 auto',
            padding: '2.5rem 2rem 7rem',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem',
          }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={setOpenProduct}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {openProduct && (
          <ProductModal product={openProduct} onClose={closeModal} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
