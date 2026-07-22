// POST /api/finalize-order
// Verifies a Stripe PaymentIntent has succeeded, then creates the Shopify order
// and writes to Firestore. Idempotent: repeated calls with the same
// paymentIntentId return the same result without creating duplicate orders.
//
// Body: { paymentIntentId, customer, delivery, items, total,
//          giftCardQuantity?, giftCardTo?, giftCardFrom?, giftCardMessage? }

const Stripe = require('stripe')
let _stripe = null
function getStripe() {
  if (!_stripe) _stripe = Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}

// ── Firebase (same client SDK pattern as create-order.js) ────────────────────
const { initializeApp, getApps, getApp } = require('firebase/app')
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore/lite')

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
}

const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const db    = getFirestore(fbApp)

// ── Shopify ───────────────────────────────────────────────────────────────────
const SHOPIFY_STORE      = 'posa-rosa.myshopify.com'
const SHOPIFY_TOKEN_URL  = `https://${SHOPIFY_STORE}/admin/oauth/access_token`
const SHOPIFY_ORDERS_URL = `https://${SHOPIFY_STORE}/admin/api/2024-01/orders.json`

let _cachedToken  = null
let _tokenExpiry  = 0
const TOKEN_BUFFER = 60_000

async function getShopifyToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - TOKEN_BUFFER) return _cachedToken
  const res  = await fetch(SHOPIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      grant_type:    'client_credentials',
    }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(`Shopify token error: ${res.status}`)
  _cachedToken = data.access_token
  _tokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000
  return _cachedToken
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

