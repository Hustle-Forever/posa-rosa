// Token cache — survives across warm Lambda invocations
let _cachedToken = null
let _tokenExpiry = 0          // Unix timestamp ms
const TOKEN_BUFFER = 60_000   // refresh 60 s before expiry

const SHOPIFY_STORE      = 'posa-rosa.myshopify.com'
const SHOPIFY_TOKEN_URL  = `https://${SHOPIFY_STORE}/admin/oauth/access_token`
const SHOPIFY_ORDERS_URL = `https://${SHOPIFY_STORE}/admin/api/2024-01/orders.json`

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set(
  [
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

// ── Rate limiting ─────────────────────────────────────────────────────────────
const RATE_LIMIT  = 5
const RATE_WINDOW = 10 * 60_000
const _hits = new Map()

function isRateLimited(ip) {
  const now  = Date.now()
  const hits = (_hits.get(ip) || []).filter(t => now - t < RATE_WINDOW)
  if (hits.length >= RATE_LIMIT) { _hits.set(ip, hits); return true }
  hits.push(now)
  _hits.set(ip, hits)
  if (_hits.size > 5000) _hits.clear()
  return false
}

// ── Firebase ──────────────────────────────────────────────────────────────────
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

// ── Shopify token ─────────────────────────────────────────────────────────────
async function getShopifyToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - TOKEN_BUFFER) return _cachedToken

  const clientId     = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('SHOPIFY_CLIENT_ID or SHOPIFY_CLIENT_SECRET env var is missing')

  const res  = await fetch(SHOPIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) throw new Error(`Shopify token request returned ${res.status}`)

  _cachedToken = data.access_token
  _tokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000
  console.log('[create-order] New Shopify token cached, expires_in =', data.expires_in ?? 3600, 's')
  return _cachedToken
}

// ── Phone normalisation ───────────────────────────────────────────────────────
function normalizeUAEPhone(raw) {
  const stripped = raw.replace(/[\s\-().]/g, '')
  const digits   = stripped.replace(/^\+/, '')
  if (digits.startsWith('971') && digits.length === 12) return '+' + digits
  if (digits.startsWith('0')   && digits.length === 10) return '+971' + digits.slice(1)
  if (digits.length === 9) return '+971' + digits
  return null
}

// ── Returning-customer helper ─────────────────────────────────────────────────
function isPhoneAlreadyTaken(shopifyErrorData) {
  const errs = shopifyErrorData?.errors?.['customer.phone_number'] || []
  return Array.isArray(errs) && errs.some(e => typeof e === 'string' && e.includes('already been taken'))
}

// ── Delivery fee (server-side) ────────────────────────────────────────────────
function computeDeliveryFee(isPickup, emirate) {
  if (isPickup) return 0
  return emirate === 'Abu Dhabi' ? 35 : 40
}

// ── Input validation ──────────────────────────────────────────────────────────
const MAX_ITEMS = 50
const MAX_QTY   = 100

function isStr(v, max, min = 0) {
  return typeof v === 'string' && v.length >= min && v.length <= max
}

