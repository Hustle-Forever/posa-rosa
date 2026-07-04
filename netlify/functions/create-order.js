// Token cache — survives across warm Lambda invocations
let _cachedToken = null
let _tokenExpiry = 0          // Unix timestamp ms
const TOKEN_BUFFER = 60_000   // refresh 60 s before expiry

const SHOPIFY_STORE      = 'posa-rosa.myshopify.com'
const SHOPIFY_TOKEN_URL  = `https://${SHOPIFY_STORE}/admin/oauth/access_token`
const SHOPIFY_ORDERS_URL = `https://${SHOPIFY_STORE}/admin/api/2024-01/orders.json`

// ── CORS: only the site itself may call this function from a browser ────────
// ALLOWED_ORIGIN env var covers a future custom domain without a code change.
const ALLOWED_ORIGINS = new Set(
  [
    'https://famous-fox-da26ec.netlify.app', // actual production URL
    'https://posa-rosa.netlify.app',          // future custom domain / alias
    'http://localhost:5173',                  // vite dev
    'http://localhost:8888',                  // netlify dev
    process.env.ALLOWED_ORIGIN,
  ].filter(Boolean)
)

function isAllowedOrigin(origin) {
  // No Origin header = same-origin navigation or a non-browser client;
  // CORS cannot gate those, so let them through to the other checks.
  if (!origin) return true
  if (ALLOWED_ORIGINS.has(origin)) return true
  // Netlify deploy previews / branch deploys: https://<slug>--posa-rosa.netlify.app
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

// ── Best-effort per-IP rate limit (in-memory, per warm container) ────────────
const RATE_LIMIT  = 5              // orders
const RATE_WINDOW = 10 * 60_000    // per 10 minutes
const _hits = new Map()

function isRateLimited(ip) {
  const now  = Date.now()
  const hits = (_hits.get(ip) || []).filter(t => now - t < RATE_WINDOW)
  if (hits.length >= RATE_LIMIT) {
    _hits.set(ip, hits)
    return true
  }
  hits.push(now)
  _hits.set(ip, hits)
  if (_hits.size > 5000) _hits.clear()   // memory guard
  return false
}

// Firebase — initialised once per warm Lambda container
const { initializeApp, getApps, getApp } = require('firebase/app')
const { getFirestore, doc, setDoc }      = require('firebase/firestore/lite')

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

// Fetches a fresh Shopify Admin API token via OAuth client_credentials, or
// returns the cached one if it still has > 60 s remaining.
async function getShopifyToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - TOKEN_BUFFER) {
    return _cachedToken
  }

  const clientId     = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET env var is missing')
  }

  const res = await fetch(SHOPIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    'client_credentials',
    }),
  })

  const data = await res.json()

  if (!res.ok || !data.access_token) {
    console.error('[create-order] Token fetch failed:', res.status, JSON.stringify(data))
    throw new Error(`Shopify token request returned ${res.status}`)
  }

  _cachedToken = data.access_token
  // expires_in is seconds; default 1 h if Shopify omits it
  const expiresIn = (data.expires_in ?? 3600) * 1000
  _tokenExpiry    = Date.now() + expiresIn

  console.log('[create-order] New Shopify token cached, expires_in =', data.expires_in ?? 3600, 's')
  return _cachedToken
}

// Converts common UAE phone formats to E.164 (+971XXXXXXXXX).
// Returns null if the number cannot be recognised.
function normalizeUAEPhone(raw) {
  const stripped = raw.replace(/[\s\-().]/g, '')   // remove spaces/dashes/parens
  const digits   = stripped.replace(/^\+/, '')      // drop leading +

  // International with country code: 971XXXXXXXXX  (12 digits)
  if (digits.startsWith('971') && digits.length === 12) {
    return '+' + digits
  }

  // Local with leading zero: 0XXXXXXXXX  (10 digits)
  if (digits.startsWith('0') && digits.length === 10) {
    return '+971' + digits.slice(1)
  }

  // Local without leading zero: XXXXXXXXX  (9 digits, e.g. 501234567)
  if (digits.length === 9) {
    return '+971' + digits
  }

  return null
}

// ── Returning-customer helper ─────────────────────────────────────────────────

// Shopify rejects inline customer creation when the phone already belongs to
// an existing customer. Detect that specific error so we can retry.
function isPhoneAlreadyTaken(shopifyErrorData) {
  const errs = shopifyErrorData?.errors?.['customer.phone_number'] || []
  return Array.isArray(errs) && errs.some(
    e => typeof e === 'string' && e.includes('already been taken'),
  )
}