function isAllowedOrigin(o) {
  if (!o) return true
  if (ALLOWED_ORIGINS.has(o)) return true
  return /^https:\/\/[a-z0-9-]+--posa-rosa\.netlify\.app$/.test(o)
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeDeliveryFee(emirate, items) {
  const allApparel =
    Array.isArray(items) && items.length > 0 && items.every(i => i.isApparel === true)
  if (allApparel) return 22
  return emirate === 'Abu Dhabi' ? 35 : 40
}

function normalizeUAEPhone(raw) {
  const stripped = raw.replace(/[\s\-().]/g, '')
  const digits   = stripped.replace(/^\+/, '')
  if (digits.startsWith('971') && digits.length === 12) return '+' + digits
  if (digits.startsWith('0')   && digits.length === 10) return '+971' + digits.slice(1)
  if (digits.length === 9) return '+971' + digits
  return null
}

const MIX_BOX_PRICE   = 165
const GIFT_CARD_PRICE  = 5

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

  const {
    paymentIntentId,
    customer, delivery, items, total,
    giftCardQuantity: rawGiftQty,
    giftCardTo: rawGiftCardTo,
    giftCardFrom: rawGiftCardFrom,
    giftCardMessage: rawGiftCardMessage,
  } = body

  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'paymentIntentId required' }) }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Payment system not configured' }) }
  }

  // ── Idempotency check ─────────────────────────────────────────────────────
  const intentRef  = doc(db, 'pending_intents', paymentIntentId)
  const intentSnap = await getDoc(intentRef)

  if (intentSnap.exists()) {
    const state = intentSnap.data()
    if (state.status === 'completed') {
      console.log('[finalize-order] idempotent return for %s orderNumber=%s', paymentIntentId, state.orderNumber)
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, idempotent: true, orderNumber: state.orderNumber, orderId: state.shopifyOrderId }),
      }
    }
    // If status === 'processing', another invocation is in-flight — reject
    if (state.status === 'processing') {
      return { statusCode: 409, headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Order is being processed, please wait a moment and retry' }) }
    }
  }

  // ── Verify PaymentIntent with Stripe ──────────────────────────────────────
  let paymentIntent
  try {
    paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId)
  } catch (err) {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid paymentIntentId' }) }
  }

  if (paymentIntent.status !== 'succeeded') {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Payment not completed (status: ${paymentIntent.status})` }) }
  }

  // ── Basic input guards ────────────────────────────────────────────────────
  if (!customer?.name || !customer?.email || !customer?.phone) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Customer details required' }) }
  }
  if (!delivery?.address || !delivery?.area || !delivery?.date) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Delivery details required' }) }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Items required' }) }
  }

  const phone = normalizeUAEPhone(customer.phone || '')
  if (!phone) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid UAE phone number' }) }
  }

  const giftCardQuantity = Math.max(0, Math.min(99, parseInt(rawGiftQty) || 0))
  const giftCardTo       = (typeof rawGiftCardTo      === 'string' ? rawGiftCardTo.trim()      : '').slice(0, 200)
  const giftCardFrom     = (typeof rawGiftCardFrom    === 'string' ? rawGiftCardFrom.trim()    : '').slice(0, 200)
  const giftCardMessage  = (typeof rawGiftCardMessage === 'string' ? rawGiftCardMessage.trim() : '').slice(0, 500)

  const emirate     = delivery.emirate || 'Abu Dhabi'
  const deliveryFee = computeDeliveryFee(emirate, items)
  const subtotal    = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  // Verify server total matches Stripe amount (guard against stale PaymentIntent)
  const expectedTotal = Math.round((subtotal + deliveryFee + giftCardQuantity * GIFT_CARD_PRICE) * 100) / 100
  const stripeTotal   = paymentIntent.amount / 100
  if (Math.abs(expectedTotal - stripeTotal) > 0.01) {
    console.warn('[finalize-order] total mismatch: expected=%s stripe=%s pi=%s', expectedTotal, stripeTotal, paymentIntentId)
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Order total does not match payment amount' }) }
  }

  // ── Mark intent as processing (idempotency lock) ──────────────────────────
  await setDoc(intentRef, { status: 'processing', startedAt: new Date().toISOString() })

  // ── Build Shopify line items ──────────────────────────────────────────────
  const lineItems = items.reduce((acc, i) => {
    if (i.customItem === 'mix-box') {
      acc.push({ title: 'Mix Box (20 pcs)', price: MIX_BOX_PRICE.toFixed(2), quantity: i.quantity })
    } else if (i.variantId) {
      acc.push({ variant_id: parseInt(i.variantId.split('/').pop(), 10), quantity: i.quantity })
    }
    return acc
  }, [])

  if (giftCardQuantity > 0) {
    lineItems.push({ title: 'Posa Rosa Gift Card', price: '5.00', quantity: giftCardQuantity })
  }

  // ── Build order note ──────────────────────────────────────────────────────
  const deliveryTiming = emirate === 'Abu Dhabi' ? 'Same-day' : 'Next-day'
  const mixBoxNoteLines = items
    .filter(i => i.customItem === 'mix-box')
    .flatMap(i => [
      `MIX BOX × ${i.quantity}:`,
      ...(i.mixBoxFlavors || []).map(f => `  ${f.name} × ${f.qty}`),
    ])

  const noteLines = [
    `⚠ FULFILLMENT: DELIVERY — ${emirate} · ${delivery.area}`,
    `DELIVERY TIMING: ${deliveryTiming} (${emirate})`,
    `DELIVERY FEE: AED ${deliveryFee}`,
    `STRIPE PAYMENT: ${paymentIntentId}`,
    giftCardQuantity > 0 ? `GIFT CARD: ×${giftCardQuantity} — AED ${giftCardQuantity * 5}` : null,
    giftCardQuantity > 0 && (giftCardTo || giftCardFrom || giftCardMessage)
      ? `GIFT CARD NOTE — To: ${giftCardTo || '—'} | From: ${giftCardFrom || '—'} | Message: ${giftCardMessage || '—'}`
      : null,
    `DATE: ${delivery.date}`,
    delivery.timeSlot ? `TIME: ${delivery.timeSlot}` : `TIME: Next-day delivery (no time slot)`,
    `ADDRESS: ${delivery.address}`,
    delivery.mapsLink ? `MAPS: ${delivery.mapsLink}` : null,
    delivery.notes    ? `NOTES: ${delivery.notes}` : null,
    mixBoxNoteLines.length > 0 ? '---' : null,
    ...mixBoxNoteLines,
  ]

  const orderBody = {
    order: {
      line_items: lineItems,
      customer:   { first_name: customer.name, email: customer.email, phone },
      shipping_address: {
        name: customer.name, address1: delivery.address, city: emirate, country: 'AE', phone,
      },
      financial_status: 'paid',
      note:             noteLines.filter(Boolean).join('\n'),
      note_attributes: [{ name: 'stripe_payment_intent_id', value: paymentIntentId }],
      tags:             'posa-rosa-website,stripe-paid',
      send_receipt:     true,
    },
  }

  // ── Create Shopify order ──────────────────────────────────────────────────
  let shopifyData
  try {
    const token      = await getShopifyToken()
    let shopifyRes   = await fetch(SHOPIFY_ORDERS_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body:    JSON.stringify(orderBody),
    })
    shopifyData = await shopifyRes.json()

    // Retry on phone-already-taken
    if (!shopifyRes.ok && shopifyRes.status === 422 &&
        shopifyData?.errors?.['customer.phone_number']?.some(e => e.includes('already been taken'))) {
      const retry = { order: { ...orderBody.order, customer: { first_name: customer.name, email: customer.email } } }
      shopifyRes  = await fetch(SHOPIFY_ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body:   JSON.stringify(retry),
      })
      shopifyData = await shopifyRes.json()
    }

    if (!shopifyRes.ok) {
      console.error('[finalize-order] Shopify error %s pi=%s', shopifyRes.status, paymentIntentId)
      // Reset idempotency lock so the client can retry
      await setDoc(intentRef, { status: 'failed', failedAt: new Date().toISOString() }, { merge: true })
      return { statusCode: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Could not place order — please contact us on WhatsApp' }) }
    }
  } catch (err) {
    console.error('[finalize-order] Shopify fetch error pi=%s:', paymentIntentId, err.message)
    await setDoc(intentRef, { status: 'failed', failedAt: new Date().toISOString() }, { merge: true })
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Network error — please try again' }) }
  }

  const orderNumber    = String(shopifyData.order.order_number)
  const shopifyOrderId = shopifyData.order.id

  // ── Write to Firestore orders collection ──────────────────────────────────
  try {
    await setDoc(doc(db, 'orders', orderNumber), {
      orderNumber,
      shopifyOrderId,
      status:             'Confirmed',
      paymentIntentId,
      paymentMethod:      'stripe',
      customerName:       customer.name,
      customerPhone:      phone,
      customerEmail:      customer.email,
      fulfillmentType:    'delivery',
      emirate,
      address:            delivery.address || '',
      area:               delivery.area    || '',
      deliveryDate:       delivery.date,
      deliveryTimeSlot:   delivery.timeSlot  || '',
      notes:              delivery.notes     || '',
      googleMapsLink:     delivery.mapsLink  || '',
      items: items.map(i => ({
        title:         i.name || 'Mix Box (20 pcs)',
        quantity:      i.quantity,
        price:         i.price,
        customItem:    i.customItem    || null,
        mixBoxFlavors: i.mixBoxFlavors || null,
      })),
      deliveryFee,
      subtotal,
      giftCardQuantity,
      giftCardTotal:   giftCardQuantity * 5,
      giftCardTo,
      giftCardFrom,
      giftCardMessage,
      total:           expectedTotal,
      createdAt:       new Date().toISOString(),
    })
    console.log('[finalize-order] Firestore write OK order=%s pi=%s', orderNumber, paymentIntentId)
  } catch (fsErr) {
    console.error('[finalize-order] Firestore write failed (Shopify order still created) pi=%s:', paymentIntentId, fsErr.message)
  }

  // ── Mark idempotency doc as completed ─────────────────────────────────────
  try {
    await setDoc(intentRef, {
      status:         'completed',
      orderNumber,
      shopifyOrderId,
      completedAt:    new Date().toISOString(),
    }, { merge: true })
  } catch (fsErr) {
    console.error('[finalize-order] Could not mark pending_intent completed pi=%s:', paymentIntentId, fsErr.message)
  }

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, orderNumber, orderId: shopifyOrderId }),
  }
}