function validateOrder({ customer, delivery, items }) {
  if (typeof customer !== 'object' || customer === null) return 'Missing customer details'
  if (!isStr(customer.name, 120) || !customer.name.trim()) return 'Name is required'
  if (!isStr(customer.email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    return 'A valid email address is required'
  }
  if (!isStr(customer.phone, 30, 1)) return 'Phone number is required'

  if (typeof delivery !== 'object' || delivery === null) return 'Missing delivery details'
  const isPickup = delivery.fulfillmentType === 'pickup'
  if (!isPickup && delivery.fulfillmentType !== 'delivery') return 'Invalid fulfillment type'
  if (!isStr(delivery.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(delivery.date)) return 'A valid date is required'
  if (!isStr(delivery.timeSlot, 60, 1)) return 'A time slot is required'
  if (isPickup) {
    if (!isStr(delivery.branch, 120, 1)) return 'A pickup branch is required'
  } else {
    if (!isStr(delivery.address, 300, 1)) return 'A delivery address is required'
    if (!isStr(delivery.area, 80, 1))    return 'A delivery area is required'
  }
  if (delivery.notes    != null && !isStr(delivery.notes, 1000))   return 'Notes are too long'
  if (delivery.mapsLink != null && !isStr(delivery.mapsLink, 500)) return 'Maps link is too long'
  if (delivery.emirate  != null && !isStr(delivery.emirate, 80))   return 'Invalid emirate'

  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return 'Your cart is empty or invalid'
  }

  let hasValidItem = false
  for (const i of items) {
    if (typeof i !== 'object' || i === null) return 'Invalid cart item'

    if (i.customItem === 'mix-box') {
      // Mix Box — no variantId required; validate flavor structure
      hasValidItem = true
      if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY) return 'Invalid item quantity'
      if (typeof i.price !== 'number' || !isFinite(i.price) || i.price < 0 || i.price > 100000) return 'Invalid item price'
      if (!Array.isArray(i.mixBoxFlavors) || i.mixBoxFlavors.length < 2 || i.mixBoxFlavors.length > 5) return 'Invalid Mix Box configuration'
      const totalPcs = i.mixBoxFlavors.reduce((s, f) => s + (f.qty || 0), 0)
      if (totalPcs !== 20) return 'Mix Box must total 20 pieces'
    } else {
      if (i.variantId != null) {
        if (!isStr(i.variantId, 120, 1)) return 'Invalid cart item'
        hasValidItem = true
      }
      if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY) return 'Invalid item quantity'
      if (typeof i.price !== 'number' || !isFinite(i.price) || i.price < 0 || i.price > 100000) return 'Invalid item price'
      if (i.name != null && !isStr(i.name, 200)) return 'Invalid item name'
    }
  }

  if (!hasValidItem) return 'Your cart is empty or invalid'
  return null
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin
  const CORS   = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Method not allowed' }) }
  }

  if (origin && !isAllowedOrigin(origin)) {
    return { statusCode: 403, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Forbidden' }) }
  }

  const ip =
    event.headers?.['x-nf-client-connection-ip'] ||
    (event.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown'

  if (isRateLimited(ip)) {
    console.warn('[create-order] Rate limit hit for IP', ip)
    return { statusCode: 429, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Too many orders. Please wait a few minutes and try again.' }) }
  }

  if (event.body && event.body.length > 20_000) {
    return { statusCode: 413, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Request too large' }) }
  }

  let customer, delivery, items, total
  try {
    ;({ customer, delivery, items, total } = JSON.parse(event.body))
  } catch {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Invalid request body' }) }
  }

  const validationError = validateOrder({ customer, delivery, items, total })
  if (validationError) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: validationError }) }
  }

  const phone = normalizeUAEPhone(customer.phone || '')
  if (!phone) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Invalid phone number. Please use a UAE number, e.g. 050 123 4567 or +971 50 123 4567.' }) }
  }

  let token
  try {
    token = await getShopifyToken()
  } catch (err) {
    console.error('[create-order] Token error:', err.message)
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Could not authenticate with Shopify. Please try again or contact us on WhatsApp.' }) }
  }

  // Build Shopify line items — regular (variant) + custom (Mix Box)
  const isPickup    = delivery.fulfillmentType === 'pickup'
  const emirate     = delivery.emirate || 'Abu Dhabi'
  const deliveryFee = computeDeliveryFee(isPickup, emirate)

  const lineItems = (items || []).reduce((acc, i) => {
    if (i.customItem === 'mix-box') {
      acc.push({
        title:    'Mix Box (20 pcs)',
        price:    String(Number(i.price).toFixed(2)),
        quantity: i.quantity,
      })
    } else if (i.variantId) {
      acc.push({
        variant_id: parseInt(i.variantId.split('/').pop(), 10),
        quantity:   i.quantity,
      })
    }
    return acc
  }, [])

  // Build order note
  const BRANCH_MAPS = {
    'Abu Dhabi University':       'https://www.google.com/maps/search/Para+Cafe+Abu+Dhabi+University+UAE',
    'Rabdan Mall - Ground Floor': 'https://www.google.com/maps/search/Para+Cafe+Rabdan+Mall+Abu+Dhabi',
  }

  // Mix Box breakdown for note
  const mixBoxItems = (items || []).filter(i => i.customItem === 'mix-box')
  const mixBoxNoteLines = mixBoxItems.flatMap(i => [
    `MIX BOX × ${i.quantity}:`,
    ...(i.mixBoxFlavors || []).map(f => `  ${f.name} × ${f.qty}`),
  ])

  const noteLines = isPickup
    ? [
        `⚠ FULFILLMENT: PICKUP — ${delivery.branch}`,
        `DATE: ${delivery.date}`,
        `TIME: ${delivery.timeSlot}`,
        BRANCH_MAPS[delivery.branch] ? `BRANCH MAPS: ${BRANCH_MAPS[delivery.branch]}` : null,
        delivery.notes ? `NOTES: ${delivery.notes}` : null,
        mixBoxNoteLines.length > 0 ? '---' : null,
        ...mixBoxNoteLines,
      ]
    : [
        `⚠ FULFILLMENT: DELIVERY — ${emirate} · ${delivery.area}`,
        `DELIVERY FEE: AED ${deliveryFee}`,
        `DATE: ${delivery.date}`,
        `TIME: ${delivery.timeSlot}`,
        `ADDRESS: ${delivery.address}`,
        delivery.mapsLink ? `MAPS: ${delivery.mapsLink}` : null,
        delivery.notes ? `NOTES: ${delivery.notes}` : null,
        mixBoxNoteLines.length > 0 ? '---' : null,
        ...mixBoxNoteLines,
      ]

  const orderBody = {
    order: {
      line_items: lineItems,
      customer: { first_name: customer.name, email: customer.email, phone },
      shipping_address: {
        name:     customer.name,
        address1: isPickup ? `PICKUP — ${delivery.branch}` : delivery.address,
        city:     isPickup ? 'Abu Dhabi' : emirate,
        country:  'AE',
        phone,
      },
      financial_status: 'pending',
      note:             noteLines.filter(Boolean).join('\n'),
      tags:             'posa-rosa-website',
      send_receipt:     true,
    },
  }

  try {
    let shopifyRes = await fetch(SHOPIFY_ORDERS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify(orderBody),
    })
    let shopifyData = await shopifyRes.json()

    // Retry on phone-already-taken (returning customer)
    if (!shopifyRes.ok && shopifyRes.status === 422 && isPhoneAlreadyTaken(shopifyData)) {
      console.log('[create-order] Phone already taken — retrying with email-only customer lookup')
      const retryBody = { order: { ...orderBody.order, customer: { first_name: customer.name, email: customer.email } } }
      shopifyRes  = await fetch(SHOPIFY_ORDERS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify(retryBody),
      })
      shopifyData = await shopifyRes.json()
    }

    if (!shopifyRes.ok) {
      if (shopifyRes.status === 401) { _cachedToken = null; _tokenExpiry = 0 }
      console.error('[create-order] Shopify error:', shopifyRes.status, JSON.stringify(shopifyData))
      return { statusCode: 502, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'We could not place your order right now. Please try again or contact us on WhatsApp.' }) }
    }

    // ── Firestore write (best-effort) ────────────────────────────────────────
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
        emirate:          isPickup ? '' : emirate,
        branch:           isPickup ? (delivery.branch || '') : '',
        address:          delivery.address || '',
        area:             delivery.area || '',
        deliveryDate:     delivery.date,
        deliveryTimeSlot: delivery.timeSlot,
        notes:            delivery.notes || '',
        googleMapsLink:   delivery.mapsLink || '',
        items: (items || []).map(i => ({
          title:         i.name || 'Mix Box (20 pcs)',
          quantity:      i.quantity,
          price:         i.price,
          customItem:    i.customItem    || null,
          mixBoxFlavors: i.mixBoxFlavors || null,
        })),
        deliveryFee,
        subtotal,
        total,
        createdAt: new Date().toISOString(),
      })
      console.log('[create-order] Firestore write OK — order', orderId)
    } catch (fsErr) {
      console.error('[create-order] Firestore write failed (Shopify order still created):', fsErr.message)
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, orderId: shopifyData.order.id, orderNumber: shopifyData.order.order_number }),
    }
  } catch (err) {
    console.error('[create-order] fetch error:', err.message)
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Failed to create order' }) }
  }
}
