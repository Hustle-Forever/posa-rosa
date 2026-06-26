const SHOPIFY_URL =
  'https://posa-rosa.myshopify.com/admin/api/2024-01/products.json?limit=250&status=active'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const token = process.env.SHOPIFY_ADMIN_TOKEN
  if (!token) {
    console.error('[products] SHOPIFY_ADMIN_TOKEN is not set')
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server misconfiguration: missing admin token' }),
    }
  }

  try {
    const res = await fetch(SHOPIFY_URL, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[products] Shopify ${res.status}:`, text)
      return {
        statusCode: res.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Shopify error ${res.status}` }),
      }
    }

    const data = await res.json()
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(data.products),
    }
  } catch (err) {
    console.error('[products] fetch error:', err.message)
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch products' }),
    }
  }
}
