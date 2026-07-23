import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Clock } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { stripePromise } from '../lib/stripe'

const WA_LINK = 'https://wa.me/971503509459'

function Spinner({ size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `${size / 14}px solid rgba(201,169,110,0.25)`,
      borderTopColor: 'var(--color-gold)',
      animation: 'ocp-spin 0.8s linear infinite',
      margin: '0 auto',
    }} />
  )
}

export default function OrderConfirmationPage() {
  const [searchParams]                    = useSearchParams()
  const navigate                          = useNavigate()
  const { clearCart }                     = useCart()

  const [status,      setStatus]          = useState('loading')
  const [orderNumber, setOrderNumber]     = useState(null)
  const [orderData,   setOrderData]       = useState(null)
  const [errorMsg,    setErrorMsg]        = useState(null)

  const paymentIntentId     = searchParams.get('payment_intent')
  const clientSecret        = searchParams.get('payment_intent_client_secret')

  useEffect(() => {
    if (!paymentIntentId || !clientSecret) {
      setErrorMsg('Missing payment information — please contact us on WhatsApp.')
      setStatus('error')
      return
    }
    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    // 1. Check PI status with Stripe (no <Elements> needed — use plain stripe instance)
    let stripe
    try {
      stripe = await stripePromise
    } catch {
      setErrorMsg('Could not load payment processor — please contact us on WhatsApp.')
      setStatus('error')
      return
    }

    let piStatus
    try {
      const result = await stripe.retrievePaymentIntent(clientSecret)
      piStatus = result.paymentIntent?.status
    } catch {
      setErrorMsg('Could not verify payment status — please contact us on WhatsApp.')
      setStatus('error')
      return
    }

    if (piStatus === 'requires_payment_method') {
      navigate('/checkout?retry=1', { replace: true })
      return
    }

    if (piStatus === 'processing') {
      setStatus('processing')
      return
    }

    if (piStatus !== 'succeeded') {
      setErrorMsg(`Payment status: ${piStatus ?? 'unknown'}. Please contact us on WhatsApp.`)
      setStatus('error')
      return
    }

    // 2. Finalize order
    await finalize(paymentIntentId)
  }

  async function finalize(piId, attempt = 0) {
    const MAX_RETRIES = 5
    const RETRY_MS   = 1500

    // Build body — use saved sessionStorage if available, else minimal body for refresh path
    let body
    try {
      const saved = sessionStorage.getItem('posa-rosa-pending-order')
      if (saved) {
        const {
          form, items, giftCardQty, giftCardTotal,
          giftCardTo, giftCardFrom, giftCardMessage, orderTotal, deliveryFee,
        } = JSON.parse(saved)
        body = {
          paymentIntentId: piId,
          customer: { name: form.name, email: form.email, phone: form.phone },
          delivery: {
            address:   form.address,
            area:      form.area === 'Other' ? form.areaOther : form.area,
            emirate:   form.emirate,
            date:      form.date,
            timeSlot:  form.timeSlot  || null,
            notes:     form.notes     || null,
            mapsLink:  form.mapsLink  || null,
          },
          items:           items.map(i => ({
            variantId:     i.variantId    || null,
            name:          i.name,
            price:         i.price,
            quantity:      i.quantity,
            isApparel:     i.isApparel    || false,
            mixBoxFlavors: i.mixBoxFlavors || undefined,
            customItem:    i.customItem   || undefined,
            handle:        i.handle       || null,   // TEST-ONLY: lets the server detect the test product
          })),
          giftCardQuantity: giftCardQty   || 0,
          giftCardTo:       giftCardTo    || null,
          giftCardFrom:     giftCardFrom  || null,
          giftCardMessage:  giftCardMessage || null,
          total:            orderTotal,
          deliveryFee:      deliveryFee,
        }
      } else {
        body = { paymentIntentId: piId }
      }
    } catch {
      body = { paymentIntentId: piId }
    }

    let data
    try {
      const res = await fetch('/api/finalize-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      data = await res.json()

      if ((res.status === 409 || res.status >= 500) && attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_MS))
        return finalize(piId, attempt + 1)
      }

      if (!data.success) {
        setErrorMsg(data.error || 'Order could not be confirmed — please contact us on WhatsApp.')
        setStatus('error')
        return
      }
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_MS))
        return finalize(piId, attempt + 1)
      }
      setErrorMsg('Network error — please contact us on WhatsApp to confirm your order.')
      setStatus('error')
      return
    }

    // Success
    try { sessionStorage.removeItem('posa-rosa-pending-order') } catch {}
    clearCart()
    setOrderNumber(data.orderNumber)
    setOrderData(data.order || null)
    setStatus('confirmed')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: 'calc(var(--bar-h) + var(--nav-h))' }}
    >
      <style>{`@keyframes ocp-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '5rem 1.5rem 7rem', textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{ marginBottom: '2rem' }}><Spinner size={60} /></div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'rgba(61,26,26,0.55)', letterSpacing: '0.06em' }}>
              Confirming your order…
            </p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              style={{ marginBottom: '1.75rem' }}
            >
              <CheckCircle size={72} strokeWidth={1.1} color="var(--color-gold)" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                fontWeight: 300, color: 'var(--color-dark)',
                letterSpacing: '0.04em', margin: '0 0 0.6rem',
              }}
            >
              Order Confirmed!
            </motion.h1>

            {orderNumber && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.72rem', letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'var(--color-gold)', marginBottom: '2.5rem',
                }}
              >
                Order #{orderNumber}
              </motion.p>
            )}

            {orderData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                style={{
                  background: '#fff', borderRadius: '14px', padding: '2rem',
                  boxShadow: '0 4px 32px rgba(61,26,26,0.07)', marginBottom: '2.5rem', textAlign: 'left',
                }}
              >
                {/* Items */}
                {orderData.items?.length > 0 && (
                  <>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, color: 'var(--color-dark)', margin: '0 0 1.25rem' }}>
                      Your Order
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
                      {orderData.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-dark)' }}>
                              {item.title || item.name} {item.quantity > 1 ? `×${item.quantity}` : ''}
                            </p>
                            {item.mixBoxFlavors?.length > 0 && (
                              <p style={{ margin: '0.15rem 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.65rem', color: 'rgba(61,26,26,0.6)', lineHeight: 1.5 }}>
                                {item.mixBoxFlavors.map(f => `${f.name} ×${f.qty}`).join(', ')}
                              </p>
                            )}
                          </div>
                          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-dark)', flexShrink: 0 }}>
                            AED {item.price * (item.quantity || 1)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div style={{ height: '1px', background: 'rgba(61,26,26,0.09)', marginBottom: '1rem' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.76rem', color: 'rgba(61,26,26,0.65)' }}>Subtotal</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-dark)' }}>AED {orderData.subtotal}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.76rem', color: 'rgba(61,26,26,0.65)' }}>Delivery</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-dark)' }}>AED {orderData.deliveryFee}</span>
                      </div>
                      {orderData.giftCardQuantity > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.76rem', color: 'rgba(61,26,26,0.65)' }}>Gift Card ×{orderData.giftCardQuantity}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--color-dark)' }}>AED {orderData.giftCardTotal}</span>
                        </div>
                      )}
                      <div style={{ height: '1px', background: 'rgba(61,26,26,0.09)' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-dark)' }}>Total</span>
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-dark)', fontWeight: 500 }}>AED {orderData.total}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Delivery details */}
                {orderData.address && (
                  <>
                    <div style={{ height: '1px', background: 'rgba(61,26,26,0.09)', marginBottom: '1rem' }} />
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 400, color: 'var(--color-dark)', margin: '0 0 0.875rem' }}>
                      Delivery Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {[
                        ['Address',  `${orderData.address}, ${orderData.area}, ${orderData.emirate}`],
                        ['Date',     orderData.date],
                        ['Time',     orderData.timeSlot || null],
                        ['Notes',    orderData.notes    || null],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(61,26,26,0.55)', flexShrink: 0, paddingTop: '0.1rem', minWidth: '60px' }}>
                            {label}
                          </span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--color-dark)', lineHeight: 1.5 }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.65)', lineHeight: 1.7, marginBottom: '2.5rem' }}
            >
              We'll be in touch with your delivery update. Thank you for choosing Posa Rosa.
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
              <Link to="/shop" style={{
                display: 'inline-block',
                fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--color-dark)', textDecoration: 'none',
                padding: '0.875rem 2.5rem',
                border: '1px solid rgba(61,26,26,0.3)', borderRadius: '8px',
              }}>
                Continue Shopping
              </Link>
            </motion.div>
          </>
        )}

        {status === 'processing' && (
          <>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              style={{ marginBottom: '1.75rem' }}
            >
              <Clock size={72} strokeWidth={1.1} color="var(--color-gold)" />
            </motion.div>

            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 300, color: 'var(--color-dark)',
              letterSpacing: '0.04em', margin: '0 0 1rem',
            }}>
              Payment Processing
            </h1>

            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'rgba(61,26,26,0.65)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '440px', margin: '0 auto 2rem' }}>
              Your payment is being processed by your bank. We'll confirm your order as soon as it clears — usually within a few minutes.
            </p>

            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block',
              fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#fff', textDecoration: 'none',
              padding: '0.9rem 2.25rem',
              background: 'var(--color-dark)', borderRadius: '8px',
            }}>
              Contact Us on WhatsApp
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ marginBottom: '1.75rem' }}>
              <svg viewBox="0 0 72 72" fill="none" width="72" height="72" style={{ display: 'block', margin: '0 auto' }}>
                <circle cx="36" cy="36" r="35" stroke="var(--color-gold)" strokeWidth="1.1"/>
                <line x1="36" y1="22" x2="36" y2="44" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="36" cy="52" r="2" fill="var(--color-gold)"/>
              </svg>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 300, color: 'var(--color-dark)',
              letterSpacing: '0.04em', margin: '0 0 1rem',
            }}>
              Something Went Wrong
            </h1>

            {errorMsg && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.65)', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '440px', margin: '0 auto 2rem' }}>
                {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-block',
                fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#fff', textDecoration: 'none',
                padding: '0.9rem 2.25rem',
                background: 'var(--color-dark)', borderRadius: '8px',
              }}>
                Contact Us on WhatsApp
              </a>
              <Link to="/checkout" style={{
                display: 'inline-block',
                fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--color-dark)', textDecoration: 'none',
                padding: '0.9rem 2.25rem',
                border: '1px solid rgba(61,26,26,0.3)', borderRadius: '8px',
              }}>
                Back to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
