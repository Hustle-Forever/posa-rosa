import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Building2, Sparkles, Gift } from 'lucide-react'

const WA_URL = 'https://wa.me/971500000000?text=' + encodeURIComponent("Hi! I'm interested in a custom/wholesale order from Posa Rosa")

const PACKAGES = [
  {
    Icon: Building2,
    tag: 'Business',
    title: 'Café & Corporate',
    desc: 'Bulk orders for cafés, restaurants, and corporate gifting. Custom packaging with your logo available.',
    from: 'AED 500',
    perks: ['Minimum 50 pieces', 'Custom logo packaging', 'Recurring orders welcome'],
  },
  {
    Icon: Sparkles,
    tag: 'Celebrations',
    title: 'Weddings & Events',
    desc: 'Bespoke butterfly chocolates for your special day. Personalized boxes, custom colors, and flavors.',
    from: 'AED 800',
    perks: ['Personalized packaging', 'Custom flavors on request', 'Free design consultation'],
    featured: true,
  },
  {
    Icon: Gift,
    tag: 'Gifting',
    title: 'Birthday & Gifting',
    desc: "Custom chocolate boxes for birthdays, Eid, Mother's Day, and every special occasion.",
    from: 'AED 200',
    perks: ['From 20 pieces', 'Gift wrapping included', 'Same-week delivery'],
  },
]

const ORDER_TYPES = ['Café / Corporate', 'Wedding / Event', 'Birthday / Gifting', 'Other']
const BUDGETS     = ['Under AED 500', 'AED 500–1,000', 'AED 1,000–2,000', 'AED 2,000+']

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }
}

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-sans)',
  fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'rgba(61,26,26,0.5)', marginBottom: '0.45rem', fontWeight: 500,
}

function inputSt(err) {
  return {
    width: '100%', padding: '0.85rem 1rem', background: '#fff',
    border: `1px solid ${err ? '#c0392b' : 'rgba(61,26,26,0.15)'}`,
    borderRadius: '8px', fontFamily: 'var(--font-sans)', fontSize: '0.86rem',
    color: '#3D1A1A', boxSizing: 'border-box', outline: 'none',
    appearance: 'none', transition: 'border-color 0.22s ease',
  }
}

