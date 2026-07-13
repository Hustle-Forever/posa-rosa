import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext'
import { lockBodyScroll, unlockBodyScroll } from '../lib/scrollLock'
import { getFulfillment, getDeliveryFee } from '../lib/fulfillment'

function GiftCardFlipCard() {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setFlipped(f => !f), 4200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ width: '68px', height: '43px', flexShrink: 0, perspective: '300px' }}>
      <div style={{
        position: 'relative', width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '5px', overflow: 'hidden',
        }}>
          <img src="/assets/brand-reference/Gift-Card-front.png" alt="Gift Card"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '5px', overflow: 'hidden',
        }}>
          <img src="/assets/brand-reference/Gift-Card-back.png" alt="" aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const {
    items, cartTotal, cartCount, removeFromCart, updateQuantity, closeDrawer, drawerOpen,
    giftCardQty, setGiftCardQty, giftCardTotal,
    giftCardTo, setGiftCardTo, giftCardFrom, setGiftCardFrom, giftCardMessage, setGiftCardMessage,
  } = useCart()
  const navigate = useNavigate()
  const [deliveryFee, setDeliveryFee] = useState(35)

  // Lock body scroll while open (see scrollLock.js for why this is counted)
  useEffect(() => {
    if (drawerOpen) {
      lockBodyScroll()
      // Refresh delivery fee from sessionStorage each time drawer opens
      const saved = getFulfillment()
      setDeliveryFee(getDeliveryFee(saved?.emirate))
      return unlockBodyScroll
    }
  }, [drawerOpen])

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeDrawer])

  function goToCheckout() {
    closeDrawer()
    navigate('/checkout')
  }

  const gcInputStyle = {
    width: '100%', padding: '0.52rem 0.7rem',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(201,160,163,0.32)',
    borderRadius: '7px',
    fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
    color: 'rgba(61,26,26,0.88)',
    outline: 'none', boxSizing: 'border-box',
  }

  const gcLabelStyle = {
    display: 'block', fontFamily: 'var(--font-serif)', fontSize: '0.58rem',
    letterSpacing: '0.18em', textTransform: 'uppercase', fontStyle: 'italic',
    color: 'rgba(61,26,26,0.55)', marginBottom: '0.28rem',
  }

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeDrawer}
            style={{
              position: 'fixed', inset: 0, zIndex: 300,
              background: 'rgba(22,7,7,0.45)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
            }}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: 'min(420px, 100vw)',
              background: '#FDF6F0',
              zIndex: 301,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 48px rgba(61,26,26,0.12)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(201,160,163,0.15)',
              flexShrink: 0,
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-dark)', margin: 0,
                  letterSpacing: '0.02em',
                }}>
                  Your Cart
                </h2>
                {cartCount > 0 && (
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
                    color: 'rgba(61,26,26,0.65)', margin: '0.1rem 0 0',
                    letterSpacing: '0.06em',
                  }}>
                    {cartCount} item{cartCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <button
                onClick={closeDrawer}
                aria-label="Close cart"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'rgba(201,160,163,0.12)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-dark)', flexShrink: 0, transition: 'background 0.18s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,160,163,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,160,163,0.12)'}
              >
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
                  <path d="M2 2l14 14M16 2L2 16" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Items — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              {items.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', textAlign: 'center',
                  padding: '3rem 1rem',
                }}>
                  <div style={{ width: '40px', height: '1px', background: 'rgba(201,160,163,0.28)', margin: '0 auto 1.25rem' }} />
                  <p style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.4rem', fontWeight: 300, color: 'var(--color-dark)',
                    margin: '0 0 0.5rem',
                  }}>
                    Your cart is empty
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                    color: 'rgba(61,26,26,0.65)', margin: '0 0 1.5rem',
                  }}>
                    Add some butterflies to get started
                  </p>
                  <button
                    onClick={() => { closeDrawer(); navigate('/shop') }}
                    style={{
                      padding: '0.75rem 1.75rem',
                      background: 'var(--color-dark)', color: '#fff',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
                      letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
                    }}
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                        padding: '1.1rem 0',
                        borderBottom: i < items.length - 1 ? '1px solid rgba(201,160,163,0.12)' : 'none',
                      }}
                    >
                      {/* Thumbnail */}
                      <div style={{
                        width: '68px', height: '68px', borderRadius: '8px',
                        overflow: 'hidden', flexShrink: 0,
                        background: 'rgba(201,160,163,0.08)',
                      }}>
                        {item.image && (
                          <img
                            src={item.image} alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: 'var(--font-sans)', fontSize: '0.84rem',
                          fontWeight: 500, color: 'var(--color-dark)',
                          margin: '0 0 0.2rem',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {item.name}
                        </p>
                        <p style={{
                          fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                          color: 'rgba(61,26,26,0.70)', margin: '0 0 0.6rem',
                        }}>
                          AED {Number(item.price).toFixed(0)} each
                        </p>

                        {/* Qty controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                          <div style={{
                            display: 'flex', alignItems: 'stretch',
                            border: '1px solid rgba(201,160,163,0.22)', borderRadius: '7px',
                            overflow: 'hidden', height: '34px',
                          }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              style={{
                                width: '36px', background: 'transparent', border: 'none',
                                borderRight: '1px solid rgba(201,160,163,0.18)',
                                cursor: 'pointer', color: 'var(--color-dark)',
                                fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,160,163,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              −
                            </button>
                            <span style={{
                              width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'var(--font-sans)', fontSize: '0.82rem',
                              fontWeight: 600, color: 'var(--color-dark)',
                            }}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              style={{
                                width: '36px', background: 'transparent', border: 'none',
                                borderLeft: '1px solid rgba(201,160,163,0.18)',
                                cursor: 'pointer', color: 'var(--color-dark)',
                                fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,160,163,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Price + Remove */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                        <p style={{
                          fontFamily: 'var(--font-sans)', fontSize: '0.88rem',
                          fontWeight: 700, color: 'var(--color-dark)', margin: 0,
                        }}>
                          AED {(Number(item.price) * item.quantity).toFixed(0)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
                            color: 'rgba(61,26,26,0.60)', letterSpacing: '0.06em',
                            textTransform: 'uppercase', padding: 0,
                            transition: 'color 0.2s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(61,26,26,0.60)'}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gift Card Upsell */}
            {items.length > 0 && (
              <div style={{
                borderTop: '1px solid rgba(201,160,163,0.12)',
                padding: '0.875rem 1.5rem 0.75rem',
                background: 'rgba(201,160,163,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <GiftCardFlipCard />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.1rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-dark)' }}>
                      Posa Rosa Gift Card
                    </p>
                    <p style={{ margin: '0 0 0.3rem', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(61,26,26,0.65)' }}>
                      AED 5 each
                    </p>
                    <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '0.68rem', fontStyle: 'italic', color: 'var(--color-dark)', lineHeight: 1.4, opacity: 0.82 }}>
                      Add a personal touch — include a handwritten note with your gift.
                    </p>
                  </div>
                  {/* Stepper */}
                  <div style={{
                    display: 'flex', alignItems: 'stretch',
                    border: '1px solid rgba(201,160,163,0.28)', borderRadius: '7px',
                    overflow: 'hidden', height: '34px', flexShrink: 0,
                  }}>
                    <button
                      onClick={() => setGiftCardQty(q => Math.max(0, q - 1))}
                      aria-label="Remove gift card"
                      style={{
                        width: '36px', background: 'transparent', border: 'none',
                        borderRight: '1px solid rgba(201,160,163,0.18)',
                        cursor: 'pointer', color: 'var(--color-dark)',
                        fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,160,163,0.10)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >−</button>
                    <span style={{
                      width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-dark)',
                    }}>
                      {giftCardQty}
                    </span>
                    <button
                      onClick={() => setGiftCardQty(q => Math.min(99, q + 1))}
                      aria-label="Add gift card"
                      style={{
                        width: '36px', background: 'transparent', border: 'none',
                        borderLeft: '1px solid rgba(201,160,163,0.18)',
                        cursor: 'pointer', color: 'var(--color-dark)',
                        fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,160,163,0.10)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >+</button>
                  </div>
                </div>

                {/* Gift card personalization — revealed when qty > 0 */}
                <AnimatePresence>
                  {giftCardQty > 0 && (
                    <motion.div
                      key="gc-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={gcLabelStyle}>To</label>
                            <input
                              type="text"
                              placeholder="Recipient"
                              value={giftCardTo}
                              onChange={e => setGiftCardTo(e.target.value)}
                              maxLength={100}
                              style={gcInputStyle}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={gcLabelStyle}>From</label>
                            <input
                              type="text"
                              placeholder="Your name"
                              value={giftCardFrom}
                              onChange={e => setGiftCardFrom(e.target.value)}
                              maxLength={100}
                              style={gcInputStyle}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={gcLabelStyle}>
                            Message <span style={{ fontStyle: 'normal', opacity: 0.55 }}>(optional)</span>
                          </label>
                          <textarea
                            placeholder="Write a heartfelt message..."
                            value={giftCardMessage}
                            onChange={e => setGiftCardMessage(e.target.value)}
                            maxLength={300}
                            rows={2}
                            style={{ ...gcInputStyle, resize: 'none' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Footer: totals + CTA */}
            {items.length > 0 && (
              <div style={{
                flexShrink: 0,
                borderTop: '1px solid rgba(201,160,163,0.15)',
                padding: '1.25rem 1.5rem calc(1.25rem + env(safe-area-inset-bottom))',
                background: '#FDF6F0',
              }}>
                {/* Subtotal row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.68)' }}>
                    Subtotal
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)', fontWeight: 500 }}>
                    AED {cartTotal.toFixed(0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.68)' }}>
                    Delivery
                  </span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)', fontWeight: 500 }}>
                    AED {deliveryFee}
                  </span>
                </div>
                {giftCardQty > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.68)' }}>
                      Gift Card ×{giftCardQty}
                    </span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)', fontWeight: 500 }}>
                      AED {giftCardTotal}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '0.875rem 0',
                  borderTop: '1px solid rgba(201,160,163,0.15)',
                  marginBottom: '1rem',
                  marginTop: '0.6rem',
                }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Total
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-dark)',
                  }}>
                    AED {(cartTotal + deliveryFee + giftCardTotal).toFixed(0)}
                  </span>
                </div>

                {/* Checkout CTA */}
                <motion.button
                  onClick={goToCheckout}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '1.05rem',
                    background: 'var(--color-dark)', color: '#fff',
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                    letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
                    marginBottom: '0.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'background 0.25s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-gold)'; e.currentTarget.style.color = '#3D2020' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-dark)'; e.currentTarget.style.color = '#fff' }}
                >
                  Checkout
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" width="14" height="14">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>

                {/* Continue shopping */}
                <button
                  onClick={closeDrawer}
                  style={{
                    width: '100%', padding: '0.625rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
                    color: 'rgba(61,26,26,0.65)', letterSpacing: '0.1em',
                    textTransform: 'uppercase', transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-dark)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(100,70,72,0.5)'}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
