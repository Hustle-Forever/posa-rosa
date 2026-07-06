import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProducts, normalizeProduct } from '../lib/shopify'
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock'
import { EMIRATE_AREAS, EMIRATES, getDeliveryFee, getDeliveryTiming, getFulfillment, setFulfillment } from '../lib/fulfillment'

const BOX_SIZE   = 20
const BOX_PRICE  = 165
const MIN_FLAVORS = 2
const MAX_FLAVORS = 5

// ─── FULFILLMENT SELECTOR (Delivery-only: Emirate → Area) ────────────────────

function FulfillmentSelector({ onComplete }) {
  const [selectedEm,   setSelectedEm]   = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [areaCustom,   setAreaCustom]   = useState('')

  const areaOptions = selectedEm ? (EMIRATE_AREAS[selectedEm] || []) : []

  function pickEmirate(em) {
    setSelectedEm(em)
    setSelectedArea('')
    setAreaCustom('')
  }

  function handleAreaContinue() {
    const finalArea = selectedArea === 'Other' ? areaCustom.trim() : selectedArea
    if (!finalArea) return
    onComplete({ type: 'delivery', emirate: selectedEm, area: finalArea })
  }

  const canContinueArea = selectedArea && (selectedArea !== 'Other' || areaCustom.trim())
  const fee = getDeliveryFee(selectedEm)

  return (
    <div style={{
      maxWidth: '680px', margin: '0 auto',
      padding: 'clamp(2rem, 5vw, 3.5rem) 1.25rem 4rem',
    }}>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
        {['Select Emirate', selectedEm ? 'Select Area' : null]
          .filter(Boolean).map((label, i, arr) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.14em',
              textTransform: 'uppercase', fontWeight: 600,
              color: i === arr.length - 1 ? 'var(--color-dark)' : 'rgba(100,70,72,0.4)',
            }}>{label}</span>
            {i < arr.length - 1 && (
              <svg viewBox="0 0 8 8" fill="none" width="7" height="7">
                <path d="M1 4h6M5 2l2 2-2 2" stroke="rgba(61,26,26,0.25)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Emirate ── */}
        {!selectedEm && (
          <motion.div key="emirate"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 300, color: 'var(--color-dark)', margin: 0 }}>
                  Which emirate are you in?
                </h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {EMIRATES.map(em => (
                <button key={em} onClick={() => pickEmirate(em)}
                  data-testid={`emirate-${em.replace(/\s+/g, '-')}`}
                  style={{
                    background: '#fff', border: '1.5px solid rgba(201,160,163,0.3)',
                    borderRadius: '12px', padding: '1.1rem 1.25rem',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-dark)'; e.currentTarget.style.background = '#FAF3EE' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,160,163,0.3)'; e.currentTarget.style.background = '#fff' }}
                >
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', fontWeight: 500, color: 'var(--color-dark)' }}>{em}</span>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.58rem', fontWeight: 600,
                    color: em === 'Abu Dhabi' ? 'var(--color-gold)' : 'rgba(61,26,26,0.65)',
                    letterSpacing: '0.08em',
                  }}>
                    AED {em === 'Abu Dhabi' ? 35 : 40}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Area ── */}
        {selectedEm && (
          <motion.div key="area"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <button onClick={() => setSelectedEm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: 'var(--color-dark)', display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
                  <path d="M13 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 300, color: 'var(--color-dark)', margin: 0 }}>
                  Select your area in {selectedEm}
                </h2>
              </div>
            </div>

            <div data-testid="area-fee-info" style={{
              background: 'rgba(201,169,110,0.08)', borderRadius: '10px',
              padding: '0.6rem 1rem', marginBottom: '1.5rem', marginLeft: '2.25rem',
              display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
            }}>
              <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                <circle cx="8" cy="8" r="7" stroke="var(--color-gold)" strokeWidth="1.5"/>
                <path d="M8 5v4M8 11v.5" stroke="var(--color-gold)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.66rem', color: 'var(--color-dark)', letterSpacing: '0.04em' }}>
                Delivery fee: <strong>AED {fee}</strong>
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.06em',
                padding: '0.15rem 0.5rem', borderRadius: '100px',
                background: selectedEm === 'Abu Dhabi' ? 'rgba(201,169,110,0.18)' : 'rgba(201,160,163,0.2)',
                color: selectedEm === 'Abu Dhabi' ? 'var(--color-gold)' : 'var(--color-dark)',
                fontWeight: 600,
              }}>
                {selectedEm === 'Abu Dhabi' ? 'Same-day delivery' : 'Next-day delivery'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {areaOptions.map(area => (
                <button key={area}
                  onClick={() => setSelectedArea(area)}
                  data-testid={`area-${area.replace(/\s+/g, '-')}`}
                  style={{
                    background: selectedArea === area ? 'var(--color-dark)' : '#fff',
                    color: selectedArea === area ? '#fff' : 'var(--color-dark)',
                    border: `1.5px solid ${selectedArea === area ? 'var(--color-dark)' : 'rgba(201,160,163,0.28)'}`,
                    borderRadius: '10px', padding: '0.875rem 1.25rem',
                    cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'var(--font-sans)', fontSize: '0.84rem', fontWeight: selectedArea === area ? 600 : 400,
                    transition: 'all 0.18s ease',
                  }}
                >
                  {area}
                </button>
              ))}
            </div>

            {selectedArea === 'Other' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Type your area or neighbourhood…"
                  value={areaCustom}
                  onChange={e => setAreaCustom(e.target.value)}
                  data-testid="area-other-input"
                  style={{
                    width: '100%', padding: '0.82rem 1rem', boxSizing: 'border-box',
                    background: '#fff', border: '1.5px solid var(--color-dark)',
                    borderRadius: '10px', fontFamily: 'var(--font-sans)',
                    fontSize: '0.86rem', color: 'var(--color-dark)', outline: 'none',
                  }}
                  autoFocus
                />
              </motion.div>
            )}

            <button
              onClick={handleAreaContinue}
              disabled={!canContinueArea}
              data-testid="btn-area-continue"
              style={{
                width: '100%', padding: '1rem',
                background: canContinueArea ? 'var(--color-dark)' : 'rgba(201,160,163,0.2)',
                color: canContinueArea ? '#fff' : 'rgba(100,70,72,0.45)',
                border: 'none', borderRadius: '10px',
                fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
                cursor: canContinueArea ? 'pointer' : 'default',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              Continue to Products
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

// ─── FULFILLMENT SUMMARY CHIP ─────────────────────────────────────────────────

function FulfillmentSummary({ data, onChange }) {
  if (!data) return null
  const fee = getDeliveryFee(data.emirate)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.875rem', padding: '0.75rem 1.5rem',
      borderBottom: '1px solid rgba(201,160,163,0.18)',
      background: 'rgba(201,160,163,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: 'var(--color-gold)', flexShrink: 0,
        }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'var(--color-dark)', letterSpacing: '0.04em' }}>
          {`Delivery to ${data.emirate}${data.area ? ` · ${data.area}` : ''} — AED ${fee}`}
        </span>
      </div>
      <button onClick={onChange}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: '0.62rem',
          color: 'rgba(100,70,72,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase',
          fontWeight: 500, padding: '0.2rem 0.5rem',
          borderRadius: '4px', transition: 'color 0.18s ease',
          textDecoration: 'underline', textDecorationStyle: 'dotted',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-dark)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(100,70,72,0.55)'}
      >
        Change
      </button>
    </div>
  )
}

// ─── MIX BOX CARD ─────────────────────────────────────────────────────────────

function MixBoxCard({ onOpen }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="mix-box-card"
      onClick={onOpen}
      data-testid="mix-box-card"
      style={{
        gridColumn: '1 / -1',
        background: 'var(--color-dark)',
        borderRadius: '16px', overflow: 'hidden',
        cursor: 'pointer', position: 'relative',
        minHeight: '160px',
        display: 'flex', alignItems: 'center',
        boxShadow: '0 4px 28px rgba(201,160,163,0.35)',
        transition: 'transform 0.35s ease, box-shadow 0.35s ease',
      }}
    >
      {/* Decorative butterfly rings */}
      <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', border: '1.5px solid rgba(201,169,110,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '160px', height: '160px', borderRadius: '50%', border: '1.5px solid rgba(201,169,110,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: '60%', bottom: '-30px', width: '140px', height: '140px', borderRadius: '50%', border: '1.5px solid rgba(201,169,110,0.07)', pointerEvents: 'none' }} />

      <div style={{ padding: 'clamp(1.5rem, 3vw, 2.25rem) clamp(1.5rem, 4vw, 2.75rem)', flex: 1, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between' }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.58rem',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--color-gold)', fontWeight: 600, display: 'block', marginBottom: '0.4rem',
            }}>
              Create Your Own
            </span>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.7rem, 4vw, 2.6rem)', fontWeight: 300,
              color: '#FDF6F0', margin: '0 0 0.5rem', lineHeight: 1.1,
            }}>
              Mix Box
            </h3>
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
              color: 'rgba(253,246,240,0.6)', letterSpacing: '0.06em',
              margin: '0 0 1.25rem',
            }}>
              20 pieces · 2–5 flavors · AED {BOX_PRICE}
            </p>
            <button
              onClick={e => { e.stopPropagation(); onOpen() }}
              style={{
                padding: '0.75rem 1.75rem',
                background: 'var(--color-gold)', color: '#3D1A1A',
                border: 'none', borderRadius: '100px',
                fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontWeight: 700, cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
            >
              Build Your Box →
            </button>
          </div>

          {/* Flavor preview dots */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxWidth: '200px' }}>
            {['Original', 'Kinder', 'Cappuccino', 'Matcha', 'Red Velvet'].map((name, i) => (
              <span key={name} style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.6rem',
                color: 'rgba(253,246,240,0.55)', letterSpacing: '0.08em',
                background: 'rgba(253,246,240,0.07)', padding: '0.2rem 0.7rem',
                borderRadius: '100px', border: '1px solid rgba(253,246,240,0.12)',
                whiteSpace: 'nowrap',
                animationDelay: `${i * 0.1}s`,
              }}>
                {name}
              </span>
            ))}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', color: 'rgba(253,246,240,0.35)', letterSpacing: '0.08em' }}>
              +more
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

