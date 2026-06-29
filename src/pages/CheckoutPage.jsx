import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext'

const AREAS = [
  'Al Khalidiyah', 'Al Mushrif', 'Al Nahyan', 'Khalifa City',
  'Al Reem Island', 'Yas Island', 'Saadiyat Island', 'Al Karamah',
  'Mohamed Bin Zayed', 'Other',
]

const TIME_SLOTS = [
  { label: 'Morning',   hours: '9AM – 12PM' },
  { label: 'Afternoon', hours: '12PM – 5PM' },
  { label: 'Evening',   hours: '5PM – 8PM'  },
]

const DELIVERY_FEE = 35

function tomorrowMin() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function inputStyle(hasError) {
  return {
    width: '100%',
    padding: '0.82rem 1rem',
    background: '#fff',
    border: `1px solid ${hasError ? '#c0392b' : 'rgba(61,26,26,0.18)'}`,
    borderRadius: '8px',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.86rem',
    color: 'var(--color-dark)',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
  }
}

function FormSection({ number, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{ marginBottom: '2.75rem' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1.5rem', paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(61,26,26,0.09)',
      }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '0.9rem', color: 'var(--color-gold)', fontWeight: 500, letterSpacing: '0.04em',
        }}>{number}</span>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: '1.4rem', fontWeight: 400, color: 'var(--color-dark)', margin: 0,
        }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {children}
      </div>
    </motion.div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'var(--font-sans)',
        fontSize: '0.63rem', letterSpacing: '0.14em', textTransform: 'uppercase',
        color: error ? '#c0392b' : 'rgba(61,26,26,0.52)',
        marginBottom: '0.42rem', fontWeight: 500,
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{
          margin: '0.3rem 0 0', fontFamily: 'var(--font-sans)',
          fontSize: '0.68rem', color: '#c0392b',
        }}>
          {error}
        </p>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: '16px', height: '16px',
      borderRadius: '50%',
      border: '2px solid rgba(201,169,110,0.3)',
      borderTopColor: 'var(--color-gold)',
      animation: 'co-spin 0.75s linear infinite',
      verticalAlign: 'middle',
      marginRight: '0.5rem',
    }} />
  )
}

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()

  const [loading,     setLoading]     = useState(false)
  const [serverError, setServerError] = useState(null)
  const [errors,      setErrors]      = useState({})
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    address: '', area: '', date: '', timeSlot: '', notes: '', mapsLink: '',
  })

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())    e.name     = 'Your name is required'
    if (!form.phone.trim())   e.phone    = 'Phone number is required'
    if (!form.email.trim())   e.email    = 'Email address is required'
    if (!form.address.trim()) e.address  = 'Street address is required'
    if (!form.area)           e.area     = 'Please select your area'
    if (!form.date)           e.date     = 'Please choose a delivery date'
    if (!form.timeSlot)       e.timeSlot = 'Please select a time slot'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePlaceOrder() {
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: form.name, phone: form.phone, email: form.email },
          delivery: {
            address: form.address, area: form.area, date: form.date,
            timeSlot: form.timeSlot, notes: form.notes, mapsLink: form.mapsLink,
          },
          items: items.map(i => ({
            variantId: i.variantId, quantity: i.quantity, name: i.name, price: i.price,
          })),
          total: cartTotal + DELIVERY_FEE,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Order failed')
      clearCart()
      navigate(`/order-confirmation?id=${data.orderNumber}`, {
        state: { orderNumber: data.orderNumber, items: [...items], delivery: form },
      })
    } catch (err) {
      console.error('Checkout error:', err)
      setServerError('Something went wrong. Please try again or contact us on WhatsApp.')
      setLoading(false)
    }
  }

  const orderTotal = cartTotal + DELIVERY_FEE

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: 'calc(var(--bar-h) + var(--nav-h))' }}
    >
      <style>{`
        @keyframes co-spin { to { transform: rotate(360deg); } }
        .co-input:focus { border-color: var(--color-dark) !important; box-shadow: 0 0 0 3px rgba(61,26,26,0.07) !important; }
        .co-input::placeholder { color: rgba(61,26,26,0.28); }
        .co-time-btn { transition: all 0.22s; }
        .co-time-btn:hover { border-color: var(--color-dark) !important; }
        .co-place-btn { transition: background 0.28s ease, color 0.28s ease; }
        .co-place-btn:hover:not(:disabled) { background: var(--color-gold) !important; color: var(--color-dark) !important; }
        @media (max-width: 940px) {
          .co-layout { flex-direction: column !important; }
          .co-sidebar { display: none !important; }
        }
        @media (max-width: 600px) {
          .co-time-slots { flex-direction: column !important; }
          .co-time-btn { width: 100% !important; }
        }
        /* Mobile sticky order summary */
        .co-mobile-summary {
          display: none;
        }
        @media (max-width: 940px) {
          .co-mobile-summary {
            display: flex !important;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: #fff;
            border-top: 1px solid rgba(61,26,26,0.1);
            box-shadow: 0 -8px 32px rgba(61,26,26,0.1);
            z-index: 80;
            flex-direction: column;
            padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));
            gap: 0.75rem;
          }
          /* add padding so content doesn't hide behind sticky bar */
          .co-page-wrap { padding-bottom: 140px !important; }
        }
      `}</style>

      <div className="co-page-wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 300, color: 'var(--color-dark)',
          letterSpacing: '0.04em', textAlign: 'center', marginBottom: '3rem',
        }}>
          Checkout
        </h1>

        <div className="co-layout" style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>

          {/* ── Form ── */}
          <div style={{ flex: 1 }}>

            {/* 01 Your Details */}
            <FormSection number="01" title="Your Details">
              <Field label="Full Name" error={errors.name}>
                <input className="co-input" type="text" placeholder="Fatima Al Mansoori"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  style={inputStyle(errors.name)} />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input className="co-input" type="tel" placeholder="+971 50 000 0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                  style={inputStyle(errors.phone)} />
              </Field>
              <Field label="Email Address" error={errors.email}>
                <input className="co-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  style={inputStyle(errors.email)} />
              </Field>
            </FormSection>

            {/* 02 Delivery */}
            <FormSection number="02" title="Delivery Details">
              <Field label="Street Address" error={errors.address}>
                <input className="co-input" type="text" placeholder="Villa 12, Street 5"
                  value={form.address} onChange={e => set('address', e.target.value)}
                  style={inputStyle(errors.address)} />
              </Field>

              <Field label="Area" error={errors.area}>
                <select
                  className="co-input"
                  value={form.area}
                  onChange={e => set('area', e.target.value)}
                  style={{
                    ...inputStyle(errors.area), appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%233D1A1A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '2.5rem',
                  }}
                >
                  <option value="">Select area</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>

              <Field label="Delivery Date" error={errors.date}>
                <input className="co-input" type="date"
                  min={tomorrowMin()}
                  value={form.date} onChange={e => set('date', e.target.value)}
                  style={inputStyle(errors.date)} />
              </Field>

              <Field label="Preferred Time" error={errors.timeSlot}>
                <div className="co-time-slots" style={{ display: 'flex', gap: '0.75rem' }}>
                  {TIME_SLOTS.map(slot => {
                    const val    = `${slot.label} ${slot.hours}`
                    const active = form.timeSlot === val
                    return (
                      <button
                        key={slot.label}
                        className="co-time-btn"
                        type="button"
                        onClick={() => set('timeSlot', val)}
                        style={{
                          flex: 1, padding: '0.75rem 0.875rem',
                          border: `1px solid ${active ? 'var(--color-dark)' : 'rgba(61,26,26,0.18)'}`,
                          background: active ? 'var(--color-dark)' : '#fff',
                          color: active ? '#FDF6F0' : 'var(--color-dark)',
                          borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                          fontFamily: 'var(--font-sans)', transition: 'all 0.22s ease',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' }}>{slot.label}</div>
                        <div style={{ fontSize: '0.66rem', opacity: 0.65, marginTop: '2px' }}>{slot.hours}</div>
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field label="Delivery Notes (optional)">
                <textarea
                  className="co-input"
                  placeholder="Building entrance, special delivery instructions..."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  rows={3}
                  style={{ ...inputStyle(), resize: 'vertical' }}
                />
              </Field>

              <Field label="Paste your Google Maps location link (optional)">
                <input
                  className="co-input"
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={form.mapsLink}
                  onChange={e => set('mapsLink', e.target.value)}
                  style={inputStyle()}
                />
              </Field>
            </FormSection>

            {/* 03 Payment */}
            <FormSection number="03" title="Payment Method">
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.1rem 1.25rem',
                border: '2px solid var(--color-gold)', borderRadius: '10px',
                background: 'rgba(201,169,110,0.06)',
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--color-gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg viewBox="0 0 12 10" fill="none" width="10" height="8">
                    <path d="M1 5l3 3 7-7" stroke="#3D1A1A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-dark)' }}>
                    Cash on Delivery
                  </p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(61,26,26,0.5)' }}>
                    Pay when your order arrives
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.1rem 1.25rem', border: '1px solid rgba(61,26,26,0.1)',
                borderRadius: '10px', opacity: 0.4, cursor: 'not-allowed',
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid rgba(61,26,26,0.28)', flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.86rem', fontWeight: 600, color: 'var(--color-dark)' }}>Online Payment</p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(61,26,26,0.45)' }}>Coming soon</p>
                </div>
              </div>
            </FormSection>
          </div>

          {/* ── Sidebar: Order Summary (desktop) ── */}
          <div
            className="co-sidebar"
            style={{
              width: '360px', flexShrink: 0,
              position: 'sticky', top: 'calc(var(--bar-h) + var(--nav-h) + 2rem)',
            }}
          >
            <OrderSummaryCard
              items={items}
              cartTotal={cartTotal}
              orderTotal={orderTotal}
              loading={loading}
              serverError={serverError}
              errors={errors}
              onPlace={handlePlaceOrder}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile sticky order summary ── */}
      <div className="co-mobile-summary">
        {/* Mini totals row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(61,26,26,0.5)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} · Delivery AED {DELIVERY_FEE}
            </p>
            <p style={{ margin: 0, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 500, color: 'var(--color-dark)' }}>
              AED {orderTotal}
            </p>
          </div>
          <motion.button
            className="co-place-btn"
            onClick={handlePlaceOrder}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            style={{
              padding: '0.875rem 1.75rem',
              background: 'var(--color-dark)',
              color: 'var(--color-gold)',
              border: 'none', borderRadius: '8px',
              fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
              opacity: loading ? 0.72 : 1,
              display: 'flex', alignItems: 'center',
            }}
          >
            {loading && <Spinner />}
            {loading ? 'Processing…' : 'Place Order'}
          </motion.button>
        </div>
        {serverError && (
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#c0392b', textAlign: 'center' }}>
            {serverError}
          </p>
        )}
        {Object.keys(errors).length > 0 && (
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#c0392b', textAlign: 'center' }}>
            Please fill all required fields above.
          </p>
        )}
      </div>
    </motion.div>
  )
}

// Extracted summary card so it can be used in sidebar
function OrderSummaryCard({ items, cartTotal, orderTotal, loading, serverError, errors, onPlace }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '14px',
      padding: '2rem', boxShadow: '0 4px 32px rgba(61,26,26,0.07)',
    }}>
      <h3 style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.5rem',
        fontWeight: 400, color: 'var(--color-dark)', margin: '0 0 1.5rem',
      }}>
        Order Summary
      </h3>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {items.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.5)' }}>
            No items.{' '}
            <Link to="/shop" style={{ color: 'var(--color-gold)', textDecoration: 'none' }}>Shop now</Link>
          </p>
        ) : items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <img src={item.image} alt={item.name}
              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </p>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'rgba(61,26,26,0.44)' }}>
                ×{item.quantity}
              </p>
            </div>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-dark)', flexShrink: 0 }}>
              AED {item.price * item.quantity}
            </p>
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'rgba(61,26,26,0.09)', marginBottom: '1.25rem' }} />

      {/* Totals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.55)' }}>Subtotal</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)' }}>AED {cartTotal}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.55)' }}>Delivery</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)' }}>AED {DELIVERY_FEE}</span>
        </div>
        <div style={{ height: '1px', background: 'rgba(61,26,26,0.09)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-dark)' }}>Total</span>
          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.35rem', color: 'var(--color-dark)', fontWeight: 500 }}>
            AED {orderTotal}
          </span>
        </div>
      </div>

      {/* Place Order */}
      <motion.button
        className="co-place-btn"
        onClick={onPlace}
        whileTap={{ scale: 0.98 }}
        disabled={loading}
        style={{
          width: '100%', padding: '1rem',
          background: 'var(--color-dark)', color: 'var(--color-gold)',
          border: 'none', borderRadius: '8px',
          fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
          opacity: loading ? 0.72 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {loading && (
          <span style={{
            display: 'inline-block', width: '16px', height: '16px',
            borderRadius: '50%', border: '2px solid rgba(201,169,110,0.3)',
            borderTopColor: 'var(--color-gold)',
            animation: 'co-spin 0.75s linear infinite',
            marginRight: '0.5rem',
          }} />
        )}
        {loading ? 'Processing your order…' : 'Place Order'}
      </motion.button>

      {Object.keys(errors).length > 0 && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            marginTop: '0.75rem', fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem', color: '#c0392b', textAlign: 'center', lineHeight: 1.5,
          }}
        >
          Please fill all required fields.
        </motion.p>
      )}

      {serverError && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            marginTop: '0.75rem', fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem', color: '#c0392b', textAlign: 'center', lineHeight: 1.5,
          }}
        >
          {serverError}
        </motion.p>
      )}
    </div>
  )
}
