import { motion } from 'framer-motion'

const PRODUCTS = [
  { file: "Beige, sweet & caffeinated..jpg",          name: "Beige, Sweet & Caffeinated" },
  { file: "Butterflies filled with Kinder love..jpg", name: "Butterflies Filled with Kinder Love" },
  { file: "Butterflies fueled by matcha..jpg",        name: "Butterflies Fueled by Matcha" },
  { file: "Butterfly, but make it s'mores..jpg",      name: "Butterfly, But Make It S'mores" },
  { file: "Cappuccino, but make it a butterfly..jpg", name: "Cappuccino Butterfly" },
  { file: "Couldnt resist taking a bite!.jpg",        name: "Couldn't Resist Taking a Bite" },
  { file: "For the OG Posarosa lovers..jpg",          name: "For the OG Posa Rosa Lovers" },
  { file: "For the matcha-obsessed only..jpg",        name: "For the Matcha-Obsessed Only" },
  { file: "For the red velvet lovers..jpg",           name: "For the Red Velvet Lovers" },
  { file: "Kinder lovers, this one's yours..jpg",     name: "Kinder Lovers, This One's Yours" },
  { file: "Little red velvet wings..jpg",             name: "Little Red Velvet Wings" },
  { file: "Matcha, but make it a butterfly..jpg",     name: "Matcha Butterfly" },
  { file: "One bite, full Kinder nostalgia..jpg",     name: "One Bite, Full Kinder Nostalgia" },
  { file: "One classic bite at a time..jpg",          name: "One Classic Bite at a Time" },
  { file: "Original, simple, perfect..jpg",           name: "Original, Simple, Perfect" },
  { file: "Red velvet, but make it a butterfly..jpg", name: "Red Velvet Butterfly" },
  { file: "Soft, melty, perfect..jpg",                name: "Soft, Melty, Perfect" },
  { file: "Sweet and simple..jpg",                    name: "Sweet and Simple" },
  { file: "S'mores, no campfire needed..jpg",         name: "S'mores, No Campfire Needed" },
]

const p = (i) => `/assets/images/${PRODUCTS[i].file}`
const n = (i) => PRODUCTS[i].name

const ROW_HEIGHT_LG = 'clamp(280px, 38vw, 560px)'
const ROW_HEIGHT_SM = 'clamp(220px, 28vw, 420px)'

const fadeUp = {
  hidden:  { opacity: 0, y: 44 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}

export default function ProductGrid() {
  return (
    <section
      id="chocolates"
      style={{ backgroundColor: 'var(--color-bg)', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.2rem, 4vw, 4rem)' }}
    >
      <div style={{ maxWidth: '1380px', margin: '0 auto' }}>
        {/* Title */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 5.5rem)' }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.8rem, 7vw, 6rem)',
              fontWeight: 300,
              color: 'var(--color-dark)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              marginBottom: '1rem',
            }}
          >
            Our Butterflies
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-text)',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              opacity: 0.58,
              letterSpacing: '0.04em',
            }}
          >
            Each piece handcrafted, shaped like a butterfly
          </p>
        </motion.div>

        {/* Grid rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Row 1 — 60 / 40 */}
          <GridRow delay={0}>
            <ProductCard src={p(0)} name={n(0)} style={{ flex: '0 0 60%', height: ROW_HEIGHT_LG }} />
            <ProductCard src={p(1)} name={n(1)} style={{ flex: '1 1 0', height: ROW_HEIGHT_LG }} />
          </GridRow>

          {/* Row 2 — 3 equal */}
          <GridRow delay={0.08}>
            <ProductCard src={p(2)} name={n(2)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
            <ProductCard src={p(3)} name={n(3)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
            <ProductCard src={p(4)} name={n(4)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
          </GridRow>

          {/* Row 3 — 40 / 60 */}
          <GridRow delay={0.04}>
            <ProductCard src={p(5)} name={n(5)} style={{ flex: '1 1 0', height: ROW_HEIGHT_LG }} />
            <ProductCard src={p(6)} name={n(6)} style={{ flex: '0 0 60%', height: ROW_HEIGHT_LG }} />
          </GridRow>

          {/* Row 4 — 60 / 40 */}
          <GridRow delay={0.06}>
            <ProductCard src={p(7)} name={n(7)} style={{ flex: '0 0 60%', height: ROW_HEIGHT_LG }} />
            <ProductCard src={p(8)} name={n(8)} style={{ flex: '1 1 0', height: ROW_HEIGHT_LG }} />
          </GridRow>

          {/* Row 5 — 3 equal */}
          <GridRow delay={0.05}>
            <ProductCard src={p(9)}  name={n(9)}  style={{ flex: 1, height: ROW_HEIGHT_SM }} />
            <ProductCard src={p(10)} name={n(10)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
            <ProductCard src={p(11)} name={n(11)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
          </GridRow>

          {/* Row 6 — 40 / 60 */}
          <GridRow delay={0.04}>
            <ProductCard src={p(12)} name={n(12)} style={{ flex: '1 1 0', height: ROW_HEIGHT_LG }} />
            <ProductCard src={p(13)} name={n(13)} style={{ flex: '0 0 60%', height: ROW_HEIGHT_LG }} />
          </GridRow>

          {/* Row 7 — 3 equal */}
          <GridRow delay={0.06}>
            <ProductCard src={p(14)} name={n(14)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
            <ProductCard src={p(15)} name={n(15)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
            <ProductCard src={p(16)} name={n(16)} style={{ flex: 1, height: ROW_HEIGHT_SM }} />
          </GridRow>

          {/* Row 8 — 60 / 40 */}
          <GridRow delay={0.04}>
            <ProductCard src={p(17)} name={n(17)} style={{ flex: '0 0 60%', height: ROW_HEIGHT_LG }} />
            <ProductCard src={p(18)} name={n(18)} style={{ flex: '1 1 0', height: ROW_HEIGHT_LG }} />
          </GridRow>

        </div>
      </div>
    </section>
  )
}

function GridRow({ children, delay = 0 }) {
  return (
    <motion.div
      className="product-row"
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function ProductCard({ src, name, style }) {
  return (
    <div
      className="product-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        minWidth: 0,
        ...style,
      }}
    >
      <img
        className="product-card-img"
        src={src}
        alt={name}
        loading="lazy"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <div
        className="product-card-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(160deg, rgba(61,26,26,0.78) 0%, rgba(30,10,10,0.82) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          padding: '1.5rem',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.6rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
            marginBottom: '0.6rem',
            opacity: 0.85,
          }}
        >
          Posa Rosa
        </span>
        <p
          style={{
            color: '#FDF6F0',
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1rem, 2.2vw, 1.5rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.25,
            letterSpacing: '0.01em',
          }}
        >
          {name}
        </p>
      </div>
    </div>
  )
}
