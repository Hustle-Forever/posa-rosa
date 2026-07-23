// Read-only Shopify Admin API diagnostic for the finalize-order incident.
// Reproduces getShopifyToken() (OAuth client_credentials) exactly as
// netlify/functions/finalize-order.js does, then makes ONE harmless read
// (GET shop.json) to confirm the token is actually accepted by the Admin API.
//
// Creates nothing. Masks all secrets and tokens. Run with:
//   node --env-file=.env scripts/diagnose-shopify.mjs
//
// Exit is always 0; this is a diagnostic, not a gate.

const STORE = 'posa-rosa.myshopify.com'
const TOKEN_URL  = `https://${STORE}/admin/oauth/access_token`
const SHOP_URL   = `https://${STORE}/admin/api/2024-01/shop.json`

const id     = process.env.SHOPIFY_CLIENT_ID
const secret = process.env.SHOPIFY_CLIENT_SECRET

function mask(v) {
  if (!v) return '(missing)'
  const s = String(v)
  return s.length <= 6 ? '***' : `${s.slice(0, 3)}…${s.slice(-2)} (len ${s.length})`
}

console.log('— Shopify Admin diagnostic —')
console.log('store            :', STORE)
console.log('SHOPIFY_CLIENT_ID:', mask(id))
console.log('SHOPIFY_CLIENT_SECRET present:', secret ? 'yes' : 'NO')
console.log('')

if (!id || !secret) {
  console.log('RESULT: credentials missing from env — cannot test the exchange.')
  process.exit(0)
}

// Trim to catch a trailing-newline / stray-quote paste error (a common cause).
const idTrim = id.trim(), secretTrim = secret.trim()
if (idTrim !== id || secretTrim !== secret) {
  console.log('⚠ NOTE: client id/secret had surrounding whitespace/quotes in env — that alone can break the exchange.')
}

const t0 = Date.now()
let tokenRes, tokenBody
try {
  tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: idTrim, client_secret: secretTrim, grant_type: 'client_credentials' }),
  })
  tokenBody = await tokenRes.text()
} catch (err) {
  console.log('STEP A — token exchange: NETWORK ERROR:', err.message)
  process.exit(0)
}

console.log(`STEP A — token exchange: HTTP ${tokenRes.status} ${tokenRes.statusText} (${Date.now() - t0}ms)`)
console.log('  content-type:', tokenRes.headers.get('content-type'))

let token = null
try {
  const j = JSON.parse(tokenBody)
  token = j.access_token || null
  // Print the body with the token masked.
  const redacted = { ...j }
  if (redacted.access_token) redacted.access_token = `<present, len ${j.access_token.length}>`
  console.log('  body:', JSON.stringify(redacted))
} catch {
  // Non-JSON (often an HTML error page) — print a short, safe snippet.
  const snippet = tokenBody.replace(/\s+/g, ' ').slice(0, 240)
  console.log('  body (non-JSON, first 240 chars):', snippet)
}

if (!token) {
  console.log('')
  console.log('ROOT-CAUSE SIGNAL: token exchange did NOT return an access_token → getShopifyToken() throws → finalize-order returns 500 → customer sees "Something Went Wrong".')
  process.exit(0)
}

// STEP B — confirm the token is actually accepted by the Admin API.
let shopRes, shopBody
try {
  shopRes = await fetch(SHOP_URL, {
    method: 'GET',
    headers: { 'X-Shopify-Access-Token': token },
  })
  shopBody = await shopRes.text()
} catch (err) {
  console.log('STEP B — shop.json read: NETWORK ERROR:', err.message)
  process.exit(0)
}

console.log('')
console.log(`STEP B — shop.json read: HTTP ${shopRes.status} ${shopRes.statusText}`)
try {
  const j = JSON.parse(shopBody)
  if (j.shop) {
    console.log('  OK — token accepted. shop.name:', j.shop.name, '| plan:', j.shop.plan_name)
    console.log('')
    console.log('RESULT: token exchange AND Admin read both succeed. The failure is NOT the token — look at the order POST payload/scope (422) or write scope.')
  } else {
    console.log('  body:', JSON.stringify(j).slice(0, 240))
    console.log('')
    console.log('ROOT-CAUSE SIGNAL: token obtained but Admin API rejects it (scope/permission). finalize-order would fail on the order POST.')
  }
} catch {
  console.log('  body (non-JSON):', shopBody.replace(/\s+/g, ' ').slice(0, 240))
}
