import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import { EMIRATE_AREAS, EMIRATES, getDeliveryFee, getFulfillment } from '../lib/fulfillment'
import { stripePromise } from '../lib/stripe'

const TIME_SLOTS = [
  { label: 'Morning',   hours: '9AM – 12PM', endHour: 12 },
  { label: 'Afternoon', hours: '12PM – 5PM', endHour: 17 },
  { label: 'Evening',   hours: '5PM – 8PM',  endHour: 20 },
]

const ALL_SLOTS_PASSED_MSG = 'No more delivery slots today — please select tomorrow'

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  variables: {
    colorPrimary:    '#3D1A1A',
    colorBackground: '#ffffff',
    colorText:       '#3D1A1A',
    colorDanger:     '#c0392b',
    fontFamily:      'system-ui, sans-serif',
    spacingUnit:     '4px',
    borderRadius:    '8px',
  },
}

function deliveryDateMin(emirate) {
  const d = new Date()
  if (emirate !== 'Abu Dhabi') d.setDate(d.getDate() + 1)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(d)
}

function uaeNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date())
  const get = type => parts.find(p => p.type === type)?.value || '0'
  return {
    date:    `${get('year')}-${get('month')}-${get('day')}`,
    minutes: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10),
  }
}

function slotHasPassed(slot, deliveryDate, now) {
  return deliveryDate === now.date && now.minutes >= slot.endHour * 60
}

function inputStyle(hasError) {
  return {
    width: '100%', padding: '0.82rem 1rem',
    background: '#fff',
    border: `1px solid ${hasError ? '#c0392b' : 'rgba(61,26,26,0.18)'}`,
    borderRadius: '8px',
    fontFamily: 'var(--font-sans)', fontSize: '0.86rem', color: 'var(--color-dark)',
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.22s ease, box-shadow 0.22s ease',
  }
}

const selectArrowBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%233D1A1A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

function selectStyle(hasError) {
  return {
    ...inputStyle(hasError),
    appearance: 'none',
    backgroundImage: selectArrowBg,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: '2.5rem',
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
          fontFamily: 'var(--font-serif)',
          fontSize: '0.9rem', color: 'var(--color-gold)', fontWeight: 500, letterSpacing: '0.04em',
        }}>{number}</span>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.4rem', fontWeight: 400, color: 'var(--color-dark)', margin: 0,
        }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {children}
      </div>
    </motion.div>
  )
}

