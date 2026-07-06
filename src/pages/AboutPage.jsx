import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scissors, Star, Heart } from 'lucide-react'

const WA_URL = 'https://wa.me/971500000000?text=' + encodeURIComponent("Hi! I'd like to learn more about Posa Rosa")

const VALUES = [
  {
    Icon: Scissors,
    title: 'Handcrafted',
    desc: 'Every butterfly is shaped, filled, and finished by hand. No shortcuts, only care.',
  },
  {
    Icon: Star,
    title: 'Premium Ingredients',
    desc: 'We source only the finest Belgian chocolate and freshest fillings. Quality you can taste.',
  },
  {
    Icon: Heart,
    title: 'Made with Love',
    desc: 'Born in Abu Dhabi, inspired by the belief that beautiful things should be edible.',
  },
]

// Google Maps search links — replace with exact place URLs once confirmed
const LOCATIONS = [
  {
    name: 'Para Café — Rabdan Mall',
    shortName: 'Rabdan Mall',
    address: 'Ground Floor, Rabdan Mall, Abu Dhabi',
    hours: 'Open 9AM – 8PM · Every Day',
    mapsLink: 'https://www.google.com/maps/search/Para+Cafe+Rabdan+Mall+Abu+Dhabi',
  },
  {
    name: 'Para Café — Abu Dhabi University',
    shortName: 'Abu Dhabi University',
    address: 'Abu Dhabi University Campus, Abu Dhabi',
    hours: 'Open 9AM – 8PM · Every Day',
    mapsLink: 'https://www.google.com/maps/search/Para+Cafe+Abu+Dhabi+University+UAE',
  },
]

// ─── MAP PIN ICON ─────────────────────────────────────────────────────────────
function MapPinIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ArrowRightIcon({ size = 12 }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setTimeout(() => { setSent(true); setBusy(false) }, 900)
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'rgba(201,169,110,0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(201,169,110,0.3)',
        }}
      >
        <p style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.8rem', fontWeight: 300,
          color: 'var(--color-dark)', margin: '0 0 0.5rem',
        }}>
          Thank you
        </p>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '0.8rem',
          color: 'rgba(61,26,26,0.6)', letterSpacing: '0.05em',
        }}>
          We'll be in touch within 2 hours.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[
        { key: 'name',  label: 'Your Name',      type: 'text',  placeholder: 'Fatima' },
        { key: 'email', label: 'Email Address',   type: 'email', placeholder: 'you@example.com' },
      ].map(({ key, label, type, placeholder }) => (
        <div key={key}>
          <label style={labelStyle}>{label}</label>
          <input
            className="about-input"
            type={type}
            value={form[key]}
            onChange={e => set(key, e.target.value)}
            placeholder={placeholder}
            required
            style={inputStyle}
          />
        </div>
      ))}
      <div>
        <label style={labelStyle}>Message</label>
        <textarea
          className="about-input"
          value={form.message}
          onChange={e => set('message', e.target.value)}
          placeholder="Tell us about your order or question..."
          rows={4}
          required
          style={{ ...inputStyle, resize: 'vertical', minHeight: '110px' }}
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        style={{
          padding: '1rem',
          background: 'var(--color-dark)', color: '#fff',
          border: 'none', borderRadius: '6px',
          fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          cursor: busy ? 'wait' : 'pointer', fontWeight: 600,
          opacity: busy ? 0.7 : 1, transition: 'all 0.28s ease',
        }}
      >
        {busy ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-sans)',
  fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase',
  color: 'rgba(61,26,26,0.5)', marginBottom: '0.4rem', fontWeight: 500,
}

const inputStyle = {
  width: '100%', padding: '0.8rem 1rem', background: '#fff',
  border: '1px solid rgba(61,26,26,0.15)', borderRadius: '6px',
  fontFamily: 'var(--font-sans)', fontSize: '0.86rem', color: 'var(--color-dark)',
  boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.22s ease',
}

