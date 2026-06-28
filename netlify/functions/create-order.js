const SHOPIFY_URL =
  'https://posa-rosa.myshopify.com/admin/api/2024-01/orders.json'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Firebase — initialized once per Lambda container (warm-start safe)
const { initializeApp, getApps, getApp } = require('firebase/app')
const { getFirestore, doc, setDoc }       = require('firebase/firestore/lite')

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

  const token = process.env.SHOPIFY_ADMIN_TOKEN
  if (!token) {
    console.error('[create-order] SHOPIFY_ADMIN_TOKEN is not set')
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: 'Server misconfiguration' }),
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

  // Shopify Admin REST API requires numeric variant IDs, not GID strings
  const lineItems = (items || [])
    .filter(i => i.variantId)
    .map(i => ({
      variant_id: parseInt(i.variantId.split('/').pop(), 10),
      quantity: i.quantity,
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
        email: customer.email,
        phone: customer.phone,
      },
      shipping_address: {
        name: customer.name,
        address1: delivery.address,
        city: 'Abu Dhabi',
        country: 'AE',
        phone: customer.phone,
      },
      financial_status: 'pending',
      note: noteParts.join(' | '),
      tags: 'posa-rosa-website',
    },
  }

  try {
    const res = await fetch(SHOPIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(orderBody),
    })

    const data = await res.json()

    if (!res.ok) {
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

    // ── Firestore write (best-effort — failure does not fail the order) ──
    try {
      const subtotal = (items || []).reduce((sum, i) => sum + i.price * i.quantity, 0)
      const orderId  = String(data.order.order_number)

      await setDoc(doc(db, 'orders', orderId), {
        orderNumber:      orderId,
        shopifyOrderId:   data.order.id,
        status:           'Confirmed',
        customerName:     customer.name,
        customerPhone:    customer.phone,
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
    // ────────────────────────────────────────────────────────────────────

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        orderId: data.order.id,
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
