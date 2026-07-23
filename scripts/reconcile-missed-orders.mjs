// Reconciliation report for the finalize-order outage (2026-07-09 onward).
//
// WHY THIS IS A REPORT, NOT AN AUTO-REPLAY:
// The bug killed finalize-order before it persisted anything, and
// create-payment-intent.js only stored { subtotal, deliveryFee, emirate } in
// the PaymentIntent metadata — NOT the customer name/phone/address, items,
// date, or time slot. So the full order data for the missed period does not
// exist anywhere server-side and a faithful Shopify order cannot be
// reconstructed automatically. This script recovers everything that IS
// available (amount, date, emirate, and whatever billing details Stripe itself
// captured) and tells you which paid orders are still missing from Shopify, so
// you can reconcile them by hand. It creates and changes NOTHING.
//
// Run:  node --env-file=.env scripts/reconcile-missed-orders.mjs
// Needs: STRIPE_SECRET_KEY (Stripe), SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET (Shopify).
// Optional: RECONCILE_SINCE=YYYY-MM-DD (default 2026-07-09).

import Stripe from 'stripe'

const SINCE  = process.env.RECONCILE_SINCE || '2026-07-09'
const sinceTs = Math.floor(new Date(`${SINCE}T00:00:00Z`).getTime() / 1000)

const stripeKey = process.env.STRIPE_SECRET_KEY
const shopId    = process.env.SHOPIFY_CLIENT_ID?.trim()
const shopSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim()
if (!stripeKey)  { console.error('ERROR: STRIPE_SECRET_KEY not set (add it to .env or run with Netlify env).'); process.exit(1) }
if (!shopId || !shopSecret) { console.error('ERROR: SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET not set.'); process.exit(1) }

const STORE = 'posa-rosa.myshopify.com'
const stripe = new Stripe(stripeKey)

// ── 1. Build the set of Stripe PaymentIntent ids already in Shopify ──────────
async function shopifyToken() {
  const r = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: shopId, client_secret: shopSecret, grant_type: 'client_credentials' }),
  })
  const j = await r.json()
  if (!j.access_token) throw new Error(`Shopify token failed: ${r.status}`)
  return j.access_token
}

async function shopifyPaidPiIds(token) {
  const ids = new Set()
  let url = `https://${STORE}/admin/api/2024-01/orders.json?status=any&created_at_min=${SINCE}T00:00:00Z&limit=250&fields=id,name,note_attributes`
  while (url) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } })
    if (!res.ok) throw new Error(`Shopify orders read failed: ${res.status}`)
    const { orders } = await res.json()
    for (const o of orders || []) {
      for (const na of o.note_attributes || []) {
        if (na.name === 'stripe_payment_intent_id' && na.value) ids.add(na.value)
      }
    }
    // Follow Shopify cursor pagination via the Link header.
    const link = res.headers.get('link') || ''
    const m = link.match(/<([^>]+)>;\s*rel="next"/)
    url = m ? m[1] : null
  }
  return ids
}

// ── 2. Walk succeeded Stripe PaymentIntents since the cutoff ─────────────────
function money(pi) { return `${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}` }

async function run() {
  const token = await shopifyToken()
  const inShopify = await shopifyPaidPiIds(token)
  console.log(`Reconciliation since ${SINCE}`)
  console.log(`Shopify orders in range carrying a stripe_payment_intent_id: ${inShopify.size}\n`)

  const missing = []
  let succeeded = 0, refundedOrDisputed = 0, reconciled = 0

  for await (const pi of stripe.paymentIntents.list({ created: { gte: sinceTs }, limit: 100, expand: ['data.latest_charge'] })) {
    if (pi.status !== 'succeeded') continue
    succeeded++
    const charge = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null
    const refunded = charge?.refunded || (charge?.amount_refunded > 0)
    const disputed = charge?.disputed
    if (refunded || disputed) { refundedOrDisputed++; continue }

    if (inShopify.has(pi.id)) { reconciled++; continue }

    const bd = charge?.billing_details || {}
    const addr = bd.address || {}
    missing.push({
      id: pi.id,
      created: new Date(pi.created * 1000).toISOString(),
      amount: money(pi),
      emirate: pi.metadata?.emirate || '(unknown)',
      name:  bd.name  || '(none captured)',
      email: bd.email || charge?.receipt_email || '(none captured)',
      phone: bd.phone || '(none captured)',
      address: [addr.line1, addr.line2, addr.city, addr.country].filter(Boolean).join(', ') || '(none captured)',
    })
  }

  console.log('════════ PAID BUT MISSING FROM SHOPIFY (need manual reconciliation) ════════\n')
  if (missing.length === 0) {
    console.log('  none — every succeeded, non-refunded payment has a Shopify order.\n')
  } else {
    for (const m of missing) {
      console.log(`  ${m.id}`)
      console.log(`     paid     : ${m.amount}   on ${m.created}`)
      console.log(`     emirate  : ${m.emirate}`)
      console.log(`     name     : ${m.name}`)
      console.log(`     email    : ${m.email}`)
      console.log(`     phone    : ${m.phone}`)
      console.log(`     address  : ${m.address}`)
      console.log(`     ⚠ items & delivery date/time are NOT recoverable (never stored) — confirm with the customer.\n`)
    }
  }

  console.log('──────── SUMMARY ────────')
  console.log(`  succeeded payments since ${SINCE} : ${succeeded}`)
  console.log(`  already in Shopify (reconciled)   : ${reconciled}`)
  console.log(`  refunded / disputed (skip)        : ${refundedOrDisputed}`)
  console.log(`  MISSING — need manual recovery     : ${missing.length}`)
  console.log('\nThis was a read-only report. No orders were created or modified.')
}

run().catch(err => { console.error('Reconciliation failed:', err.message); process.exit(1) })
