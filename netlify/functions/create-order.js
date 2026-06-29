// Token cache — survives across warm Lambda invocations
let _cachedToken = null
let _tokenExpiry = 0          // Unix timestamp ms
const TOKEN_BUFFER = 60_000   // refresh 60 s before expiry

const SHOPIFY_STORE      = 'posa-rosa.myshopify.com'
const SHOPIFY_TOKEN_URL  = `https://${SHOPIFY_STORE}/admin/oauth/access_token`
const SHOPIFY_ORDERS_URL = `https://${SHOPIFY_STORE}/admin/api/2024-01/orders.json`

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    throw new Error(
      `Shopify token request returned ${res.status}: ${JSON.stringify(data)}`
    )
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

exports.handler = async (event) => {
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

  const noteParts = [
    delivery.notes,
    delivery.mapsLink ? `Maps: ${delivery.mapsLink}` : null,
    `Time: ${delivery.timeSlot}`,
    `Area: ${delivery.area}`,
  ].filter(Boolean)

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
        address1: delivery.address,
        city:     'Abu Dhabi',
        country:  'AE',
        phone,
      },
      financial_status: 'pending',
      note:             noteParts.join(' | '),
      tags:             'posa-rosa-website',
    },
  }

  try {
    const res = await fetch(SHOPIFY_ORDERS_URL, {
      method: 'POST',
      headers: {
        'Content-Type':           'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(orderBody),
    })

    const data = await res.json()

    if (!res.ok) {
      // On 401, purge the cached token so the next request refetches
      if (res.status === 401) {
        _cachedToken = null
        _tokenExpiry = 0
      }
      console.error('[create-order] Shopify error:', res.status, JSON.stringify(data))
      return {
        statusCode: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: data.errors ? JSON.stringify(data.errors) : `Shopify error ${res.status}`,
        }),
      }
    }

    // ── Firestore write (best-effort — does not fail the order) ──────────
    try {
      const subtotal = (items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)
      const orderId  = String(data.order.order_number)

      await setDoc(doc(db, 'orders', orderId), {
        orderNumber:      orderId,
        shopifyOrderId:   data.order.id,
        status:           'Confirmed',
        customerName:     customer.name,
        customerPhone:    phone,
        customerEmail:    customer.email,
        address:          delivery.address,
        area:             delivery.area,
        deliveryDate:     delivery.date,
        deliveryTimeSlot: delivery.timeSlot,
        notes:            delivery.notes || '',
        googleMapsLink:   delivery.mapsLink || '',
        items:            (items || []).map(i => ({ title: i.name, quantity: i.quantity, price: i.price })),
        deliveryFee:      35,
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
        orderId:     data.order.id,
        orderNumber: data.order.order_number,
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
