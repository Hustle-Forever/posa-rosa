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
    'https://posarosa.ae',
    'https://www.posarosa.ae',
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

// ── Firebase (Admin SDK — bypasses security rules, so they stay fully locked) ─
const { db } = require('./lib/firebaseAdmin')

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
function computeDeliveryFee(emirate, items) {
  const allApparel = Array.isArray(items) && items.length > 0 && items.every(i => i.isApparel === true)
  if (allApparel) return 22
  return emirate === 'Abu Dhabi' ? 35 : 40
}

// ── Input validation ──────────────────────────────────────────────────────────
const MAX_ITEMS      = 50
const MAX_QTY        = 100
const MIX_BOX_PRICE  = 165  // server-enforced — must match BOX_PRICE in ShopPage.jsx
const GIFT_CARD_PRICE = 5

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
  if (delivery.fulfillmentType !== 'delivery') return 'Invalid fulfillment type'
  if (!isStr(delivery.address, 300, 1)) return 'A delivery address is required'
  if (!isStr(delivery.area, 80, 1))    return 'A delivery area is required'
  if (delivery.notes    != null && !isStr(delivery.notes, 1000))   return 'Notes are too long'
  if (delivery.mapsLink != null && !isStr(delivery.mapsLink, 500)) return 'Maps link is too long'
  if (delivery.emirate  != null && !isStr(delivery.emirate, 80))   return 'Invalid emirate'

  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    return 'Your cart is empty or invalid'
  }

  // Apparel-only orders skip date/time (48–72 hr delivery, no slot needed)
  const allApparel = items.every(i => i.isApparel === true)
  if (!allApparel) {
    if (!isStr(delivery.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(delivery.date)) return 'A valid date is required'
    // Time slot is required only for Abu Dhabi (same-day) orders.
    if (delivery.emirate === 'Abu Dhabi' && !isStr(delivery.timeSlot, 60, 1)) return 'A time slot is required'
  } else if (delivery.date != null && !isStr(delivery.date, 10)) {
    return 'Invalid date format'
  }

  let hasValidItem = false
  for (const i of items) {
    if (typeof i !== 'object' || i === null) return 'Invalid cart item'

    if (i.customItem === 'mix-box') {
      // Mix Box — no variantId required; validate flavor structure
      hasValidItem = true
      if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY) return 'Invalid item quantity'
      // Mix Box is a custom (non-variant) Shopify line item, so the price is
      // enforced here — never trusted from the client.
      if (i.price !== MIX_BOX_PRICE) return 'Invalid Mix Box price'
      if (!Array.isArray(i.mixBoxFlavors) || i.mixBoxFlavors.length < 2 || i.mixBoxFlavors.length > 5) return 'Invalid Mix Box configuration'
      const totalPcs = i.mixBoxFlavors.reduce((s, f) => s + (f.qty || 0), 0)
      if (totalPcs !== 20) return 'Mix Box must total 20 pieces'
    } else {
      // Regular items must reference a Shopify variant (Shopify prices them)
      if (!isStr(i.variantId, 120, 1)) return 'Invalid cart item'
      hasValidItem = true
      if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > MAX_QTY) return 'Invalid item quantity'
      if (typeof i.price !== 'number' || !isFinite(i.price) || i.price < 0 || i.price > 100000) return 'Invalid item price'
      if (i.name != null && !isStr(i.name, 200)) return 'Invalid item name'
    }
  }

  if (!hasValidItem) return 'Your cart is empty or invalid'
  return null
}

