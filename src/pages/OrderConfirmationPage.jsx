import { useLocation, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function OrderConfirmationPage() {
  const { state } = useLocation()
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('id') ?? state?.orderNumber

  const items    = state?.items    ?? []
  const delivery = state?.delivery ?? null

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
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '5rem 1.5rem 7rem', textAlign: 'center' }}>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          style={{ marginBottom: '1.75rem' }}
        >
          <CheckCircle size={72} strokeWidth={1.1} color="var(--color-gold)" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.25rem, 6vw, 3.5rem)',
            fontWeight: 300,
            color: 'var(--color-dark)',
            margin: '0 0 0.75rem',
            letterSpacing: '0.04em',
          }}
        >
          Order Confirmed!
        </motion.h1>

        {/* Order number */}
        {orderNumber && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38, duration: 0.45 }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-gold)',
              fontWeight: 600,
              margin: '0 0 2.5rem',
            }}
          >
            Order #{orderNumber}
          </motion.p>
        )}

        {/* Items summary */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.75rem',
              boxShadow: '0 4px 24px rgba(61,26,26,0.07)',
              marginBottom: '1.75rem',
              textAlign: 'left',
            }}
          >
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.3rem',
              fontWeight: 400,
              color: 'var(--color-dark)',
              margin: '0 0 1.25rem',
            }}>
              Your Order
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: '52px',
                        height: '52px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: 'var(--color-dark)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </p>
                    <p style={{
                      margin: 0,
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.7rem',
                      color: 'rgba(61,26,26,0.46)',
                    }}>
                      ×{item.quantity}
                    </p>
                  </div>
                  <p style={{
                    margin: 0,
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-dark)',
                    flexShrink: 0,
                  }}>
                    AED {item.price * item.quantity}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Delivery / Pickup summary */}
        {delivery && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.75rem',
              boxShadow: '0 4px 24px rgba(61,26,26,0.07)',
              marginBottom: '1.75rem',
              textAlign: 'left',
            }}
          >
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.3rem',
              fontWeight: 400,
              color: 'var(--color-dark)',
              margin: '0 0 1.25rem',
            }}>
              Delivery Details
            </h3>

            {[
              { label: 'Address', value: `${delivery.address}, ${delivery.area}` },
              { label: 'Date',    value: delivery.date },
              { label: 'Time',    value: delivery.timeSlot },
              delivery.notes ? { label: 'Notes', value: delivery.notes } : null,
            ].filter(Boolean).map(row => (
              <div key={row.label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid rgba(61,26,26,0.07)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(61,26,26,0.46)',
                  flexShrink: 0,
                }}>
                  {row.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem',
                  color: 'var(--color-dark)',
                  textAlign: 'right',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Confirmation message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.62, duration: 0.5 }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.84rem',
            color: 'rgba(61,26,26,0.6)',
            lineHeight: 1.8,
            marginBottom: '2.5rem',
          }}
        >
          We will contact you shortly to confirm your order.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.45 }}
        >
          <Link
            to="/shop"
            style={{
              display: 'inline-block',
              padding: '0.9rem 2.75rem',
              background: 'var(--color-dark)',
              color: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            Continue Shopping
          </Link>
        </motion.div>

      </div>
    </motion.div>
  )
}