function fade(delay = 0) {
  return {
    initial: { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
  }
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingTop: 'calc(var(--bar-h) + var(--nav-h))' }}
    >
      <style>{`
        .about-input:focus { border-color: var(--color-dark) !important; box-shadow: 0 0 0 3px rgba(201,160,163,0.18) !important; }
        .about-input::placeholder { color: rgba(61,26,26,0.28); }
        .wa-btn-about:hover { background: #1da851 !important; }

        /* Location cards */
        .location-card {
          transition: box-shadow 0.3s ease, transform 0.3s ease,
                      border-color 0.3s ease;
          text-decoration: none;
          display: block;
        }
        .location-card:hover {
          box-shadow: 0 16px 56px rgba(0,0,0,0.32) !important;
          transform: translateY(-4px);
          border-color: rgba(201,169,110,0.45) !important;
        }
        .location-card:hover .loc-directions {
          color: var(--color-gold) !important;
          opacity: 1 !important;
        }
        .location-card:hover .loc-arrow {
          transform: translateX(3px);
        }
        .loc-directions { transition: color 0.25s ease, opacity 0.25s ease; }
        .loc-arrow { transition: transform 0.25s ease; display: inline-block; }

        /* Value cards */
        .value-card { transition: box-shadow 0.3s ease, transform 0.3s ease; }
        .value-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(61,26,26,0.1) !important; }
      `}</style>

      {/* ─── HERO ─── */}
      <section style={{
        minHeight: '60vh',
        background: 'linear-gradient(135deg, #B8898D 0%, #C9A0A3 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '5rem 2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Warpaper botanical silhouette — subtle decorative accent */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('/assets/brand-reference/Warpaper.png')`,
          backgroundSize: 'cover', backgroundPosition: 'center bottom', opacity: 0.13,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('/assets/images/Original, simple, perfect..jpg')`,
          backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18,
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <motion.p
            {...fade(0.1)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'rgba(253,246,240,0.55)', marginBottom: '1.2rem',
            }}
          >
            Abu Dhabi · Since 2023
          </motion.p>
          <motion.h1
            {...fade(0.18)}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: 300, color: '#FDF6F0',
              letterSpacing: '0.05em', lineHeight: 1.08, margin: '0 0 1.5rem',
            }}
          >
            About Posa Rosa
          </motion.h1>
          <motion.p
            {...fade(0.28)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 'clamp(0.88rem, 2vw, 1rem)',
              color: 'rgba(253,246,240,0.7)', lineHeight: 1.75,
              maxWidth: '480px', margin: '0 auto', letterSpacing: '0.02em',
            }}
          >
            We make handcrafted butterfly chocolates — each one shaped, filled, and finished by hand
            in Abu Dhabi. Born from a love of beauty and great chocolate.
          </motion.p>
        </div>
      </section>

      {/* ─── OUR STORY ─── */}
      <section style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(4rem, 8vw, 7rem) 2rem' }}>
        <motion.p
          {...fade()}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
            letterSpacing: '0.26em', textTransform: 'uppercase',
            color: 'var(--color-gold)', marginBottom: '1.25rem', fontWeight: 600,
          }}
        >
          Our Story
        </motion.p>
        <motion.h2
          {...fade(0.1)}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 300, color: 'var(--color-dark)',
            letterSpacing: '0.04em', lineHeight: 1.2, margin: '0 0 2rem',
          }}
        >
          A Bite of Bliss
        </motion.h2>
        <motion.div {...fade(0.15)} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {[
            'Posa Rosa began as a simple idea — what if a chocolate could look as extraordinary as it tastes? We started crafting butterfly-shaped chocolates in Abu Dhabi, and the response was overwhelming.',
            'Every piece is made by hand, from the delicate wings to the carefully chosen fillings. We work with premium Belgian chocolate and the freshest ingredients to create something that\'s as beautiful to look at as it is to eat.',
            'Today you can find us at Para Café locations across Abu Dhabi, but the heart behind every butterfly remains the same: genuine care, premium craft, and a little joy in every bite.',
          ].map((para, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-sans)', fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              color: 'rgba(61,26,26,0.72)', lineHeight: 1.8, margin: 0,
            }}>
              {para}
            </p>
          ))}
        </motion.div>
      </section>

      {/* ─── FIND US ─── */}
      <section style={{ background: 'var(--color-dark)', padding: 'clamp(4rem, 8vw, 7rem) 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.p
            {...fade()}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
              letterSpacing: '0.26em', textTransform: 'uppercase',
              color: 'var(--color-gold)', marginBottom: '1rem', fontWeight: 600, textAlign: 'center',
            }}
          >
            Available At
          </motion.p>
          <motion.h2
            {...fade(0.1)}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 300, color: '#FDF6F0',
              letterSpacing: '0.05em', textAlign: 'center', margin: '0 0 0.75rem',
            }}
          >
            Find Us
          </motion.h2>
          <motion.p
            {...fade(0.15)}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
              color: 'rgba(253,246,240,0.45)', textAlign: 'center',
              letterSpacing: '0.1em', marginBottom: '3rem',
            }}
          >
            Para Café locations across Abu Dhabi · Tap a card to open in Maps
          </motion.p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {LOCATIONS.map((loc, i) => (
              <motion.a
                key={i}
                {...fade(0.1 * i)}
                href={loc.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="location-card"
                style={{
                  background: 'rgba(253,246,240,0.06)',
                  border: '1px solid rgba(253,246,240,0.12)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ padding: '2rem 1.75rem 1.5rem' }}>
                  {/* Label */}
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.6rem',
                    letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: 'var(--color-gold)', fontWeight: 600, margin: '0 0 0.75rem',
                  }}>
                    Para Café
                  </p>

                  {/* Branch name */}
                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.4rem', fontWeight: 400,
                    color: '#FDF6F0', margin: '0 0 0.6rem', lineHeight: 1.2,
                  }}>
                    {loc.shortName}
                  </h3>

                  {/* Address */}
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.82rem',
                    color: 'rgba(253,246,240,0.6)',
                    margin: '0 0 0.3rem', lineHeight: 1.55,
                  }}>
                    {loc.address}
                  </p>

                  {/* Hours */}
                  <p style={{
                    fontFamily: 'var(--font-sans)', fontSize: '0.72rem',
                    color: 'rgba(253,246,240,0.35)', margin: 0, letterSpacing: '0.04em',
                  }}>
                    {loc.hours}
                  </p>

                  {/* Get Directions CTA */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(253,246,240,0.1)',
                  }}>
                    <MapPinIcon size={13} color="rgba(201,169,110,0.7)" />
                    <span
                      className="loc-directions"
                      style={{
                        fontFamily: 'var(--font-sans)', fontSize: '0.66rem',
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        fontWeight: 600, color: 'rgba(253,246,240,0.45)',
                        flex: 1,
                      }}
                    >
                      Get Directions
                    </span>
                    <span className="loc-arrow" style={{ color: 'rgba(201,169,110,0.5)', display: 'flex' }}>
                      <ArrowRightIcon size={13} />
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GET IN TOUCH ─── */}
      <section style={{ maxWidth: '640px', margin: '0 auto', padding: 'clamp(4rem, 8vw, 7rem) 2rem' }}>
        <motion.p
          {...fade()}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.65rem',
            letterSpacing: '0.26em', textTransform: 'uppercase',
            color: 'var(--color-gold)', marginBottom: '1rem', fontWeight: 600,
          }}
        >
          Say Hello
        </motion.p>
        <motion.h2
          {...fade(0.1)}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 300, color: 'var(--color-dark)',
            letterSpacing: '0.04em', margin: '0 0 0.75rem',
          }}
        >
          Get In Touch
        </motion.h2>
        <motion.p
          {...fade(0.15)}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '0.84rem',
            color: 'rgba(61,26,26,0.55)', lineHeight: 1.7, margin: '0 0 2.5rem',
          }}
        >
          Have a question, custom order, or just want to say hi? We'd love to hear from you.
        </motion.p>

        {/* WhatsApp CTA */}
        <motion.a
          {...fade(0.18)}
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-btn-about"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem', width: '100%', padding: '1.1rem',
            background: '#25D366', color: '#fff', borderRadius: '8px',
            fontFamily: 'var(--font-sans)', fontSize: '0.82rem',
            fontWeight: 600, letterSpacing: '0.08em',
            textDecoration: 'none', marginBottom: '2rem',
            transition: 'background 0.25s ease', boxSizing: 'border-box',
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Chat on WhatsApp
        </motion.a>

        {/* Form */}
        <motion.div {...fade(0.2)}>
          <ContactForm />
        </motion.div>
      </section>

      {/* ─── BRAND VALUES ─── */}
      <section style={{ background: 'rgba(201,169,110,0.07)', padding: 'clamp(4rem, 8vw, 7rem) 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.h2
            {...fade()}
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 300, color: 'var(--color-dark)',
              letterSpacing: '0.05em', textAlign: 'center', margin: '0 0 3rem',
            }}
          >
            What We Stand For
          </motion.h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}>
            {VALUES.map((v, i) => (
              <motion.div
                key={i}
                {...fade(0.1 * i)}
                className="value-card"
                style={{
                  background: '#fff', borderRadius: '14px',
                  padding: '2.25rem 1.75rem', textAlign: 'center',
                  boxShadow: '0 4px 24px rgba(61,26,26,0.06)',
                  border: '1px solid rgba(61,26,26,0.06)',
                }}
              >
                {/* Lucide icon — no emoji */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'rgba(201,169,110,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <v.Icon size={22} strokeWidth={1.5} color="var(--color-gold)" />
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.4rem', fontWeight: 400,
                  color: 'var(--color-dark)', margin: '0 0 0.75rem', letterSpacing: '0.02em',
                }}>
                  {v.title}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: '0.84rem',
                  color: 'rgba(61,26,26,0.58)', lineHeight: 1.7, margin: 0,
                }}>
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  )
}
