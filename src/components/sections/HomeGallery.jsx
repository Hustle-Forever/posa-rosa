import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getProducts, normalizeProduct } from '../../lib/shopify'

const FALLBACK = [
  { id: 'f1',  handle: null, name: 'Original',      image: '/assets/images/Original, simple, perfect..jpg' },
  { id: 'f2',  handle: null, name: 'Red Velvet',     image: '/assets/images/Red velvet, but make it a butterfly..jpg' },
  { id: 'f3',  handle: null, name: 'Matcha',          image: '/assets/images/Butterflies fueled by matcha..jpg' },
  { id: 'f4',  handle: null, name: 'Kinder',          image: '/assets/images/Butterflies filled with Kinder love..jpg' },
  { id: 'f5',  handle: null, name: "S'mores",         image: "/assets/images/Butterfly, but make it smores..jpg" },
  { id: 'f6',  handle: null, name: 'Cappuccino',      image: '/assets/images/Cappuccino, but make it a butterfly..jpg' },
  { id: 'f7',  handle: null, name: 'Soft & Melty',    image: '/assets/images/Soft, melty, perfect..jpg' },
  { id: 'f8',  handle: null, name: 'Classic',         image: '/assets/images/One classic bite at a time..jpg' },
  { id: 'f9',  handle: null, name: 'Sweet & Simple',  image: '/assets/images/Sweet and simple..jpg' },
  { id: 'f10', handle: null, name: 'OG Posarosa',     image: '/assets/images/For the OG Posarosa lovers..jpg' },
]

// Aspect ratio pattern for editorial variety (3-cycle: portrait, square, square)
const RATIOS = ['3/4', '1/1', '4/5']

function GalleryItem({ product, index }) {
  const navigate = useNavigate()
  const aspectRatio = RATIOS[index % RATIOS.length]

  function handleClick() {
    navigate(product.handle ? `/shop?product=${product.handle}` : '/shop')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07 }}
      className="gallery-tile"
      onClick={handleClick}
      style={{
        breakInside: 'avoid',
        marginBottom: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio,
        display: 'block',
        position: 'relative',
      }}
    >
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />
      {/* Desktop name overlay */}
      <div className="gallery-overlay" style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(61,26,26,0.75) 0%, transparent 55%)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '1rem 1.1rem',
        opacity: 0,
        transition: 'opacity 0.35s ease',
      }}>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1rem',
          fontWeight: 300,
          color: '#FDF6F0',
          letterSpacing: '0.03em',
          lineHeight: 1.2,
        }}>
          {product.name}
        </span>
      </div>
    </motion.div>
  )
}

export default function HomeGallery() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getProducts()
      .then(raw => {
        const normalized = raw.map(normalizeProduct)
        setProducts(normalized.length > 0 ? normalized : FALLBACK)
      })
      .catch(() => setProducts(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const items = loading ? [] : (products.length > 0 ? products : FALLBACK)

  return (
    <section id="chocolates" style={{ background: '#FDF6F0', paddingTop: '80px' }}>
      <style>{`
        .gallery-tile:hover img { transform: scale(1.06); }
        .gallery-tile:hover .gallery-overlay { opacity: 1 !important; }
        .gallery-col-wrap { column-count: 2; column-gap: 4px; }
        @media (min-width: 768px) {
          .gallery-col-wrap { column-count: 3; }
        }
        @media (min-width: 1200px) {
          .gallery-col-wrap { column-count: 4; }
        }
      `}</style>

      {/* Heading */}
      <div style={{ textAlign: 'center', padding: '0 1.5rem 3rem' }}>
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.4rem, 6vw, 4.8rem)',
            fontWeight: 300,
            color: 'var(--color-dark)',
            letterSpacing: '0.06em',
            lineHeight: 1.08,
            margin: '0 0 0.75rem',
          }}
        >
          Our Chocolates
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(61,26,26,0.62)',
            margin: 0,
          }}
        >
          Handcrafted butterfly chocolates · Abu Dhabi
        </motion.p>
      </div>

      {/* Masonry gallery — no horizontal padding, full bleed */}
      {loading ? (
        <div style={{ height: '60vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            border: '2px solid rgba(61,26,26,0.15)',
            borderTopColor: 'var(--color-gold)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className="gallery-col-wrap">
          {items.slice(0, 12).map((product, i) => (
            <GalleryItem key={product.id ?? i} product={product} index={i} />
          ))}
        </div>
      )}

      {/* View All CTA */}
      <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem 5rem' }}>
        <motion.button
          onClick={() => navigate('/shop')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: '1rem 3.5rem',
            border: '1px solid var(--color-dark)',
            background: 'transparent',
            color: 'var(--color-dark)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-dark)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-dark)' }}
        >
          Shop All
        </motion.button>
      </div>
    </section>
  )
}
