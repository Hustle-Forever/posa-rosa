// POST /api/stripe-webhook
// Receives Stripe webhook events, verifies signature, logs event id + type.
// Register this URL in Stripe Dashboard → Webhooks.
// No CORS — this endpoint is called by Stripe, not a browser.

const Stripe = require('stripe')
let _stripe = null
function getStripe() {
  if (!_stripe) _stripe = Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  if (!sig) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing Stripe-Signature header' }) }
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured')
    return { statusCode: 500, body: JSON.stringify({ error: 'Webhook not configured' }) }
  }

  // Netlify preserves the raw body as a string; base64-decode if needed
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body

  let stripeEvent
  try {
    stripeEvent = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    // Invalid signature — Stripe docs say to return 400
    return { statusCode: 400, body: JSON.stringify({ error: `Webhook signature invalid: ${err.message}` }) }
  }

  // Log only safe fields — never log the raw event or PII
  console.log('[stripe-webhook] event_id=%s type=%s', stripeEvent.id, stripeEvent.type)

  // Handle specific event types
  switch (stripeEvent.type) {
    case 'payment_intent.succeeded':
      // Order creation is handled by /api/finalize-order (client-triggered).
      // Webhook receipt here is for reliability logging only.
      console.log('[stripe-webhook] payment_intent.succeeded acknowledged event_id=%s', stripeEvent.id)
      break

    case 'payment_intent.payment_failed':
      console.log('[stripe-webhook] payment_intent.payment_failed event_id=%s', stripeEvent.id)
      break

    default:
      // Acknowledge unhandled events without error
      break
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received: true, eventId: stripeEvent.id }),
  }
}