// ─── MIX BOX MODAL ────────────────────────────────────────────────────────────

const MIX_BOX_EXCLUDED_HANDLES = ['matcha-bottle']

function MixBoxModal({ products, onClose }) {
  const { addToCart, openDrawer } = useCart()
  const [flavors, setFlavors] = useState({})  // { productId: qty }
  const [added,   setAdded]   = useState(false)

  const flavorProducts  = products.filter(p => !MIX_BOX_EXCLUDED_HANDLES.includes(p.handle))
  const selectedEntries = Object.entries(flavors).filter(([, q]) => q > 0)
  const totalPcs        = selectedEntries.reduce((s, [, q]) => s + q, 0)
  const flavorCount     = selectedEntries.length
  const isComplete      = totalPcs === BOX_SIZE && flavorCount >= MIN_FLAVORS && flavorCount <= MAX_FLAVORS
  const remaining       = BOX_SIZE - totalPcs
  const progress        = Math.min(totalPcs / BOX_SIZE, 1)

  function setQty(id, qty) {
    setFlavors(prev => {
      if (qty <= 0) {
        const n = { ...prev }; delete n[id]; return n
      }
      return { ...prev, [id]: qty }
    })
  }

  function increment(id) {
    if (totalPcs >= BOX_SIZE) return
    const current = flavors[id] || 0
    if (current === 0 && flavorCount >= MAX_FLAVORS) return
    setQty(id, current + 1)
  }

  function decrement(id) {
    const current = flavors[id] || 0
    if (current <= 0) return
    setQty(id, current - 1)
  }

  function handleAdd() {
    if (!isComplete) return
    const mixBoxFlavors = selectedEntries.map(([id, qty]) => ({
      name: flavorProducts.find(p => p.id === id)?.name || id,
      qty,
    }))
    addToCart({
      id: `mix-box-${Date.now()}`,
      name: 'Mix Box (20 pcs)',
      price: BOX_PRICE,
      variantId: null,
      customItem: 'mix-box',
      mixBoxFlavors,
      image: null,
    }, 1)
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose(); openDrawer() }, 600)
  }

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => { lockBodyScroll(); return unlockBodyScroll }, [])

  // Progress bar color
  const barColor = isComplete ? 'var(--color-gold)' : totalPcs > BOX_SIZE ? '#c0392b' : 'var(--color-dark)'

  return (
    <AnimatePresence>
      <motion.div key="mb-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(22,7,7,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div key="mb-panel"
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#FDF6F0', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: '560px', maxHeight: '92vh',
            overflowY: 'auto', position: 'relative',
          }}
        >
          {/* Close */}
          <button onClick={onClose} aria-label="Close"
            style={{
              position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(201,160,163,0.12)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-dark)',
            }}
          >
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
              <path d="M2 2l14 14M16 2L2 16" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ padding: '1.75rem 1.75rem 0' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-gold)', fontWeight: 600 }}>
              Customize
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.7rem, 5vw, 2.2rem)', fontWeight: 400, color: 'var(--color-dark)', margin: '0.3rem 0 0.25rem' }}>
              Build Your Mix Box
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(61,26,26,0.68)', margin: '0 0 1.5rem', letterSpacing: '0.04em' }}>
              Choose 2–5 flavors · 20 pieces total · AED {BOX_PRICE}
            </p>

            {/* Progress bar */}
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{
                height: '6px', borderRadius: '100px',
                background: 'rgba(61,26,26,0.1)', overflow: 'hidden',
              }}>
                <motion.div
                  animate={{ width: `${progress * 100}%`, background: barColor }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%', borderRadius: '100px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.72rem', fontWeight: 600,
                  color: isComplete ? 'var(--color-gold)' : 'var(--color-dark)',
                  transition: 'color 0.3s ease',
                }}>
                  {totalPcs} / {BOX_SIZE} pieces
                  {isComplete && ' ✓'}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'rgba(61,26,26,0.65)' }}>
                  {remaining > 0 ? `${remaining} more to add` : remaining === 0 ? 'Box complete!' : 'Over limit'}
                </span>
              </div>
            </div>

            {/* Flavor constraints hint */}
            <p style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
              color: flavorCount > MAX_FLAVORS || (flavorCount < MIN_FLAVORS && totalPcs === BOX_SIZE) ? '#c0392b' : 'rgba(61,26,26,0.4)',
              margin: '0 0 1rem', letterSpacing: '0.03em',
            }}>
              {flavorCount} / {MAX_FLAVORS} flavors selected
            </p>
          </div>

          {/* Flavor list */}
          <div style={{ padding: '0 1.75rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {flavorProducts.map((product, i) => {
              const qty      = flavors[product.id] || 0
              const selected = qty > 0
              const canInc   = totalPcs < BOX_SIZE && (selected || flavorCount < MAX_FLAVORS)
              const canDec   = qty > 0

              return (
                <div key={product.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 0',
                    borderBottom: i < flavorProducts.length - 1 ? '1px solid rgba(61,26,26,0.07)' : 'none',
                    opacity: !selected && flavorCount >= MAX_FLAVORS ? 0.45 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '8px', flexShrink: 0, overflow: 'hidden',
                    background: 'rgba(201,160,163,0.06)', border: `2px solid ${selected ? 'var(--color-dark)' : 'transparent'}`,
                    transition: 'border-color 0.18s ease',
                  }}>
                    {product.image && <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', fontWeight: selected ? 600 : 400, color: 'var(--color-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </p>
                  </div>

                  {/* Stepper */}
                  <div style={{
                    display: 'flex', alignItems: 'stretch',
                    border: '1px solid rgba(61,26,26,0.18)', borderRadius: '8px',
                    overflow: 'hidden', height: '36px', flexShrink: 0,
                    background: selected ? 'var(--color-dark)' : '#fff',
                    transition: 'background 0.18s ease',
                  }}>
                    <button onClick={() => decrement(product.id)} disabled={!canDec}
                      aria-label={`Remove ${product.name}`}
                      style={{
                        width: '36px', background: 'transparent', border: 'none',
                        borderRight: `1px solid ${selected ? 'rgba(253,246,240,0.15)' : 'rgba(61,26,26,0.13)'}`,
                        cursor: canDec ? 'pointer' : 'default',
                        color: selected ? '#FDF6F0' : 'var(--color-dark)',
                        fontFamily: 'var(--font-serif)', fontSize: '1.2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: canDec ? 1 : 0.3,
                      }}
                    >−</button>
                    <span style={{
                      width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 600,
                      color: selected ? '#FDF6F0' : 'var(--color-dark)',
                    }}>{qty}</span>
                    <button onClick={() => increment(product.id)} disabled={!canInc}
                      aria-label={`Add ${product.name}`}
                      style={{
                        width: '36px', background: 'transparent', border: 'none',
                        borderLeft: `1px solid ${selected ? 'rgba(253,246,240,0.15)' : 'rgba(61,26,26,0.13)'}`,
                        cursor: canInc ? 'pointer' : 'default',
                        color: selected ? '#FDF6F0' : 'var(--color-dark)',
                        fontFamily: 'var(--font-serif)', fontSize: '1.2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: canInc ? 1 : 0.3,
                      }}
                    >+</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer: Add to Cart */}
          <div style={{ padding: '1.25rem 1.75rem 2rem', position: 'sticky', bottom: 0, background: '#FDF6F0', borderTop: '1px solid rgba(61,26,26,0.08)' }}>
            {!isComplete && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.66rem', color: 'rgba(61,26,26,0.65)', textAlign: 'center', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                {flavorCount < MIN_FLAVORS
                  ? `Select at least ${MIN_FLAVORS} flavors`
                  : remaining !== 0
                    ? `Add ${remaining} more piece${remaining !== 1 ? 's' : ''} to complete your box`
                    : `Adjust to exactly ${BOX_SIZE} pieces`
                }
              </p>
            )}
            <motion.button
              onClick={handleAdd}
              disabled={!isComplete}
              whileTap={isComplete ? { scale: 0.97 } : {}}
              animate={added ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              data-testid="mixbox-add-to-cart"
              style={{
                width: '100%', padding: '1rem',
                background: added ? 'var(--color-gold)' : isComplete ? 'var(--color-dark)' : 'rgba(201,160,163,0.2)',
                color: added ? '#3D2020' : isComplete ? '#fff' : 'rgba(100,70,72,0.45)',
                border: 'none', borderRadius: '10px',
                fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
                cursor: isComplete ? 'pointer' : 'default',
                transition: 'background 0.3s ease, color 0.3s ease',
              }}
            >
              {added ? '✓ Added to Cart' : `Add to Cart — AED ${BOX_PRICE}`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────

function ProductModal({ product, onClose }) {
  const [qty, setQty]     = useState(1)
  const [added, setAdded] = useState(false)
  const { addToCart, openDrawer } = useCart()

  const handleAdd = useCallback(() => {
    addToCart(product, qty)
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose(); openDrawer() }, 600)
  }, [addToCart, openDrawer, onClose, product, qty])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => { lockBodyScroll(); return unlockBodyScroll }, [])

  return (
    <AnimatePresence>
      <motion.div key="modal-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(22,7,7,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <motion.div key="modal-panel"
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          onClick={e => e.stopPropagation()}
          className="product-modal-panel"
          style={{
            background: '#FDF6F0', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: '540px', maxHeight: '92vh',
            overflowY: 'auto', position: 'relative',
          }}
        >
          <button onClick={onClose} aria-label="Close"
            style={{
              position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(201,160,163,0.12)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-dark)', transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,160,163,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,160,163,0.12)'}
          >
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
              <path d="M2 2l14 14M16 2L2 16" strokeLinecap="round"/>
            </svg>
          </button>

          <div style={{ width: '100%', paddingBottom: '85%', position: 'relative', overflow: 'hidden', borderRadius: '20px 20px 0 0', background: 'rgba(61,26,26,0.04)' }}>
            {product.image ? (
              <img src={product.image} alt={product.name}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(61,26,26,0.18)" strokeWidth="1" width="48" height="48">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
          </div>

          <div style={{ padding: '1.75rem 1.75rem 2rem' }}>
            {product.collection && (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.58rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-gold)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                {product.collection}
              </span>
            )}
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 400, color: 'var(--color-dark)', letterSpacing: '0.02em', lineHeight: 1.2, margin: '0 0 0.5rem' }}>
              {product.name}
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-dark)', margin: '0 0 1rem', letterSpacing: '0.02em' }}>
              AED {Number(product.price).toFixed(0)}
              {product.unit && <span style={{ fontWeight: 400, opacity: 0.42, fontSize: '0.82rem', marginLeft: '0.3em' }}>/ {product.unit}</span>}
            </p>
            {product.description && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'rgba(61,26,26,0.75)', lineHeight: 1.75, margin: '0 0 1.5rem' }}>
                {product.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid rgba(201,160,163,0.28)', borderRadius: '8px', overflow: 'hidden', height: '48px', flexShrink: 0 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: '42px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(201,160,163,0.2)', cursor: 'pointer', color: 'var(--color-dark)', fontFamily: 'var(--font-serif)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  −
                </button>
                <span style={{ width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--color-dark)' }}>
                  {qty}
                </span>
                <button onClick={() => setQty(q => q + 1)}
                  style={{ width: '42px', background: 'transparent', border: 'none', borderLeft: '1px solid rgba(201,160,163,0.2)', cursor: 'pointer', color: 'var(--color-dark)', fontFamily: 'var(--font-serif)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  +
                </button>
              </div>

              <motion.button onClick={handleAdd} whileTap={{ scale: 0.97 }}
                animate={added ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                style={{
                  flex: 1, height: '48px',
                  background: added ? 'var(--color-gold)' : 'var(--color-dark)',
                  color: added ? '#3D2020' : '#fff',
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
    <motion.article layout
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="shop-card" onClick={() => onOpen(product)}
      style={{
        background: '#fff', borderRadius: '12px', overflow: 'hidden',
        cursor: 'pointer', boxShadow: '0 2px 16px rgba(61,26,26,0.06)',
        border: '1px solid rgba(61,26,26,0.06)', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', paddingBottom: '100%', overflow: 'hidden', flexShrink: 0, background: 'rgba(61,26,26,0.04)' }}>
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className="shop-card-img"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(61,26,26,0.18)" strokeWidth="1" width="40" height="40">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
        {product.collection && (
          <span style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem',
            background: 'rgba(253,246,240,0.9)', color: 'var(--color-dark)',
            fontFamily: 'var(--font-sans)', fontSize: '0.55rem',
            letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
            padding: '0.28rem 0.65rem', borderRadius: '100px',
          }}>
            {product.collection}
          </span>
        )}
      </div>

      <div style={{ padding: '1rem 1.1rem 1.2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 400, color: 'var(--color-dark)', lineHeight: 1.25, margin: '0 0 0.3rem', letterSpacing: '0.01em' }}>
          {product.name}
        </h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-dark)', margin: 0, letterSpacing: '0.03em' }}>
          AED {Number(product.price).toFixed(0)}
          {product.unit && <span style={{ fontWeight: 400, opacity: 0.42, fontSize: '0.68rem', marginLeft: '0.28em' }}>/ {product.unit}</span>}
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
  const [showMixBox,   setShowMixBox]   = useState(false)

  // Fulfillment step — only skip to products if a valid delivery session exists
  const [shopStep, setShopStep] = useState(() => {
    const saved = getFulfillment()
    return (saved?.type === 'delivery' && saved?.emirate) ? 'products' : 'fulfillment'
  })
  const [fulfillmentData, setFulfillmentData] = useState(() => {
    const saved = getFulfillment()
    return (saved?.type === 'delivery' && saved?.emirate) ? saved : null
  })

  useEffect(() => {
    getProducts()
      .then(raw => {
        const normalized = raw.map(normalizeProduct)
        setProducts(normalized)
        const HIDDEN = new Set(['Home page', 'home page', 'frontpage'])
        const unique = [...new Set(normalized.map(p => p.collection).filter(c => c && !HIDDEN.has(c)))]
        setCollections(['All', ...unique])

        const handle = searchParams.get('product')
        if (handle) {
          const found = normalized.find(p => p.handle === handle)
          if (found) setOpenProduct(found)
        }
      })
      .catch(err => console.error('Failed to load products:', err))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function completeFulfillment(data) {
    setFulfillment(data)
    setFulfillmentData(data)
    setShopStep('products')
  }

  function changeFulfillment() {
    setShopStep('fulfillment')
  }

  function closeModal() {
    setOpenProduct(null)
    const next = new URLSearchParams(searchParams)
    next.delete('product')
    setSearchParams(next, { replace: true })
  }

  const filtered = activeFilter === 'All'
    ? products
    : products.filter(p => p.collection === activeFilter)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
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
        .mix-box-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 48px rgba(61,26,26,0.28) !important; }
        @media (max-width: 900px) {
          .shop-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
        }
        @media (max-width: 520px) {
          .shop-grid { gap: 0.75rem !important; padding: 1.5rem 0.875rem 5rem !important; }
        }
        @media (min-width: 769px) {
          .product-modal-panel { border-radius: 16px !important; max-height: 88vh !important; }
        }
      `}</style>

      {/* Hero Banner — always visible */}
      <section style={{
        height: 'clamp(240px, 45vw, 400px)', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url('/assets/images/Original, simple, perfect..jpg')`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,7,7,0.52)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 2rem' }}>
          <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.6rem, 7vw, 5.5rem)', fontWeight: 300, color: '#FDF6F0', margin: 0, letterSpacing: '0.06em', lineHeight: 1.1 }}>
            Our Collection
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(253,246,240,0.75)', marginTop: '1rem' }}>
            Handcrafted butterfly chocolates · Abu Dhabi
          </motion.p>
        </div>
      </section>

      {/* ── Fulfillment step ── */}
      {shopStep === 'fulfillment' && (
        <FulfillmentSelector onComplete={completeFulfillment} />
      )}

      {/* ── Products (after fulfillment is chosen) ── */}
      {shopStep === 'products' && (
        <>
          {/* Fulfillment summary chip */}
          <FulfillmentSummary data={fulfillmentData} onChange={changeFulfillment} />

          {/* Filter Bar */}
          <div className="shop-filter-bar"
            style={{
              position: 'sticky', top: 'calc(var(--bar-h) + var(--nav-h))', zIndex: 50,
              background: 'var(--color-bg)', borderBottom: '1px solid rgba(61,26,26,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', padding: '0.875rem 1.5rem', flexWrap: 'nowrap', overflowX: 'auto',
            }}
          >
            {collections.map(col => {
              const active = activeFilter === col
              return (
                <button key={col} className="shop-filter-btn" onClick={() => setActiveFilter(col)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '100px',
                    border: `1px solid ${active ? 'var(--color-dark)' : 'rgba(201,160,163,0.3)'}`,
                    background: active ? 'var(--color-dark)' : 'transparent',
                    color: active ? '#FDF6F0' : 'var(--color-dark)',
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

          {/* Mix Box — always visible once products step is shown */}
          {!loading && (
            <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '2.5rem 2rem 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <MixBoxCard onOpen={() => setShowMixBox(true)} />
            </div>
          )}

          {/* Skeleton loading */}
          {loading && (
            <div className="shop-grid" style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 2rem 6rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shop-skeleton" style={{ background: 'rgba(61,26,26,0.07)', borderRadius: '12px', height: '360px' }} />
              ))}
            </div>
          )}

          {/* Product Grid */}
          {!loading && products.length > 0 && (
            <div className="shop-grid" style={{ maxWidth: '1380px', margin: '0 auto', padding: '0 2rem 7rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <AnimatePresence mode="popLayout">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} onOpen={setOpenProduct} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem 7rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, color: 'var(--color-dark)', margin: '0 0 0.75rem', letterSpacing: '0.05em' }}>Coming Soon</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(61,26,26,0.62)', margin: 0 }}>Something beautiful is on its way</p>
            </motion.div>
          )}
        </>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {openProduct && <ProductModal product={openProduct} onClose={closeModal} />}
      </AnimatePresence>

      {/* Mix Box Modal */}
      <AnimatePresence>
        {showMixBox && <MixBoxModal products={products} onClose={() => setShowMixBox(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
