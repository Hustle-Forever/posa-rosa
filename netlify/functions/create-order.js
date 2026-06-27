const SHOPIFY_URL =
  'https://posa-rosa.myshopify.com/admin/api/2024-01/orders.json'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        statusCode: res.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: data.errors ? JSON.stringify(data.errors) : `Shopify error ${res.status}`,
        }),
      }
    }

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
