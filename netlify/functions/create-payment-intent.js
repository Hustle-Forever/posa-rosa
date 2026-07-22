// POST /api/create-payment-intent
// Creates a Stripe PaymentIntent after server-side total validation.
// Body: { items, emirate, claimedTotal, giftCardQuantity? }
// Returns: { clientSecret, paymentIntentId, amount }

const Stripe = require('stripe')
let _stripe = null
function getStripe() {
  if (!_stripe) _stripe = Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set(
  [
    'https://posarosa.ae',
    'https://www.posarosa.ae',
    'https://famous-fox-da26ec.netlify.app',
    'https://posa-rosa.netlify.app',
    'http://localhost:5173',
    'http://localhost:8888',
    process.env.ALLOWED_ORIGIN,
  ].filter(Boolean)
)

function isAllowedOrigin(origin) {
  if (!origin) return true
  if (ALLOWED_ORIGINS.has(origin)) return true
  return /^https:\/\/[a-z0-9-]+--posa-rosa\.netlify\.app$/.test(origin)
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin':
      origin && isAllowedOrigin(origin) ? origin : 'https://posa-rosa.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

// ── Delivery fee (mirrors create-order.js and client-side logic) ──────────────
function computeDeliveryFee(emirate, items) {
  const allApparel =
    Array.isArray(items) && items.length > 0 && items.every(i => i.isApparel === true)
  if (allApparel) return 22
  return emirate === 'Abu Dhabi' ? 35 : 40
}

const MIX_BOX_PRICE   = 165
const GIFT_CARD_PRICE  = 5
const MAX_ITEMS        = 50
const MAX_QTY          = 100

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin
  const CORS   = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }
  if (origin && !isAllowedOrigin(origin)) {
    return { statusCode: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Forbidden' }) }
  }

  let body
  try { body = JSON.parse(event.body || '{}') }
  catch {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { items, emirate, claimedTotal, giftCardQuantity: rawGiftQty } = body
  const giftCardQuantity = Math.max(0, Math.min(99, parseInt(rawGiftQty) || 0))

  // Validate items array
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'items array required' }) }
  }

  for (const i of items) {
    if (typeof i !== 'object' || i === null) {
      return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid item' }) }
    }
    if (i.customItem === 'mix-box') {
      if (i.price !== MIX_BOX_PRICE) {
        return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid Mix Box price' }) }
      }
    } else {
      if (typeof i.price !== 'number' || !isFinite(i.price) || i.price < 0 || i.price > 100_000) {
        return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid item price' }) }
      }
    }
    if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY) {
      return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid item quantity' }) }
    }
  }

  // Server-side total computation
  const subtotal    = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const deliveryFee = computeDeliveryFee(emirate || 'Abu Dhabi', items)
  const giftTotal   = giftCardQuantity * GIFT_CARD_PRICE
  const serverTotal = Math.round((subtotal + deliveryFee + giftTotal) * 100) / 100

  // Validate claimed total when provided (detects price tampering)
  if (claimedTotal !== undefined) {
    const parsed = parseFloat(claimedTotal)
    if (!isFinite(parsed) || Math.abs(serverTotal - parsed) > 0.01) {
      return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Price mismatch — please refresh and try again' }) }
    }
  }

  // AED minimum: 200 fils (AED 2.00) per Stripe
  const amountInFils = Math.round(serverTotal * 100)
  if (amountInFils < 200) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Order total too low' }) }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Payment system not configured' }) }
  }

  let paymentIntent
  try {
    paymentIntent = await getStripe().paymentIntents.create({
      amount:   amountInFils,
      currency: 'aed',
      automatic_payment_methods: { enabled: true },
      metadata: {
        subtotal:    subtotal.toFixed(2),
        deliveryFee: String(deliveryFee),
        emirate:     emirate || 'Abu Dhabi',
      },
    })
  } catch (err) {
    console.error('[create-payment-intent] Stripe error:', err.message)
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Payment system error — please try again' }) }
  }

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientSecret:    paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount:          amountInFils,
    }),
  }
}
