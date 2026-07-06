// Launch-audit E2E: full order flow with /api/create-order MOCKED so no real
// Shopify order is created. Verifies the request payload the client sends and
// the confirmation page the customer sees. Also probes edge cases.
import { chromium } from '@playwright/test'

const BASE = 'http://localhost:5173'
let failures = 0
const ok = (cond, label) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label)
  if (!cond) failures++
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

let capturedPayload = null
await page.route('**/api/create-order', async route => {
  capturedPayload = JSON.parse(route.request().postData())
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, orderId: 999, orderNumber: 1234 }),
  })
})

const consoleErrors = []
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })

// ── 1. Shop: emirate → area → products ──────────────────────────────────────
await page.goto(BASE + '/shop', { waitUntil: 'networkidle' })
await page.evaluate(() => { sessionStorage.clear(); localStorage.clear() })
await page.reload({ waitUntil: 'networkidle' })

await page.getByTestId('emirate-Dubai').click()
await page.getByTestId('area-Marina').click()
await page.getByTestId('btn-area-continue').click()
ok(await page.getByText(/Delivery to Dubai/i).isVisible(), 'fulfillment: Dubai/Marina selected, fee AED 40')

// ── 2. Add a regular product ─────────────────────────────────────────────────
await page.waitForSelector('.shop-card', { timeout: 15000 })
await page.locator('.shop-card').first().click()
const addBtn = page.getByRole('button', { name: /add to cart/i }).first()
await addBtn.waitFor({ timeout: 10000 })
await addBtn.click()
await page.waitForTimeout(800)
// drawer should open — close it to continue
ok(await page.getByText('Your Cart').isVisible(), 'product added → drawer opened')
await page.getByLabel('Close cart').click()
await page.waitForTimeout(600)

// ── 3. Mix Box: 2 flavors, exactly 20 pcs ────────────────────────────────────
await page.getByTestId('mix-box-card').click()
await page.waitForTimeout(600)
const plusButtons = page.locator('button[aria-label^="Add "]')
const nFlavors = await plusButtons.count()
ok(nFlavors >= 2, `mix box modal open, ${nFlavors} flavors listed`)
for (let i = 0; i < 10; i++) await plusButtons.nth(0).click()
for (let i = 0; i < 10; i++) await plusButtons.nth(1).click()
const mixAddBtn = page.getByTestId('mixbox-add-to-cart')
ok(await mixAddBtn.isEnabled(), 'mix box add enabled at 20 pcs / 2 flavors')
await mixAddBtn.click()
await page.waitForTimeout(1200)

// ── 4. Gift card stepper in drawer (drawer opened after mix box add) ─────────
await page.getByLabel('Add gift card').click()
await page.getByLabel('Add gift card').click()
await page.waitForTimeout(300)
ok(await page.getByText('Gift Card ×2').isVisible(), 'gift card ×2 shows in drawer totals')

// ── 5. Checkout ──────────────────────────────────────────────────────────────
await page.getByRole('button', { name: /^checkout$/i }).click()
await page.waitForURL('**/checkout')
await page.getByPlaceholder('Fatima Al Mansoori').fill('Audit Tester')
await page.getByPlaceholder('+971 50 000 0000').fill('0501234567')
await page.getByPlaceholder('you@example.com').fill('audit@test.com')
// Emirate should be pre-filled with Dubai from the shop step
const emirateVal = await page.locator('select').first().inputValue()
ok(emirateVal === 'Dubai', `checkout emirate pre-filled from shop step (got "${emirateVal}")`)
await page.getByPlaceholder('Villa 12, Street 5').fill('Villa 7, Street 12')
// Area pre-filled?
const areaVal = await page.locator('select').nth(1).inputValue()
ok(areaVal === 'Marina', `checkout area pre-filled (got "${areaVal}")`)
const minDate = await page.locator('input[type="date"]').getAttribute('min')
await page.locator('input[type="date"]').fill(minDate)
await page.getByRole('button', { name: /afternoon/i }).first().click()

await page.getByRole('button', { name: /place order/i }).first().click()
await page.waitForURL('**/order-confirmation**', { timeout: 10000 })

// ── 6. Confirmation page ─────────────────────────────────────────────────────
ok(await page.getByText('Order Confirmed!').isVisible(), 'confirmation page reached')
ok(await page.getByText('Order #1234').isVisible(), 'order number shown')
ok(await page.getByText('Posa Rosa Gift Card').isVisible(), 'gift card row on confirmation')
ok(await page.getByText('Mix Box (20 pcs)').first().isVisible(), 'mix box on confirmation')

// ── 7. Verify payload the server would receive ───────────────────────────────
const p = capturedPayload
ok(p !== null, 'create-order payload captured')
ok(p.giftCardQuantity === 2, `payload giftCardQuantity === 2 (got ${p.giftCardQuantity})`)
ok(p.delivery.emirate === 'Dubai' && p.delivery.area === 'Marina', 'payload emirate/area correct')
const expTotal = p.items.reduce((s, i) => s + i.price * i.quantity, 0) + 40 + 2 * 5
ok(Math.abs(p.total - expTotal) < 0.01, `payload total internally consistent (${p.total} vs ${expTotal})`)
const mix = p.items.find(i => i.customItem === 'mix-box')
ok(mix && mix.price === 165 && mix.mixBoxFlavors.reduce((s, f) => s + f.qty, 0) === 20, 'payload mix box: price 165, 20 pcs')

// ── 8. Cart cleared after order ──────────────────────────────────────────────
const cartAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('posa-rosa-cart') || '[]'))
ok(cartAfter.length === 0, 'cart cleared after order')

// ── 9. Edge: empty-cart checkout guard ───────────────────────────────────────
await page.goto(BASE + '/checkout', { waitUntil: 'networkidle' })
capturedPayload = null
await page.getByRole('button', { name: /place order/i }).first().click()
await page.waitForTimeout(600)
ok(await page.getByText(/cart is empty/i).first().isVisible(), 'empty-cart checkout blocked with message')
ok(capturedPayload === null, 'no API call made for empty cart')

// ── 10. Console errors during the whole flow ─────────────────────────────────
const realErrors = consoleErrors.filter(e => !e.includes('favicon'))
ok(realErrors.length === 0, `no console errors during flow (${realErrors.length})`)
if (realErrors.length) console.log(realErrors.join('\n'))

await browser.close()
console.log(failures === 0 ? '\nALL E2E CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
