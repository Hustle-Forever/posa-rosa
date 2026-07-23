// Read-only probe: is Protected Customer Data the blocker on order creation?
// Gets granted scopes, then reads one existing order asking for PII fields.
// If PII comes back empty/redacted or the call errors, that points at the
// protected-customer-data restriction. Creates/changes NOTHING.
//
//   node --env-file=.env scripts/diagnose-shopify-orders.mjs

const STORE = 'posa-rosa.myshopify.com'
const API   = `https://${STORE}/admin/api/2024-01`

const id     = process.env.SHOPIFY_CLIENT_ID?.trim()
const secret = process.env.SHOPIFY_CLIENT_SECRET?.trim()
if (!id || !secret) { console.log('creds missing'); process.exit(0) }

const tRes = await fetch(`https://${STORE}/admin/oauth/access_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
})
const token = (await tRes.json()).access_token
if (!token) { console.log('no token'); process.exit(0) }
const H = { 'X-Shopify-Access-Token': token }

// 1) Granted scopes
const scRes = await fetch(`${API}/oauth/access_scopes.json`, { headers: H })
console.log('access_scopes:', scRes.status, (await scRes.text()).slice(0, 300))

// 2) Read one order requesting PII fields
const oRes = await fetch(`${API}/orders.json?status=any&limit=1&fields=id,name,email,phone,customer,shipping_address,financial_status`, { headers: H })
console.log('\norders read:', oRes.status, oRes.statusText)
const oText = await oRes.text()
try {
  const o = JSON.parse(oText)
  const ord = o.orders?.[0]
  if (!ord) { console.log('  (no orders on store, or none returned)'); }
  else {
    // Report PRESENCE of PII, not the values themselves.
    console.log('  order id present  :', !!ord.id, '| name:', ord.name)
    console.log('  email present     :', ord.email == null ? 'NULL/redacted' : 'present')
    console.log('  phone present     :', ord.phone == null ? 'NULL/redacted' : 'present')
    console.log('  customer present  :', ord.customer == null ? 'NULL/redacted' : 'present')
    console.log('  shipping present  :', ord.shipping_address == null ? 'NULL/redacted' : 'present')
    console.log('  financial_status  :', ord.financial_status)
  }
} catch {
  console.log('  body (non-JSON):', oText.replace(/\s+/g, ' ').slice(0, 300))
}

console.log('\nInterpretation: scopes include write_orders but if the order read returns PII as NULL/redacted (or errors), Protected Customer Data is not granted → order POSTs with customer/shipping data fail.')