export default function WholesalePage() {
  const formRef = useRef(null)
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    orderType: '', quantity: '', requirements: '', budget: '',
  })
  const [errors, setErrors] = useState({})
  const [sent, setSent]     = useState(false)
  const [busy, setBusy]     = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  function validate() {
    const e = {}
    if (!form.name.trim())  e.name      = 'Required'
    if (!form.phone.trim()) e.phone     = 'Required'
    if (!form.email.trim()) e.email     = 'Required'
    if (!form.orderType)    e.orderType = 'Please select'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setBusy(true)
    setTimeout(() => { setSent(true); setBusy(false) }, 1000)
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: 'calc(var(--bar-h) + var(--nav-h))' }}
    >
      <style>{`
        .ws-input:focus { border-color: #3D1A1A !important; box-shadow: 0 0 0 3px rgba(61,26,26,0.06) !important; }
        .ws-input::placeholder { color: rgba(61,26,26,0.28); }
        .pkg-card { transition: box-shadow 0.35s ease, transform 0.35s ease; }
        .pkg-card:hover { transform: translateY(-6px); }
        .ws-submit:hover:not(:disabled) { background: var(--color-gold) !important; color: var(--color-dark) !important; }
        @media (max-width: 540px) { .ws-two-col { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: '55vh',
        background: 'linear-gradient(135deg, #3D1A1A 0%, #5C2E2E 50%, #3D1A1A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '5rem 2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('/assets/images/Soft, melty, perfect..jpg')`,
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12,
        }} />
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '1px', height: '80px', background: 'rgba(201,169,110,0.4)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.62rem',
              letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'var(--color-gold)', fontWeight: 600, margin: '0 0 1.25rem',
            }}
          >
            For Cafés · Weddings · Corporates · Events
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.75 }}
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2.8rem, 8vw, 5.5rem)',
              fontWeight: 300, color: '#FDF6F0',
              letterSpacing: '0.04em', lineHeight: 1.08, margin: '0 0 1.5rem',
            }}
          >
            Custom & Wholesale Orders
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 'clamp(0.88rem, 2vw, 1rem)',
              color: 'rgba(253,246,240,0.65)', lineHeight: 1.75, margin: '0 0 2.5rem',
            }}
          >
            Handcrafted butterfly chocolates for your business, event, or special occasion.
            Minimum orders, custom packaging, and personalized flavors available.
          </motion.p>
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.42, duration: 0.6 }}
            onClick={scrollToForm}
            style={{
              padding: '1.1rem 2.75rem',
              background: 'var(--color-gold)', color: '#3D1A1A',
              border: 'none', borderRadius: '8px',
              fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer', fontWeight: 600,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 6px 24px rgba(201,169,110,0.4)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Get a Quote
          </motion.button>
        </div>
      </section>

      {/* ─── PACKAGES ─── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(4rem, 8vw, 7rem) 2rem' }}>
        <motion.h2
          {...fade()}
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 300, color: '#3D1A1A', letterSpacing: '0.05em',
            textAlign: 'center', margin: '0 0 0.75rem',
          }}
        >
          Our Packages
        </motion.h2>
        <motion.p
          {...fade(0.1)}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
            color: 'rgba(61,26,26,0.45)', textAlign: 'center',
            letterSpacing: '0.08em', margin: '0 0 3.5rem',
          }}
        >
          Starting prices — final quote based on quantity &amp; customization
        </motion.p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem', alignItems: 'stretch',
        }}>
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={i}
              {...fade(0.1 * i)}
              className="pkg-card"
              style={{
                background: pkg.featured ? '#3D1A1A' : '#fff',
                borderRadius: '16px',
                padding: '2.25rem 2rem',
                boxShadow: pkg.featured
                  ? '0 20px 60px rgba(61,26,26,0.25)'
                  : '0 4px 24px rgba(61,26,26,0.07)',
                border: pkg.featured ? 'none' : '1px solid rgba(61,26,26,0.07)',
                display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {pkg.featured && (
                <div style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  background: 'var(--color-gold)', color: '#3D1A1A',
                  padding: '0.25rem 0.75rem', borderRadius: '100px',
                  fontFamily: 'var(--font-sans)', fontSize: '0.58rem',
                  letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                }}>
                  Popular
                </div>
              )}

              {/* Lucide icon in circle — no emoji */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: pkg.featured ? 'rgba(201,169,110,0.15)' : 'rgba(201,169,110,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem', flexShrink: 0,
              }}>
                <pkg.Icon size={22} strokeWidth={1.5} color="var(--color-gold)" />
              </div>

              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.58rem',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--color-gold)', fontWeight: 600,
                marginBottom: '0.45rem', display: 'block',
              }}>
                {pkg.tag}
              </span>

              <h3 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '1.6rem', fontWeight: 400,
                color: pkg.featured ? '#FDF6F0' : '#3D1A1A',
                margin: '0 0 0.75rem', lineHeight: 1.2,
              }}>
                {pkg.title}
              </h3>

              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.84rem',
                color: pkg.featured ? 'rgba(253,246,240,0.62)' : 'rgba(61,26,26,0.6)',
                lineHeight: 1.7, margin: '0 0 1.5rem',
              }}>
                {pkg.desc}
              </p>

              <ul style={{
                listStyle: 'none', display: 'flex', flexDirection: 'column',
                gap: '0.5rem', marginBottom: '1.75rem', flex: 1,
              }}>
                {pkg.perks.map((perk, j) => (
                  <li key={j} style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
                    color: pkg.featured ? 'rgba(253,246,240,0.7)' : 'rgba(61,26,26,0.65)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <span style={{ color: 'var(--color-gold)', flexShrink: 0 }}>&#10003;</span>
                    {perk}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1.5rem' }}>
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.62rem',
                  color: pkg.featured ? 'rgba(253,246,240,0.45)' : 'rgba(61,26,26,0.4)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  Starting from
                </span>
                <span style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: '1.8rem', fontWeight: 400,
                  color: pkg.featured ? '#FDF6F0' : '#3D1A1A',
                  letterSpacing: '0.02em',
                }}>
                  {pkg.from}
                </span>
              </div>

              <button
                onClick={scrollToForm}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: pkg.featured ? 'var(--color-gold)' : 'transparent',
                  color: '#3D1A1A',
                  border: pkg.featured ? 'none' : '1px solid rgba(61,26,26,0.25)',
                  borderRadius: '8px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
                  letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
                  transition: 'all 0.25s ease',
                }}
                onMouseEnter={e => {
                  if (!pkg.featured) {
                    e.currentTarget.style.background = '#3D1A1A'
                    e.currentTarget.style.color = '#FDF6F0'
                    e.currentTarget.style.borderColor = '#3D1A1A'
                  }
                }}
                onMouseLeave={e => {
                  if (!pkg.featured) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#3D1A1A'
                    e.currentTarget.style.borderColor = 'rgba(61,26,26,0.25)'
                  }
                }}
              >
                Get a Quote
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CUSTOM ORDER FORM ─── */}
      <section
        ref={formRef}
        style={{ background: 'rgba(201,169,110,0.07)', padding: 'clamp(4rem, 8vw, 7rem) 2rem' }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <motion.p
            {...fade()}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.62rem',
              letterSpacing: '0.26em', textTransform: 'uppercase',
              color: 'var(--color-gold)', fontWeight: 600, margin: '0 0 1rem',
            }}
          >
            Custom Order
          </motion.p>
          <motion.h2
            {...fade(0.1)}
            style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 300, color: '#3D1A1A',
              letterSpacing: '0.04em', margin: '0 0 0.75rem',
            }}
          >
            Send My Request
          </motion.h2>
          <motion.p
            {...fade(0.15)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.84rem',
              color: 'rgba(61,26,26,0.52)', lineHeight: 1.7, margin: '0 0 2.5rem',
            }}
          >
            Fill in the form and we'll get back to you within 2 hours with a detailed quote.
          </motion.p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center', padding: '3.5rem 2rem',
                background: '#fff', borderRadius: '16px',
                boxShadow: '0 8px 40px rgba(61,26,26,0.08)',
              }}
            >
              {/* Gold divider line instead of emoji */}
              <div style={{
                width: '36px', height: '2px',
                background: 'var(--color-gold)',
                margin: '0 auto 1.5rem',
                borderRadius: '1px',
              }} />
              <h3 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: '2rem', fontWeight: 300,
                color: '#3D1A1A', margin: '0 0 0.75rem',
              }}>
                Request Received
              </h3>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.86rem',
                color: 'rgba(61,26,26,0.55)', lineHeight: 1.7,
              }}>
                Thank you for your interest. We'll be in touch within 2 hours with your custom quote.
              </p>
            </motion.div>
          ) : (
            <motion.form
              {...fade(0.2)}
              onSubmit={handleSubmit}
              style={{
                background: '#fff', borderRadius: '16px',
                padding: 'clamp(1.75rem, 5vw, 2.5rem)',
                boxShadow: '0 8px 40px rgba(61,26,26,0.07)',
                display: 'flex', flexDirection: 'column', gap: '1.25rem',
              }}
            >
              {/* Row: Name + Phone */}
              <div className="ws-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input className="ws-input" type="text" value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Fatima Al Mansoori" style={inputSt(errors.name)} />
                  {errors.name && <p style={errStyle}>{errors.name}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input className="ws-input" type="tel" value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+971 50 000 0000" style={inputSt(errors.phone)} />
                  {errors.phone && <p style={errStyle}>{errors.phone}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email *</label>
                <input className="ws-input" type="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com" style={inputSt(errors.email)} />
                {errors.email && <p style={errStyle}>{errors.email}</p>}
              </div>

              {/* Order Type */}
              <div>
                <label style={labelStyle}>Order Type *</label>
                <select className="ws-input" value={form.orderType}
                  onChange={e => set('orderType', e.target.value)}
                  style={{
                    ...inputSt(errors.orderType),
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%233D1A1A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '2.5rem',
                  }}>
                  <option value="">Select type</option>
                  {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.orderType && <p style={errStyle}>{errors.orderType}</p>}
              </div>

              {/* Quantity */}
              <div>
                <label style={labelStyle}>Estimated Quantity</label>
                <input className="ws-input" type="text" value={form.quantity}
                  onChange={e => set('quantity', e.target.value)}
                  placeholder="e.g. 100 pieces, 10 boxes" style={inputSt()} />
              </div>

              {/* Budget */}
              <div>
                <label style={labelStyle}>Budget Range</label>
                <select className="ws-input" value={form.budget}
                  onChange={e => set('budget', e.target.value)}
                  style={{
                    ...inputSt(),
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%233D1A1A' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '2.5rem',
                  }}>
                  <option value="">Select budget</option>
                  {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Special Requirements */}
              <div>
                <label style={labelStyle}>Special Requirements</label>
                <textarea
                  className="ws-input"
                  value={form.requirements}
                  onChange={e => set('requirements', e.target.value)}
                  placeholder="Tell us about your event, custom flavors, packaging ideas, delivery date..."
                  rows={5}
                  style={{ ...inputSt(), resize: 'vertical', minHeight: '120px' }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="ws-submit"
                style={{
                  padding: '1.1rem', background: '#3D1A1A',
                  color: 'var(--color-gold)', border: 'none', borderRadius: '8px',
                  fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
                  opacity: busy ? 0.72 : 1,
                  transition: 'background 0.28s ease, color 0.28s ease, opacity 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                }}
              >
                {busy ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: '16px', height: '16px',
                      borderRadius: '50%', border: '2px solid rgba(201,169,110,0.3)',
                      borderTopColor: 'var(--color-gold)',
                      animation: 'ws-spin 0.75s linear infinite',
                    }} />
                    Sending…
                  </>
                ) : 'Send My Request'}
              </button>
              <style>{`@keyframes ws-spin { to { transform: rotate(360deg); } }`}</style>

              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.7rem',
                color: 'rgba(61,26,26,0.38)', textAlign: 'center', margin: 0,
              }}>
                Prefer WhatsApp?{' '}
                <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}>
                  Chat with us directly
                </a>
              </p>
            </motion.form>
          )}
        </div>
      </section>
    </motion.div>
  )
}

const errStyle = {
  margin: '0.3rem 0 0',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.68rem',
  color: '#c0392b',
}
