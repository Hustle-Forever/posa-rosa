import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'

const COLLECTIONS = ['All', 'Classic Collection', 'Matcha Series', 'Kinder & Red Velvet']

const PRODUCTS = [
  { id: 1,  name: 'The Original',      collection: 'Classic Collection',  image: '/assets/images/Original, simple, perfect..jpg',            price: 15,  unit: 'piece'     },
  { id: 2,  name: 'Soft & Melty',      collection: 'Classic Collection',  image: '/assets/images/Soft, melty, perfect..jpg',                 price: 15,  unit: 'piece'     },
  { id: 3,  name: 'Sweet & Simple',    collection: 'Classic Collection',  image: '/assets/images/Sweet and simple..jpg',                     price: 75,  unit: 'box of 6'  },
  { id: 4,  name: 'Matcha Butterfly',  collection: 'Matcha Series',       image: '/assets/images/Matcha, but make it a butterfly..jpg',      price: 15,  unit: 'piece'     },
  { id: 5,  name: 'Matcha Fueled',     collection: 'Matcha Series',       image: '/assets/images/Butterflies fueled by matcha..jpg',         price: 75,  unit: 'box of 6'  },
  { id: 6,  name: 'Matcha Obsessed',   collection: 'Matcha Series',       image: '/assets/images/For the matcha-obsessed only..jpg',         price: 140, unit: 'box of 12' },
  { id: 7,  name: 'Kinder Love',       collection: 'Kinder & Red Velvet', image: '/assets/images/Butterflies filled with Kinder love..jpg', price: 15,  unit: 'piece'     },
  { id: 8,  name: 'Red Velvet',        collection: 'Kinder & Red Velvet', image: '/assets/images/For the red velvet lovers..jpg',            price: 75,  unit: 'box of 6'  },
  { id: 9,  name: 'Red Velvet Wings',  collection: 'Kinder & Red Velvet', image: '/assets/images/Little red velvet wings..jpg',              price: 15,  unit: 'piece'     },
  { id: 10, name: 'Cappuccino',        collection: 'Classic Collection',  image: '/assets/images/Cappuccino, but make it a butterfly..jpg',  price: 75,  unit: 'box of 6'  },
]

const qtyBtnStyle = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: '1px solid rgba(61,26,26,0.22)',
  borderRadius: '50%',
  cursor: 'pointer',
  fontFamily: 'Cormorant Garamond, Georgia, serif',
  fontSize: '1.15rem',
  color: 'var(--color-dark)',
  transition: 'all 0.22s ease',
  flexShrink: 0,
}

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
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', paddingBottom: '65%', overflow: 'hidden' }}>
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
          }}
        />
      </div>

      {/* Body */}
      <div style={{
        padding: '1.25rem 1.4rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        flex: 1,
      }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-gold)',
          fontWeight: 600,
        }}>
          {product.collection}
        </span>

        <h3 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.375rem',
          fontWeight: 400,
          color: 'var(--color-dark)',
          lineHeight: 1.2,
          margin: 0,
        }}>
          {product.name}
        </h3>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--color-dark)',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          AED {product.price}{' '}
          <span style={{ fontWeight: 400, opacity: 0.5, fontSize: '0.73rem' }}>/ {product.unit}</span>
        </p>

        <div style={{ flex: 1, minHeight: '0.5rem' }} />

        {/* Quantity selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginTop: '0.25rem' }}>
          <button
            className="shop-qty-btn"
            onClick={() => setQty(q => Math.max(1, q - 1))}
            style={qtyBtnStyle}
            aria-label="Decrease quantity"
          >−</button>
          <span style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.125rem',
            color: 'var(--color-dark)',
            minWidth: '1.25rem',
            textAlign: 'center',
          }}>{qty}</span>
          <button
            className="shop-qty-btn"
            onClick={() => setQty(q => q + 1)}
            style={qtyBtnStyle}
            aria-label="Increase quantity"
          >+</button>
        </div>

        {/* Add to Cart */}
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.97 }}
          animate={added ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          className="shop-add-btn"
          style={{
            width: '100%',
            padding: '0.875rem',
            background: added ? 'var(--color-gold)' : 'var(--color-dark)',
            color: added ? 'var(--color-dark)' : 'var(--color-gold)',
            border: 'none',
            borderRadius: '6px',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: 600,
            marginTop: '0.5rem',
            transition: 'background 0.3s ease, color 0.3s ease',
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

  const filtered = activeFilter === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.collection === activeFilter)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: 'calc(var(--bar-h) + var(--nav-h))' }}
    >
      <style>{`
        .product-card:hover { box-shadow: 0 12px 52px rgba(61,26,26,0.14) !important; transform: translateY(-3px); }
        .shop-qty-btn:hover { background: var(--color-dark) !important; color: var(--color-gold) !important; border-color: var(--color-dark) !important; }
        .shop-add-btn:hover { background: var(--color-gold) !important; color: var(--color-dark) !important; }
        .shop-filter-btn { transition: all 0.25s ease; }
        .shop-filter-btn:hover { opacity: 1 !important; }
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
        {COLLECTIONS.map(col => {
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

      {/* Product Grid */}
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
    </motion.div>
  )
}