exports.validateOrder = validateOrder

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

  let customer, delivery, items, total, giftCardQuantity, rawGiftCardTo, rawGiftCardFrom, rawGiftCardMessage, paymentIntentId
  try {
    ;({ customer, delivery, items, total, giftCardQuantity,
        giftCardTo: rawGiftCardTo, giftCardFrom: rawGiftCardFrom, giftCardMessage: rawGiftCardMessage,
        paymentIntentId,
      } = JSON.parse(event.body))
  } catch {
    return { statusCode: 400, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Invalid request body' }) }
  }

  giftCardQuantity = Math.max(0, Math.min(99, parseInt(giftCardQuantity) || 0))
  const giftCardTo      = (typeof rawGiftCardTo      === 'string' ? rawGiftCardTo.trim()      : '').slice(0, 200)
  const giftCardFrom    = (typeof rawGiftCardFrom    === 'string' ? rawGiftCardFrom.trim()    : '').slice(0, 200)
  const giftCardMessage = (typeof rawGiftCardMessage === 'string' ? rawGiftCardMessage.trim() : '').slice(0, 500)

  const validationError = validateOrder({ customer, delivery, items, total })
  if (validationError) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: validationError }) }
  }

  const phone = normalizeUAEPhone(customer.phone || '')
  if (!phone) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Invalid phone number. Please use a UAE number, e.g. 050 123 4567 or +971 50 123 4567.' }) }
  }

  // Server-side total check — the client total must match what the validated
  // items + delivery fee + gift cards actually add up to (mirrors the client's
  // own calculation, so any mismatch means a tampered or buggy request).
  const emirate     = delivery.emirate || 'Abu Dhabi'
  const deliveryFee = computeDeliveryFee(emirate, items)
  const expectedTotal =
    items.reduce((sum, i) => sum + i.price * i.quantity, 0) +
    deliveryFee +
    giftCardQuantity * GIFT_CARD_PRICE

  if (typeof total !== 'number' || !isFinite(total) || Math.abs(total - expectedTotal) > 0.01) {
    return { statusCode: 422, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Order total mismatch. Please refresh the page and try again.' }) }
  }

  let token
  try {
    token = await getShopifyToken()
  } catch (err) {
    console.error('[create-order] Token error:', err.message)
    return { statusCode: 500, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'Could not authenticate with Shopify. Please try again or contact us on WhatsApp.' }) }
  }

  // Build Shopify line items — regular (variant) + custom (Mix Box)
  const lineItems = (items || []).reduce((acc, i) => {
    if (i.customItem === 'mix-box') {
      acc.push({
        title:    'Mix Box (20 pcs)',
        price:    MIX_BOX_PRICE.toFixed(2),
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

  // Gift card line item
  if (giftCardQuantity > 0) {
    lineItems.push({
      title:    'Posa Rosa Gift Card',
      price:    '5.00',
      quantity: giftCardQuantity,
    })
  }

  // Build order note
  // Mix Box breakdown for note
  const mixBoxItems = (items || []).filter(i => i.customItem === 'mix-box')
  const mixBoxNoteLines = mixBoxItems.flatMap(i => [
    `MIX BOX × ${i.quantity}:`,
    ...(i.mixBoxFlavors || []).map(f => `  ${f.name} × ${f.qty}`),
  ])

  const deliveryTiming = emirate === 'Abu Dhabi' ? 'Same-day' : 'Next-day'

  const safePaymentIntentId = typeof paymentIntentId === 'string' ? paymentIntentId.slice(0, 120) : null

  const noteLines = [
    `⚠ FULFILLMENT: DELIVERY — ${emirate} · ${delivery.area}`,
    `DELIVERY TIMING: ${deliveryTiming} (${emirate})`,
    `DELIVERY FEE: AED ${deliveryFee}`,
    safePaymentIntentId ? `STRIPE PAYMENT: ${safePaymentIntentId}` : null,
    giftCardQuantity > 0 ? `GIFT CARD: ×${giftCardQuantity} — AED ${giftCardQuantity * 5}` : null,
    (giftCardQuantity > 0 && (giftCardTo || giftCardFrom || giftCardMessage))
      ? `GIFT CARD NOTE — To: ${giftCardTo || '—'} | From: ${giftCardFrom || '—'} | Message: ${giftCardMessage || '—'}`
      : null,
    delivery.date ? `DATE: ${delivery.date}` : 'DATE: 48–72 hours (apparel)',
    delivery.timeSlot ? `TIME: ${delivery.timeSlot}` : null,
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
        address1: delivery.address,
        city:     emirate,
        country:  'AE',
        phone,
      },
      financial_status: 'pending',
      note:             noteLines.filter(Boolean).join('\n'),
      note_attributes:  safePaymentIntentId
        ? [{ name: 'stripe_payment_intent_id', value: safePaymentIntentId }]
        : [],
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
      console.error('[create-order] Shopify error:', shopifyRes.status, JSON.stringify({ errors: shopifyData.errors }))
      return { statusCode: 502, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ success: false, error: 'We could not place your order right now. Please try again or contact us on WhatsApp.' }) }
    }

    // ── Firestore write (best-effort) ────────────────────────────────────────
    try {
      const subtotal = (items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)
      const orderId  = String(shopifyData.order.order_number)

      await db.collection('orders').doc(orderId).set({
        orderNumber:      orderId,
        shopifyOrderId:   shopifyData.order.id,
        status:           'Confirmed',
        customerName:     customer.name,
        customerPhone:    phone,
        customerEmail:    customer.email,
        fulfillmentType:  'delivery',
        emirate,
        address:          delivery.address || '',
        area:             delivery.area || '',
        deliveryDate:     delivery.date,
        deliveryTimeSlot: delivery.timeSlot || '',
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
        giftCardQuantity,
        giftCardTotal: giftCardQuantity * 5,
        giftCardTo,
        giftCardFrom,
        giftCardMessage,
        ...(safePaymentIntentId ? { paymentIntentId: safePaymentIntentId, paymentMethod: 'stripe' } : {}),
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
