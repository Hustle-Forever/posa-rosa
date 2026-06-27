import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { getProducts, normalizeProduct } from '../lib/shopify'

function ProductCard({ product }) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { addToCart } = useCart()

  function handleAdd() {
    addToCart(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="product-card"
      style={{
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 24px rgba(61,26,26,0.07)',
      }}
    >
      {/* Image — inner overflow:hidden clips the zoom so it stays within the image bounds */}
      <div style={{
        position: 'relative',
        paddingBottom: '70%',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <img
          src={product.image}
          alt={product.name}
          className="product-card-img"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      </div>

      {/* Body */}
      <div style={{
        padding: '1.4rem 1.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}>

        {/* Collection — gold small-caps label */}
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.58rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--color-gold)',
          fontWeight: 600,
          display: 'block',
          marginBottom: '0.4rem',
        }}>
          {product.collection}
        </span>

        {/* Name — Cormorant 20px */}
        <h3 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.25rem',
          fontWeight: 400,
          color: 'var(--color-dark)',
          lineHeight: 1.25,
          margin: '0 0 0.45rem',
          letterSpacing: '0.01em',
        }}>
          {product.name}
        </h3>

        {/* Price — bold dark brown */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--color-dark)',
          margin: 0,
          letterSpacing: '0.03em',
        }}>
          AED {product.price}
          {product.unit && (
            <span style={{
              fontWeight: 400,
              opacity: 0.42,
              fontSize: '0.7rem',
              marginLeft: '0.3em',
            }}>
              / {product.unit}
            </span>
          )}
        </p>

        <div style={{ flex: 1, minHeight: '1.1rem' }} />

        {/* Quantity — elegant unified bar */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          border: '1px solid rgba(61,26,26,0.13)',
          borderRadius: '6px',
          overflow: 'hidden',
          height: '38px',
          marginBottom: '0.75rem',
        }}>
          <button
            className="shop-qty-btn"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            style={{
              width: '40px',
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid rgba(61,26,26,0.13)',
              cursor: 'pointer',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1.15rem',
              color: 'var(--color-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.18s ease',
            }}
          >−</button>
          <span style={{
            flex: 1,
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1rem',
            color: 'var(--color-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}>
            {qty}
          </span>
          <button
            className="shop-qty-btn"
            onClick={() => setQty(q => q + 1)}
            aria-label="Increase quantity"
            style={{
              width: '40px',
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              borderLeft: '1px solid rgba(61,26,26,0.13)',
              cursor: 'pointer',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: '1.15rem',
              color: 'var(--color-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.18s ease',
            }}
          >+</button>
        </div>

        {/* Add to Cart */}
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.98 }}
          animate={added ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.28 }}
          className="shop-add-btn"
          style={{
            width: '100%',
            padding: '0.875rem',
            background: added ? 'var(--color-gold)' : 'var(--color-dark)',
            color: added ? 'var(--color-dark)' : 'var(--color-gold)',
            border: 'none',
            borderRadius: '6px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.64rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'background 0.32s ease, color 0.32s ease',
          }}
        >
          {added ? '✓ Added to Cart' : 'Add to Cart'}
        </motion.button>
      </div>
    </motion.article>
  )
}

export default function ShopPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [products, setProducts] = useState([])
  const [collections, setCollections] = useState(['All'])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts()
      .then(raw => {
        const normalized = raw.map(normalizeProduct)
        setProducts(normalized)
        const unique = [...new Set(normalized.map(p => p.collection).filter(Boolean))]
        setCollections(['All', ...unique])
      })
      .catch(err => {
        console.error('Failed to load products:', err)
      })
      .finally(() => setLoading(false))
  }, [])

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
        .product-card { transition: box-shadow 0.45s ease, transform 0.45s ease !important; }
        .product-card:hover { box-shadow: 0 20px 64px rgba(61,26,26,0.13) !important; transform: translateY(-5px); }
        .product-card:hover .product-card-img { transform: scale(1.05); }
        .shop-qty-btn:hover { background: rgba(61,26,26,0.05) !important; }
        .shop-add-btn:hover { background: var(--color-gold) !important; color: var(--color-dark) !important; }
        .shop-filter-btn { transition: all 0.25s ease; }
        .shop-filter-btn:hover { opacity: 1 !important; }
        @keyframes shimmer { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
        .shop-skeleton { animation: shimmer 1.6s ease-in-out infinite; }
        @media (max-width: 900px) {
          .shop-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1.25rem !important; }
        }
        @media (max-width: 768px) {
          .shop-filter-bar { overflow-x: auto; padding: 0.875rem 1rem !important; justify-content: flex-start !important; }
          .shop-grid { gap: 1rem !important; padding: 2rem 1rem 5rem !important; }
        }
        @media (max-width: 480px) {
          .shop-grid { gap: 0.75rem !important; padding: 1.5rem 0.75rem 4rem !important; }
        }
      `}</style>

      {/* Hero Banner */}
      <section style={{
        height: '400px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('/assets/images/Original, simple, perfect..jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(22, 7, 7, 0.52)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 2rem' }}>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2.75rem, 7vw, 5.5rem)',
              fontWeight: 300,
              color: '#FDF6F0',
              margin: 0,
              letterSpacing: '0.06em',
              lineHeight: 1.1,
            }}
          >
            Our Collection
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(253,246,240,0.78)',
              marginTop: '1.1rem',
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
          position: 'sticky',
          top: 'calc(var(--bar-h) + var(--nav-h))',
          zIndex: 50,
          background: 'var(--color-bg)',
          borderBottom: '1px solid rgba(61,26,26,0.09)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.625rem',
          padding: '1rem 2rem',
          flexWrap: 'wrap',
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
                padding: '0.55rem 1.4rem',
                borderRadius: '100px',
                border: `1px solid ${active ? 'var(--color-dark)' : 'rgba(61,26,26,0.22)'}`,
                background: active ? 'var(--color-dark)' : 'transparent',
                color: active ? '#FDF6F0' : 'var(--color-dark)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.68rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
                opacity: active ? 1 : 0.72,
                whiteSpace: 'nowrap',
              }}
            >
              {col}
            </button>
          )
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          maxWidth: '1380px',
          margin: '0 auto',
          padding: '3.5rem 2.5rem 7rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.75rem',
        }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shop-skeleton"
              style={{
                background: 'rgba(61,26,26,0.07)',
                borderRadius: '12px',
                height: '380px',
              }}
            />
          ))}
        </div>
      )}

      {/* Coming Soon — no products after load */}
      {!loading && products.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7rem 2rem',
            gap: '1rem',
            textAlign: 'center',
          }}
        >
          <p style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 300,
            color: 'var(--color-dark)',
            margin: 0,
            letterSpacing: '0.06em',
          }}>
            Coming Soon
          </p>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.72rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-dark)',
            opacity: 0.5,
            margin: 0,
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
            maxWidth: '1380px',
            margin: '0 auto',
            padding: '3.5rem 2.5rem 7rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.75rem',
          }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