function Field({ label, error, children, ...rest }) {
  return (
    <div {...rest}>
      <label style={{
        display: 'block', fontFamily: 'var(--font-sans)',
        fontSize: '0.63rem', letterSpacing: '0.14em', textTransform: 'uppercase',
        color: error ? '#c0392b' : 'rgba(61,26,26,0.68)',
        marginBottom: '0.42rem', fontWeight: 500,
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ margin: '0.3rem 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: '#c0392b' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function Spinner({ light }) {
  return (
    <span style={{
      display: 'inline-block', width: '16px', height: '16px',
      borderRadius: '50%',
      border: light ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(201,169,110,0.3)',
      borderTopColor: light ? '#fff' : 'var(--color-gold)',
      animation: 'co-spin 0.75s linear infinite',
      verticalAlign: 'middle',
      marginRight: '0.5rem',
      flexShrink: 0,
    }} />
  )
}

// ── Stripe inner component — must be inside <Elements> to use hooks ────────────
const StripePaymentField = forwardRef(function StripePaymentField({ onError }, ref) {
  const stripe   = useStripe()
  const elements = useElements()

  useImperativeHandle(ref, () => ({
    async confirmPayment(returnUrl) {
      if (!stripe || !elements) { onError('Payment not ready — please try again'); return }
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
      })
      // Reaches here only when Stripe did NOT redirect (i.e., an error occurred)
      if (error) onError(error.message)
    },
  }), [stripe, elements, onError])

  return <PaymentElement options={{ layout: 'tabs' }} />
})

function initFormFromSession() {
  const saved    = getFulfillment()
  const emirate  = (saved?.type === 'delivery' && saved?.emirate) ? saved.emirate : 'Abu Dhabi'
  const areaList = EMIRATE_AREAS[emirate] || EMIRATE_AREAS['Abu Dhabi']
  const rawArea  = saved?.area || ''
  const isCustomArea = rawArea && !areaList.includes(rawArea)
  return {
    name: '', phone: '', email: '',
    address: '',
    emirate,
    area:      isCustomArea ? 'Other' : rawArea,
    areaOther: isCustomArea ? rawArea : '',
    date: '', timeSlot: '', notes: '', mapsLink: '',
  }
}

export default function CheckoutPage() {
  const {
    items, cartTotal,
    giftCardQty, giftCardTotal, giftCardTo, giftCardFrom, giftCardMessage,
  } = useCart()

  const [searchParams]                          = useSearchParams()
  const [loading,       setLoading]             = useState(false)
  const [serverError,   setServerError]         = useState(null)
  const [errors,        setErrors]              = useState({})
  const [form,          setFormState]           = useState(initFormFromSession)
  const [clientSecret,  setClientSecret]        = useState(null)
  const [creatingIntent, setCreatingIntent]     = useState(false)
  const [paymentError,  setPaymentError]        = useState(null)
  const paymentFieldRef = useRef(null)
  const isFirstRender   = useRef(true)

  const allApparel  = items.length > 0 && items.every(i => i.isApparel)
  const deliveryFee = allApparel ? 22 : getDeliveryFee(form.emirate)
  const orderTotal  = cartTotal + deliveryFee + giftCardTotal
  const areaOptions = EMIRATE_AREAS[form.emirate] || EMIRATE_AREAS['Abu Dhabi']

  // Re-render every minute to keep time-slot availability fresh
  const [, setClockTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setClockTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const isAbuDhabi     = form.emirate === 'Abu Dhabi'
  const now            = uaeNow()
  const isTodayUAE     = isAbuDhabi && form.date === now.date
  const allSlotsPassed = isTodayUAE && TIME_SLOTS.every(s => now.minutes >= s.endHour * 60)

  // Restore saved form on retry redirect
  useEffect(() => {
    if (searchParams.get('retry') !== '1') return
    try {
      const saved = sessionStorage.getItem('posa-rosa-pending-order')
      if (!saved) return
      const { form: savedForm } = JSON.parse(saved)
      if (savedForm) setFormState(prev => ({ ...prev, ...savedForm }))
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Gate: all required fields filled (no visible errors — just readiness check)
  const formValid = useMemo(() => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) return false
    if (!form.emirate || !form.address.trim() || !form.area) return false
    if (form.area === 'Other' && !form.areaOther.trim()) return false
    if (!allApparel) {
      if (!form.date) return false
      if (form.emirate === 'Abu Dhabi' && !form.timeSlot) return false
    }
    return true
  }, [form, allApparel])

  // Create PaymentIntent on mount; re-create (debounced 500ms) when total changes
  useEffect(() => {
    if (!items.length) {
      setClientSecret(null); setCreatingIntent(false); setPaymentError(null); return
    }
    const immediate = isFirstRender.current
    isFirstRender.current = false
    let cancelled = false
    setCreatingIntent(true)
    setPaymentError(null)
    const timer = setTimeout(() => {
      if (cancelled) return
      setClientSecret(null)
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            variantId:  i.variantId  || null,
            price:      i.price,
            quantity:   i.quantity,
            isApparel:  i.isApparel  || false,
            customItem: i.customItem || undefined,
          })),
          emirate:          form.emirate,
          claimedTotal:     orderTotal,
          giftCardQuantity: giftCardQty,
        }),
      })
        .then(r => r.json())
        .then(d => {
          if (cancelled) return
          if (d.error) {
            setPaymentError(
              d.error.includes('Price mismatch')
                ? 'Your cart total changed. Please review and try again.'
                : d.error
            )
          } else {
            setClientSecret(d.clientSecret)
          }
        })
        .catch(() => { if (!cancelled) setPaymentError('Payment setup failed — please try again') })
        .finally(() => { if (!cancelled) setCreatingIntent(false) })
    }, immediate ? 0 : 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [orderTotal]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(key, val) {
    setFormState(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  function handleEmirateChange(newEmirate) {
    const newAreas = EMIRATE_AREAS[newEmirate] || []
    const minDate  = deliveryDateMin(newEmirate)
    setFormState(f => ({
      ...f,
      emirate:   newEmirate,
      area:      newAreas.includes(f.area) ? f.area : '',
      areaOther: '',
      date:      f.date && f.date < minDate ? '' : f.date,
      timeSlot:  f.timeSlot,
    }))
    if (errors.emirate)  setErrors(e => ({ ...e, emirate: '' }))
    if (errors.area)     setErrors(e => ({ ...e, area: '' }))
    if (errors.timeSlot) setErrors(e => ({ ...e, timeSlot: '' }))
  }

  function handleDateChange(newDate) {
    const nowUAE = uaeNow()
    setFormState(f => {
      const slot   = TIME_SLOTS.find(s => `${s.label} ${s.hours}` === f.timeSlot)
      const passed = slot && slotHasPassed(slot, newDate, nowUAE)
      return { ...f, date: newDate, timeSlot: passed ? '' : f.timeSlot }
    })
    if (errors.date) setErrors(e => ({ ...e, date: '' }))
  }

  const resolvedArea = form.area === 'Other' ? form.areaOther : form.area

  function validate() {
    const e = {}
    if (!form.name.trim())  e.name  = 'Your name is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.email.trim()) e.email = 'Email address is required'
    if (!form.emirate)                                         e.emirate   = 'Please select an emirate'
    if (!form.address.trim())                                  e.address   = 'Street address is required'
    if (!form.area)                                            e.area      = 'Please select your area'
    if (form.area === 'Other' && !form.areaOther.trim())       e.areaOther = 'Please describe your area'
    if (!allApparel) {
      const nowUAE = uaeNow()
      const minDate = deliveryDateMin(form.emirate)
      if (!form.date) {
        e.date = 'Please choose a delivery date'
      } else if (form.date < minDate) {
        e.date = form.emirate !== 'Abu Dhabi'
          ? 'Same-day delivery is only available in Abu Dhabi — please select tomorrow or later'
          : 'Please select today or later'
      } else if (form.emirate === 'Abu Dhabi' && form.date === nowUAE.date &&
                 TIME_SLOTS.every(s => nowUAE.minutes >= s.endHour * 60)) {
        e.date = ALL_SLOTS_PASSED_MSG
      }
      if (isAbuDhabi) {
        if (!form.timeSlot) {
          e.timeSlot = 'Please select a time slot'
        } else {
          const slot = TIME_SLOTS.find(s => `${s.label} ${s.hours}` === form.timeSlot)
          if (slot && slotHasPassed(slot, form.date, nowUAE)) {
            e.timeSlot = 'That time slot has passed — please pick another'
          }
        }
      }
    }
    setErrors(e)
    return e
  }

  async function handlePlaceOrder() {
    if (items.length === 0) {
      setServerError('Your cart is empty — add some chocolates before placing an order.')
      return
    }
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      const fieldOrder = ['name', 'phone', 'email', 'emirate', 'address', 'area', 'areaOther', 'date', 'timeSlot']
      const firstKey   = fieldOrder.find(k => errs[k])
      if (firstKey) {
        setTimeout(() => {
          document.querySelector(`[data-field="${firstKey}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 50)
      }
      return
    }
    if (!clientSecret || creatingIntent || !paymentFieldRef.current) {
      setPaymentError(
        creatingIntent
          ? 'Setting up payment — please wait a moment'
          : 'Payment not ready — please refresh and try again'
      )
      return
    }

    setLoading(true)
    setPaymentError(null)
    setServerError(null)

    // Persist order data — survives the Stripe redirect in the same browser tab
    try {
      sessionStorage.setItem('posa-rosa-pending-order', JSON.stringify({
        form,
        items:           items.map(i => ({ ...i })),
        giftCardQty,
        giftCardTotal,
        giftCardTo:      giftCardTo      || '',
        giftCardFrom:    giftCardFrom    || '',
        giftCardMessage: giftCardMessage || '',
        orderTotal,
        deliveryFee,
      }))
    } catch {}

    await paymentFieldRef.current.confirmPayment(`${window.location.origin}/order-confirmation`)
    // Reaches here only if Stripe returned an error (no redirect occurred)
    setLoading(false)
  }

  const btnDisabled = loading || !formValid || creatingIntent || !clientSecret

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
        .co-time-btn:hover:not(:disabled) { border-color: var(--color-dark) !important; }
        .co-place-btn { transition: background 0.28s ease, color 0.28s ease; }
        .co-place-btn:hover:not(:disabled) { background: var(--color-gold) !important; color: #3D2020 !important; }
        @media (max-width: 940px) {
          .co-layout { flex-direction: column !important; align-items: stretch !important; }
          .co-sidebar { display: none !important; }
        }
        @media (max-width: 600px) {
          .co-time-slots { flex-direction: column !important; }
          .co-time-btn { width: 100% !important; }
        }
        @media (max-width: 768px) {
          .co-input { font-size: 16px !important; }
        }
        .co-mobile-summary { display: none; }
        @media (max-width: 940px) {
          .co-mobile-summary {
            display: flex !important;
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #fff; border-top: 1px solid rgba(61,26,26,0.1);
            box-shadow: 0 -8px 32px rgba(61,26,26,0.1); z-index: 80;
            flex-direction: column;
            padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom)); gap: 0.75rem;
          }
          .co-page-wrap { padding-bottom: 140px !important; }
        }
      `}</style>

      <div className="co-page-wrap" style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem 6rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
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
              <Field label="Full Name" error={errors.name} data-field="name">
                <input className="co-input" type="text" placeholder="Fatima Al Mansoori"
                  value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle(errors.name)} />
              </Field>
              <Field label="Phone Number" error={errors.phone} data-field="phone">
                <input className="co-input" type="tel" placeholder="+971 50 000 0000"
                  value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle(errors.phone)} />
              </Field>
              <Field label="Email Address" error={errors.email} data-field="email">
                <input className="co-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle(errors.email)} />
              </Field>
            </FormSection>

            {/* 02 Delivery Details */}
            <FormSection number="02" title="Delivery Details">
              <Field label="Emirate" error={errors.emirate} data-field="emirate">
                <select className="co-input" value={form.emirate} onChange={e => handleEmirateChange(e.target.value)}
                  style={selectStyle(errors.emirate)}>
                  <option value="">Select emirate</option>
                  {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
                {form.emirate && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.06em',
                      padding: '0.18rem 0.6rem', borderRadius: '100px', fontWeight: 600,
                      background: form.emirate === 'Abu Dhabi' ? 'rgba(201,169,110,0.15)' : 'rgba(201,160,163,0.2)',
                      color: form.emirate === 'Abu Dhabi' ? 'var(--color-gold)' : 'var(--color-dark)',
                    }}>
                      {form.emirate === 'Abu Dhabi' ? 'Same-day delivery available' : 'Next-day delivery'}
                    </span>
                  </div>
                )}
              </Field>

              <Field label="Street Address" error={errors.address} data-field="address">
                <input className="co-input" type="text" placeholder="Villa 12, Street 5"
                  value={form.address} onChange={e => set('address', e.target.value)} style={inputStyle(errors.address)} />
              </Field>

              <Field label="Area" error={errors.area} data-field="area">
                <select className="co-input" value={form.area} onChange={e => set('area', e.target.value)}
                  style={selectStyle(errors.area)}>
                  <option value="">Select area</option>
                  {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>

              {form.area === 'Other' && (
                <Field label="Your Area / Neighbourhood" error={errors.areaOther} data-field="areaOther">
                  <input className="co-input" type="text" placeholder="e.g. Palm Jumeirah"
                    value={form.areaOther} onChange={e => set('areaOther', e.target.value)}
                    style={inputStyle(errors.areaOther)} />
                </Field>
              )}

              {allApparel ? (
                <div style={{
                  padding: '0.875rem 1rem',
                  border: '1px solid rgba(201,169,110,0.25)',
                  borderRadius: '8px', background: 'rgba(201,169,110,0.06)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(61,26,26,0.72)', fontWeight: 500,
                  }}>
                    Delivery: 48–72 hours
                  </span>
                </div>
              ) : (
                <Field label="Delivery Date" error={errors.date} data-field="date">
                  <input className="co-input" type="date" min={deliveryDateMin(form.emirate)}
                    value={form.date} onChange={e => handleDateChange(e.target.value)} style={inputStyle(errors.date)} />
                </Field>
              )}

              {isAbuDhabi && !allApparel && (
                <Field label="Preferred Time" error={errors.timeSlot} data-field="timeSlot">
                  {allSlotsPassed ? (
                    <div style={{
                      padding: '0.9rem 1rem',
                      border: '1px solid rgba(192,57,43,0.35)', background: 'rgba(192,57,43,0.06)',
                      borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                      color: '#c0392b', lineHeight: 1.5,
                    }}>
                      {ALL_SLOTS_PASSED_MSG}
                    </div>
                  ) : (
                    <div className="co-time-slots" style={{ display: 'flex', gap: '0.75rem' }}>
                      {TIME_SLOTS.map(slot => {
                        const val    = `${slot.label} ${slot.hours}`
                        const passed = isAbuDhabi && slotHasPassed(slot, form.date, now)
                        const active = !passed && form.timeSlot === val
                        return (
                          <button key={slot.label} className="co-time-btn" type="button" disabled={passed}
                            onClick={() => set('timeSlot', val)}
                            style={{
                              flex: 1, padding: '0.75rem 0.875rem',
                              border: `1px solid ${active ? 'var(--color-dark)' : 'rgba(61,26,26,0.18)'}`,
                              background: passed ? 'rgba(61,26,26,0.05)' : active ? 'var(--color-dark)' : '#fff',
                              color: active ? '#FDF6F0' : 'var(--color-dark)',
                              opacity: passed ? 0.55 : 1,
                              borderRadius: '8px', cursor: passed ? 'not-allowed' : 'pointer', textAlign: 'left',
                              fontFamily: 'var(--font-sans)', transition: 'all 0.22s ease',
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' }}>
                              {slot.label}
                              {passed && (
                                <span style={{ marginLeft: '0.4rem', fontSize: '0.58rem', fontWeight: 500,
                                  letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0392b' }}>
                                  Passed
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.66rem', opacity: 0.65, marginTop: '2px' }}>{slot.hours}</div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </Field>
              )}

              <Field label="Delivery Notes (optional)">
                <textarea className="co-input"
                  placeholder="Building entrance, special instructions..."
                  value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={3} style={{ ...inputStyle(), resize: 'vertical' }} />
              </Field>

              <Field label="Paste your Google Maps location link (optional)">
                <input className="co-input" type="url" placeholder="https://maps.app.goo.gl/..."
                  value={form.mapsLink} onChange={e => set('mapsLink', e.target.value)} style={inputStyle()} />
              </Field>
            </FormSection>

            {/* 03 Payment */}
            <FormSection number="03" title="Payment">
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                  <StripePaymentField ref={paymentFieldRef} onError={setPaymentError} />
                </Elements>
              ) : (
                <div style={{
                  padding: '1.75rem 1.5rem',
                  border: '1px solid rgba(61,26,26,0.1)', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  minHeight: '120px',
                }}>
                  {paymentError ? (
                    <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: '#c0392b', lineHeight: 1.5, textAlign: 'center' }}>
                      {paymentError}
                    </p>
                  ) : (
                    <><Spinner /><p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.55)' }}>Setting up secure payment…</p></>
                  )}
                </div>
              )}

              {clientSecret && paymentError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ margin: '0.75rem 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#c0392b', lineHeight: 1.5 }}>
                  {paymentError}
                </motion.p>
              )}
            </FormSection>
          </div>

          {/* ── Sidebar: Order Summary (desktop) ── */}
          <div className="co-sidebar" style={{ width: '360px', flexShrink: 0, position: 'sticky', top: 'calc(var(--bar-h) + var(--nav-h) + 2rem)' }}>
            <OrderSummaryCard
              items={items} cartTotal={cartTotal} orderTotal={orderTotal}
              deliveryFee={deliveryFee} giftCardQty={giftCardQty} giftCardTotal={giftCardTotal}
              loading={loading} serverError={serverError} errors={errors}
              paymentError={paymentError} btnDisabled={btnDisabled}
              onPlace={handlePlaceOrder}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile sticky order summary ── */}
      <div className="co-mobile-summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'rgba(61,26,26,0.68)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} · Delivery AED {deliveryFee}
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.4rem', fontWeight: 500, color: 'var(--color-dark)' }}>
              AED {orderTotal}
            </p>
          </div>
          <motion.button className="co-place-btn" onClick={handlePlaceOrder} whileTap={{ scale: 0.97 }}
            disabled={btnDisabled}
            style={{
              padding: '0.875rem 1.75rem',
              background: 'var(--color-dark)', color: '#fff',
              border: 'none', borderRadius: '8px',
              fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: btnDisabled ? 'wait' : 'pointer', fontWeight: 600,
              opacity: btnDisabled ? 0.72 : 1,
              display: 'flex', alignItems: 'center',
            }}
          >
            {(loading || creatingIntent) && <Spinner light />}
            {loading ? 'Processing…' : creatingIntent ? 'Setting up…' : 'Place Order'}
          </motion.button>
        </div>
        {paymentError && (
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: '#c0392b', textAlign: 'center' }}>
            {paymentError}
          </p>
        )}
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

function OrderSummaryCard({
  items, cartTotal, orderTotal, deliveryFee, giftCardQty = 0, giftCardTotal = 0,
  loading, serverError, errors, paymentError, btnDisabled, onPlace,
}) {
  const btnLabel = loading ? 'Processing your order…' : 'Place Order'

  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '2rem', boxShadow: '0 4px 32px rgba(61,26,26,0.07)' }}>
      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-dark)', margin: '0 0 1.5rem' }}>
        Order Summary
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {items.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.68)' }}>
            No items.{' '}<Link to="/shop" style={{ color: 'var(--color-gold)', textDecoration: 'none' }}>Shop now</Link>
          </p>
        ) : items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            {item.image ? (
              <img src={item.image} alt={item.name}
                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '50px', height: '50px', borderRadius: '6px', flexShrink: 0, background: 'rgba(61,26,26,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(61,26,26,0.3)" strokeWidth="1" width="20" height="20">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 500, color: 'var(--color-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </p>
              {item.mixBoxFlavors && (
                <p style={{ margin: '0.1rem 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.62rem', color: 'rgba(61,26,26,0.68)', lineHeight: 1.4 }}>
                  {item.mixBoxFlavors.map(f => `${f.name} ×${f.qty}`).join(', ')}
                </p>
              )}
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: 'rgba(61,26,26,0.65)' }}>×{item.quantity}</p>
            </div>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-dark)', flexShrink: 0 }}>
              AED {item.price * item.quantity}
            </p>
          </div>
        ))}
      </div>

      <div style={{ height: '1px', background: 'rgba(61,26,26,0.09)', marginBottom: '1.25rem' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.70)' }}>Subtotal</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)' }}>AED {cartTotal}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.70)' }}>Delivery</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)' }}>AED {deliveryFee}</span>
        </div>
        {giftCardQty > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'rgba(61,26,26,0.70)' }}>Gift Card ×{giftCardQty}</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', color: 'var(--color-dark)' }}>AED {giftCardTotal}</span>
          </div>
        )}
        <div style={{ height: '1px', background: 'rgba(61,26,26,0.09)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-dark)' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-dark)', fontWeight: 500 }}>
            AED {orderTotal}
          </span>
        </div>
      </div>

      <motion.button className="co-place-btn" onClick={onPlace} whileTap={{ scale: 0.98 }} disabled={btnDisabled}
        style={{
          width: '100%', padding: '1rem',
          background: 'var(--color-dark)', color: '#fff',
          border: 'none', borderRadius: '8px',
          fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          cursor: btnDisabled ? 'wait' : 'pointer', fontWeight: 600,
          opacity: btnDisabled ? 0.72 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {loading && <Spinner light />}
        {btnLabel}
      </motion.button>

      {paymentError && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: '0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#c0392b', textAlign: 'center', lineHeight: 1.5 }}>
          {paymentError}
        </motion.p>
      )}
      {Object.keys(errors).length > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: '0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#c0392b', textAlign: 'center', lineHeight: 1.5 }}>
          Please fill all required fields.
        </motion.p>
      )}
      {serverError && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: '0.75rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', color: '#c0392b', textAlign: 'center', lineHeight: 1.5 }}>
          {serverError}
        </motion.p>
      )}
    </div>
  )
}
