import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
const DELIVERY_FEE = 35

function SummaryRow({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: bold ? '0.82rem' : '0.78rem',
        color: bold ? 'var(--color-dark)' : 'rgba(61,26,26,0.72)',
        fontWeight: bold ? 600 : 400,
        letterSpacing: '0.03em',
      }}>{label}</span>
      <span style={{
        fontFamily: bold ? 'var(--font-serif)' : 'var(--font-sans)',
        fontSize: bold ? '1.2rem' : '0.85rem',
        color: 'var(--color-dark)',
        fontWeight: bold ? 500 : 400,
      }}>{value}</span>
    </div>
  )
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
        paddingTop: 'calc(var(--bar-h) + var(--nav-h))',
      }}
    >
      <style>{`
        .cart-item { transition: background 0.2s; }
        .cart-item:hover { background: rgba(201,169,110,0.04); }
        .cart-qty-btn:hover { background: var(--color-dark) !important; color: #FDF6F0 !important; border-color: var(--color-dark) !important; }
        .cart-remove-btn:hover { color: #c0392b !important; }
        .cart-checkout-btn:hover { background: var(--color-gold) !important; color: var(--color-dark) !important; }
        .cart-continue-btn:hover { background: rgba(61,26,26,0.06) !important; }
        @media (max-width: 600px) {
          .cart-item { flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
          .cart-item-controls { align-self: flex-end; }
        }
      `}</style>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
            fontWeight: 300,
            color: 'var(--color-dark)',
            letterSpacing: '0.04em',
            margin: 0,
          }}>
            Your Cart
          </h1>
          {items.length > 0 && (
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.75rem',
              color: 'rgba(61,26,26,0.68)',
              letterSpacing: '0.08em',
              marginTop: '0.5rem',
            }}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            style={{ textAlign: 'center', padding: '4rem 0' }}
          >
            <ShoppingBag size={58} strokeWidth={1} color="var(--color-gold)" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.875rem',
              fontWeight: 300,
              color: 'var(--color-dark)',
              marginBottom: '0.75rem',
            }}>
              Your cart is empty
            </h2>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.82rem',
              color: 'rgba(61,26,26,0.68)',
              marginBottom: '2.5rem',
              lineHeight: 1.7,
            }}>
              Explore our handcrafted butterfly chocolates.
            </p>
            <Link to="/shop" style={{
              display: 'inline-block',
              padding: '0.9rem 2.75rem',
              background: 'var(--color-dark)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 600,
            }}>
              Shop Now
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Item list */}
            <div style={{ borderTop: '1px solid rgba(61,26,26,0.1)', marginBottom: '2.5rem' }}>
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="cart-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.38 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.5rem',
                      padding: '1.5rem 0.5rem',
                      borderBottom: '1px solid rgba(61,26,26,0.08)',
                    }}
                  >
                    {/* Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '88px',
                        height: '88px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }}
                    />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.58rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'var(--color-gold)',
                        fontWeight: 600,
                        margin: '0 0 0.25rem',
                      }}>{item.collection}</p>
                      <h3 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.25rem',
                        fontWeight: 400,
                        color: 'var(--color-dark)',
                        margin: '0 0 0.2rem',
                      }}>{item.name}</h3>
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.73rem',
                        color: 'rgba(61,26,26,0.65)',
                        margin: 0,
                      }}>AED {item.price} / {item.unit}</p>
                    </div>

                    {/* Qty + total + remove */}
                    <div className="cart-item-controls" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease"
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            border: '1px solid rgba(61,26,26,0.2)', background: 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', color: 'var(--color-dark)', transition: 'all 0.2s',
                          }}
                        >−</button>
                        <span style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.1rem', color: 'var(--color-dark)',
                          minWidth: '1.25rem', textAlign: 'center',
                        }}>{item.quantity}</span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase"
                          style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            border: '1px solid rgba(61,26,26,0.2)', background: 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', color: 'var(--color-dark)', transition: 'all 0.2s',
                          }}
                        >+</button>
                      </div>

                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: 'var(--color-dark)',
                        minWidth: '72px',
                        textAlign: 'right',
                        margin: 0,
                      }}>AED {item.price * item.quantity}</p>

                      <button
                        className="cart-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'rgba(61,26,26,0.3)', transition: 'color 0.2s', padding: '4px',
                        }}
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Order summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%',
                maxWidth: '380px',
                background: '#fff',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 32px rgba(61,26,26,0.07)',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  fontWeight: 400,
                  color: 'var(--color-dark)',
                  margin: '0 0 1.5rem',
                }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <SummaryRow label="Subtotal" value={`AED ${cartTotal}`} />
                  <SummaryRow label="Delivery" value={`AED ${DELIVERY_FEE}`} />
                  <div style={{ height: '1px', background: 'rgba(61,26,26,0.1)', margin: '0.25rem 0' }} />
                  <SummaryRow label="Total" value={`AED ${cartTotal + DELIVERY_FEE}`} bold />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link
                    to="/checkout"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '1rem',
                      backgroundColor: 'var(--color-dark)',
                      color: '#fff',
                      textAlign: 'center',
                      textDecoration: 'none',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                  >
                    PROCEED TO CHECKOUT
                  </Link>
                  <Link
                    to="/shop"
                    className="cart-continue-btn"
                    style={{
                      display: 'block',
                      padding: '0.85rem',
                      background: 'transparent',
                      color: 'var(--color-dark)',
                      textAlign: 'center',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.72rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      border: '1px solid rgba(61,26,26,0.18)',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