// ── Input validation ─────────────────────────────────────────────────────────
const MAX_ITEMS = 50
const MAX_QTY   = 100

function isStr(v, max, min = 0) {
  return typeof v === 'string' && v.length >= min && v.length <= max
}

// Returns a client-safe error message, or null if the payload is valid.
function validateOrder({ customer, delivery, items, total }) {
  if (typeof customer !== 'object' || customer === null) return 'Missing customer details'
  if (!isStr(customer.name, 120) || !customer.name.trim()) return 'Name is required'
  if (!isStr(customer.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return 'A valid email address is required'
  }
  if (!isStr(customer.phone, 30, 1)) return 'Phone number is required'

  if (typeof delivery !== 'object' || delivery === null) return 'Missing delivery details'
  const isPickup = delivery.fulfillmentType === 'pickup'
  if (!isPickup && delivery.fulfillmentType !== 'delivery') return 'Invalid fulfillment type'
  if (!isStr(delivery.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(delivery.date)) {
    return 'A valid date is required'
  }
  if (!isStr(delivery.timeSlot, 60, 1)) return 'A time slot is required'
  if (isPickup) {
    if (!isStr(delivery.branch, 120, 1)) return 'A pickup branch is required'
  } else {
    if (!isStr(delivery.address, 300, 1)) return 'A delivery address is required'
    if (!isStr(delivery.area, 80, 1)) return 'A delivery area is required'
  }
  if (delivery.notes != null && !isStr(delivery.notes, 1000)) return 'Notes are too long'
  if (delivery.mapsLink != null && !isStr(delivery.mapsLink, 500)) return 'Maps link is too long'

  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return 'Your cart is empty or invalid'
  }
  let hasVariant = false
  for (const i of items) {
    if (typeof i !== 'object' || i === null) return 'Invalid cart item'
    if (i.variantId != null) {
      if (!isStr(i.variantId, 120, 1)) return 'Invalid cart item'
      hasVariant = true
    }
    if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY) {
      return 'Invalid item quantity'
    }
    if (typeof i.price !== 'number' || !isFinite(i.price) || i.price < 0 || i.price > 100000) {
      return 'Invalid item price'
    }
    if (i.name != null && !isStr(i.name, 200)) return 'Invalid item name'
  }
  if (!hasVariant) return 'Your cart is empty or invalid'

  if (typeof total !== 'number' || !isFinite(total) || total < 0 || total > 1000000) {
    return 'Invalid order total'
  }

  return null
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin
  const CORS   = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    }
  }

  // Browser requests from any other website are refused outright.
  if (origin && !isAllowedOrigin(origin)) {
    return {
      statusCode: 403,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Forbidden' }),
    }
  }

  const ip =
    event.headers?.['x-nf-client-connection-ip'] ||
    (event.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown'

  if (isRateLimited(ip)) {
    console.warn('[create-order] Rate limit hit for IP', ip)
    return {
      statusCode: 429,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Too many orders. Please wait a few minutes and try again.',
      }),
    }
  }

  if (event.body && event.body.length > 20_000) {
    return {
      statusCode: 413,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Request too large' }),
    }
  }

  let customer, delivery, items, total
  try {
    ;({ customer, delivery, items, total } = JSON.parse(event.body))
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Invalid request body' }),
    }
  }

  const validationError = validateOrder({ customer, delivery, items, total })
  if (validationError) {
    return {
      statusCode: 422,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: validationError }),
    }
  }

  // Validate + normalise phone before hitting Shopify
  const phone = normalizeUAEPhone(customer.phone || '')
  if (!phone) {
    return {
      statusCode: 422,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error:
          'Invalid phone number. Please use a UAE number, e.g. 050 123 4567 or +971 50 123 4567.',
      }),
    }
  }

  // Get (or refresh) Shopify access token
  let token
  try {
    token = await getShopifyToken()
  } catch (err) {
    console.error('[create-order] Token error:', err.message)
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error:
          'Could not authenticate with Shopify. Please try again or contact us on WhatsApp.',
      }),
    }
  }

  // Build Shopify order payload
  const lineItems = (items || [])
    .filter(i => i.variantId)
    .map(i => ({
      variant_id: parseInt(i.variantId.split('/').pop(), 10),
      quantity:   i.quantity,
    }))

  // Fulfillment info — must be the first thing the manager sees on the order
  const isPickup = delivery.fulfillmentType === 'pickup'

  const BRANCH_MAPS = {
    'Abu Dhabi University':       'https://www.google.com/maps/search/Para+Cafe+Abu+Dhabi+University+UAE',
    'Rabdan Mall - Ground Floor': 'https://www.google.com/maps/search/Para+Cafe+Rabdan+Mall+Abu+Dhabi',
  }

  const noteLines = isPickup
    ? [
        `⚠ FULFILLMENT: PICKUP — ${delivery.branch}`,
        `DATE: ${delivery.date}`,
        `TIME: ${delivery.timeSlot}`,
        BRANCH_MAPS[delivery.branch] ? `BRANCH MAPS: ${BRANCH_MAPS[delivery.branch]}` : null,
        delivery.notes ? `NOTES: ${delivery.notes}` : null,
      ]
    : [
        `⚠ FULFILLMENT: DELIVERY`,
        `DATE: ${delivery.date}`,
        `TIME: ${delivery.timeSlot}`,
        `ADDRESS: ${delivery.address}`,
        `AREA: ${delivery.area}`,
        delivery.mapsLink ? `MAPS: ${delivery.mapsLink}` : null,
        delivery.notes ? `NOTES: ${delivery.notes}` : null,
      ]

  const orderBody = {
    order: {
      line_items: lineItems,
      customer: {
        first_name: customer.name,
        email:      customer.email,
        phone,
      },
      shipping_address: {
        name:     customer.name,
        address1: isPickup ? `PICKUP — ${delivery.branch}` : delivery.address,
        city:     'Abu Dhabi',
        country:  'AE',
        phone,
      },
      financial_status: 'pending',
      note:             noteLines.filter(Boolean).join('\n'),
      tags:             'posa-rosa-website',
      send_receipt:     true,   // Shopify emails its built-in order confirmation to the customer
    },
  }

  try {
    let shopifyRes = await fetch(SHOPIFY_ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type':           'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(orderBody),
    })

    let shopifyData = await shopifyRes.json()

    // Returning customer: phone already belongs to an existing Shopify customer.
    // The customer search API needs read_customers scope this token doesn't hold,
    // so retry by omitting phone from the customer object — Shopify will then
    // match/create by email. Phone is preserved in shipping_address and Firestore.
    if (!shopifyRes.ok && shopifyRes.status === 422 && isPhoneAlreadyTaken(shopifyData)) {
      console.log('[create-order] Phone already taken — retrying with email-only customer lookup')
      const retryBody = {
        order: {
          ...orderBody.order,
          customer: { first_name: customer.name, email: customer.email },
        },
      }
      shopifyRes  = await fetch(SHOPIFY_ORDERS_URL, {
        method: 'POST',
        headers: {
          'Content-Type':           'application/json',
          'X-Shopify-Access-Token': token,
        },
        body: JSON.stringify(retryBody),
      })
      shopifyData = await shopifyRes.json()
    }

    if (!shopifyRes.ok) {
      // On 401, purge the cached token so the next request refetches
      if (shopifyRes.status === 401) {
        _cachedToken = null
        _tokenExpiry = 0
      }
      console.error('[create-order] Shopify error:', shopifyRes.status, JSON.stringify(shopifyData))
      return {
        statusCode: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'We could not place your order right now. Please try again or contact us on WhatsApp.',
        }),
      }
    }

    // ── Firestore write (best-effort — does not fail the order) ──────────
    try {
      const subtotal = (items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)
      const orderId  = String(shopifyData.order.order_number)

      await setDoc(doc(db, 'orders', orderId), {
        orderNumber:      orderId,
        shopifyOrderId:   shopifyData.order.id,
        status:           'Confirmed',
        customerName:     customer.name,
        customerPhone:    phone,
        customerEmail:    customer.email,
        fulfillmentType:  isPickup ? 'pickup' : 'delivery',
        branch:           isPickup ? (delivery.branch || '') : '',
        address:          delivery.address || '',
        area:             delivery.area || '',
        deliveryDate:     delivery.date,
        deliveryTimeSlot: delivery.timeSlot,
        notes:            delivery.notes || '',
        googleMapsLink:   delivery.mapsLink || '',
        items:            (items || []).map(i => ({ title: i.name, quantity: i.quantity, price: i.price })),
        deliveryFee:      isPickup ? 0 : 35,
        subtotal,
        total,
        createdAt:        new Date().toISOString(),
      })

      console.log('[create-order] Firestore write OK — order', orderId)
    } catch (fsErr) {
      console.error('[create-order] Firestore write failed (Shopify order still created):', fsErr.message)
    }
    // ─────────────────────────────────────────────────────────────────────

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success:     true,
        orderId:     shopifyData.order.id,
        orderNumber: shopifyData.order.order_number,
      }),
    }
  } catch (err) {
    console.error('[create-order] fetch error:', err.message)
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Failed to create order' }),
    }
  }
}
