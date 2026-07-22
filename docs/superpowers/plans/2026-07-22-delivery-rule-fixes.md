# Delivery-Rule Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make three delivery rules correct — time slots only for Abu Dhabi truffles, real Abu Dhabi same-day cutoffs, and apparel-only carts always 48–72h with no same-day.

**Architecture:** Add two pure helpers to `src/lib/fulfillment.js` (`cartMode`, plus a shared `TIME_SLOTS` model + `slotClosedToday` predicate). `CheckoutPage.jsx` consumes them for slot gating/availability and switches its emirate pill for apparel. `ShopPage.jsx`'s fulfillment gate switches on cart contents. `netlify/functions/create-order.js` stops requiring `timeSlot` for non-Abu-Dhabi orders. Verification is Playwright E2E (`page.clock.setFixedTime` for UAE time) plus a `node --test` unit test for the server validator.

**Tech Stack:** React 19 + Vite, Framer Motion, Playwright, Netlify Functions (CommonJS + Firebase), Node built-in test runner.

## Global Constraints

- All user-facing text in **English only**.
- Mobile-first; do not change existing layout/grid behavior.
- Prices display as `AED {amount}`. Apparel delivery fee stays **AED 22**; truffle fees stay **AED 35** (Abu Dhabi) / **AED 40** (other emirates).
- The "48–72" copy uses an en dash `–` (U+2013), matching existing checkout copy.
- Never modify `.env`, pricing, the Stripe flow, or Firestore schema.
- Change only these files: `src/lib/fulfillment.js`, `src/pages/CheckoutPage.jsx`, `src/pages/ShopPage.jsx`, `netlify/functions/create-order.js`, and new test files under `tests/`. Nothing else.
- Timezone for all time logic is `Asia/Dubai`.

---

### Task 1: FIX 1 — Checkout time slot renders only for Abu Dhabi truffles (client)

**Files:**
- Modify: `src/pages/CheckoutPage.jsx` (render gate `:538`, `formValid` `:229-234`, `validate()` `:339-346`)
- Test: `tests/delivery-rules.spec.js` (create)

**Interfaces:**
- Consumes: existing `isAbuDhabi` (`:208`), `allApparel` (`:196`), `form.timeSlot`, `form.emirate`.
- Produces: nothing new for later tasks.

- [ ] **Step 1: Write the failing test**

Create `tests/delivery-rules.spec.js`:

```js
import { test, expect } from '@playwright/test'

const TRUFFLE_CART = [{
  id: 't1', name: 'Signature Truffle', price: 50, quantity: 1,
  isApparel: false, variantId: 'gid://shopify/ProductVariant/1',
}]

async function seed(page, { cart, fulfillment }) {
  await page.goto('/')
  await page.evaluate(({ cart, fulfillment }) => {
    localStorage.setItem('posa-rosa-cart', JSON.stringify(cart))
    if (fulfillment) sessionStorage.setItem('posa-rosa-fulfillment', JSON.stringify(fulfillment))
    else sessionStorage.removeItem('posa-rosa-fulfillment')
  }, { cart, fulfillment })
}

test.describe('FIX 1 — time slot Abu Dhabi only', () => {
  test('Truffle + Al Ain → date picker visible, NO time-slot section', async ({ page }) => {
    await seed(page, {
      cart: TRUFFLE_CART,
      fulfillment: { type: 'delivery', emirate: 'Al Ain', area: 'Al Jimi' },
    })
    await page.goto('/checkout')

    await expect(page.locator('[data-field="date"] input[type="date"]')).toBeVisible()
    await expect(page.locator('[data-field="timeSlot"]')).toHaveCount(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/delivery-rules.spec.js -g "Al Ain" --project=desktop-1440`
Expected: FAIL — the `[data-field="timeSlot"]` section still renders for Al Ain (count 1, not 0).

- [ ] **Step 3: Implement the render gate**

In `src/pages/CheckoutPage.jsx`, change the Preferred-Time section gate (`:538`):

```jsx
              {isAbuDhabi && !allApparel && (
                <Field label="Preferred Time" error={errors.timeSlot} data-field="timeSlot">
```

(Only the opening condition `{!allApparel && (` becomes `{isAbuDhabi && !allApparel && (`. The rest of the block is unchanged in this task.)

- [ ] **Step 4: Require timeSlot only for Abu Dhabi in `formValid`**

Replace the `!allApparel` block in `formValid` (`:229-232`):

```jsx
    if (!allApparel) {
      if (!form.date) return false
      if (form.emirate === 'Abu Dhabi' && !form.timeSlot) return false
    }
```

- [ ] **Step 5: Require timeSlot only for Abu Dhabi in `validate()`**

Replace the timeSlot block in `validate()` (`:339-346`):

```jsx
      if (isAbuDhabi) {
        if (!form.timeSlot) {
          e.timeSlot = 'Please select a time slot'
        } else {
          const slot = TIME_SLOTS.find(s => `${s.label} ${s.hours}` === form.timeSlot)
          if (slot && slotHasPassed(slot, form.date, nowUAE)) {
            e.timeSlot = 'That time slot has passed — please pick another'
          }
        }
      }
```

(`slotHasPassed` and the local `TIME_SLOTS` still exist at this point; they are replaced in Task 3.)

- [ ] **Step 6: Run test to verify it passes**

Run: `npx playwright test tests/delivery-rules.spec.js -g "Al Ain" --project=desktop-1440`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/CheckoutPage.jsx tests/delivery-rules.spec.js
git commit -m "FIX 1: checkout time slot renders only for Abu Dhabi truffles"
```

---

### Task 2: FIX 1 — Server requires timeSlot only for Abu Dhabi

**Files:**
- Modify: `netlify/functions/create-order.js` (`validateOrder` `:144-151`; add export near `:179`)
- Verify (no change): `netlify/functions/finalize-order.js` (`:197-201`)
- Test: `tests/server/create-order.validate.test.mjs` (create)

**Interfaces:**
- Consumes: existing `validateOrder({ customer, delivery, items })`.
- Produces: `module.exports.validateOrder` (named export on the CommonJS module) for the unit test.

- [ ] **Step 1: Write the failing test**

Create `tests/server/create-order.validate.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../netlify/functions/create-order.js'

const validateOrder = mod.validateOrder

const baseCustomer = { name: 'Fatima', email: 'a@b.com', phone: '+971500000000' }
const truffle = { variantId: 'gid://shopify/ProductVariant/1', quantity: 1, price: 50, name: 'Truffle' }

test('non-Abu-Dhabi truffle order does NOT require timeSlot', () => {
  const err = validateOrder({
    customer: baseCustomer,
    delivery: { fulfillmentType: 'delivery', address: 'Villa 1', area: 'Al Jimi', emirate: 'Al Ain', date: '2026-07-23' },
    items: [truffle],
  })
  assert.equal(err, null)
})

test('Abu Dhabi truffle order STILL requires timeSlot', () => {
  const err = validateOrder({
    customer: baseCustomer,
    delivery: { fulfillmentType: 'delivery', address: 'Villa 1', area: 'Al Mushrif', emirate: 'Abu Dhabi', date: '2026-07-22' },
    items: [truffle],
  })
  assert.equal(err, 'A time slot is required')
})

test('any non-apparel order still requires a date', () => {
  const err = validateOrder({
    customer: baseCustomer,
    delivery: { fulfillmentType: 'delivery', address: 'Villa 1', area: 'Al Jimi', emirate: 'Al Ain' },
    items: [truffle],
  })
  assert.equal(err, 'A valid date is required')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/server/`
Expected: FAIL — either `validateOrder` is `undefined` (not exported yet) or the "non-Abu-Dhabi" case returns `'A time slot is required'` instead of `null`.

- [ ] **Step 3: Update the validator**

In `netlify/functions/create-order.js`, replace the apparel/date/time block in `validateOrder` (`:144-151`):

```js
  // Apparel-only orders skip date/time (48–72 hr delivery, no slot needed)
  const allApparel = items.every(i => i.isApparel === true)
  if (!allApparel) {
    if (!isStr(delivery.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(delivery.date)) return 'A valid date is required'
    // Time slot is required only for Abu Dhabi (same-day) orders.
    if (delivery.emirate === 'Abu Dhabi' && !isStr(delivery.timeSlot, 60, 1)) return 'A time slot is required'
  } else if (delivery.date != null && !isStr(delivery.date, 10)) {
    return 'Invalid date format'
  }
```

- [ ] **Step 4: Export the validator for testing**

In `netlify/functions/create-order.js`, immediately after the `validateOrder` function definition (after `:179`, the line `}` that closes `validateOrder`), add:

```js
exports.validateOrder = validateOrder
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tests/server/`
Expected: PASS (3 tests). If the run errors on importing `firebase/*`, that indicates a missing dependency install — run `npm install` first; the module is required in production the same way.

- [ ] **Step 6: Verify finalize-order needs no change**

Read `netlify/functions/finalize-order.js:197-201`. Confirm the guard is:

```js
  const allApparel = items.every(i => i.isApparel === true)
  if (!delivery?.address || !delivery?.area || (!allApparel && !delivery?.date)) {
```

It requires `date` (not `timeSlot`) for non-apparel — already correct. No edit.

- [ ] **Step 7: Commit**

```bash
git add netlify/functions/create-order.js tests/server/create-order.validate.test.mjs
git commit -m "FIX 1: server requires timeSlot only for Abu Dhabi orders"
```

---

### Task 3: FIX 2 — Abu Dhabi same-day cutoffs

**Files:**
- Modify: `src/lib/fulfillment.js` (add `TIME_SLOTS`, `slotClosedToday`)
- Modify: `src/pages/CheckoutPage.jsx` (imports `:6`; remove local `TIME_SLOTS` `:9-13` and `slotHasPassed` `:49-51`; `isTodayUAE`/`allSlotsPassed` `:210-211`; `handleDateChange` `:305-313`; `validate()` date branch `:335-338` and slot check; picker block `:538-584`)
- Test: `tests/delivery-rules.spec.js` (append)

**Interfaces:**
- Consumes: `uaeNow()` (stays in CheckoutPage) returning `{ date: 'YYYY-MM-DD', minutes: number }`.
- Produces (in `fulfillment.js`):
  - `TIME_SLOTS: Array<{ label: string, hours: string, sameDayCutoff: number | null }>`
  - `slotClosedToday(slot, deliveryDate: string, now: { date: string, minutes: number }): boolean`

- [ ] **Step 1: Write the failing tests**

Append to `tests/delivery-rules.spec.js`:

```js
// 11:00 Dubai = 07:00 UTC on 2026-07-22
const AT_11_00 = new Date('2026-07-22T07:00:00Z')
const AT_13_30 = new Date('2026-07-22T09:30:00Z')
const AT_18_00 = new Date('2026-07-22T14:00:00Z')
const TODAY = '2026-07-22'
const TOMORROW = '2026-07-23'

async function openAbuDhabiCheckout(page, when) {
  await page.clock.setFixedTime(when)
  await seed(page, {
    cart: TRUFFLE_CART,
    fulfillment: { type: 'delivery', emirate: 'Abu Dhabi', area: 'Al Mushrif' },
  })
  await page.clock.setFixedTime(when)
  await page.goto('/checkout')
}

test.describe('FIX 2 — Abu Dhabi cutoffs', () => {
  test('11:00 today → Morning disabled, Afternoon+Evening enabled', async ({ page }) => {
    await openAbuDhabiCheckout(page, AT_11_00)
    await page.locator('[data-field="date"] input[type="date"]').fill(TODAY)
    await expect(page.getByTestId('slot-Morning')).toBeDisabled()
    await expect(page.getByTestId('slot-Afternoon')).toBeEnabled()
    await expect(page.getByTestId('slot-Evening')).toBeEnabled()
    await expect(page.getByTestId('slot-helper')).toBeVisible()
  })

  test('13:30 today → Morning+Afternoon disabled, Evening enabled', async ({ page }) => {
    await openAbuDhabiCheckout(page, AT_13_30)
    await page.locator('[data-field="date"] input[type="date"]').fill(TODAY)
    await expect(page.getByTestId('slot-Morning')).toBeDisabled()
    await expect(page.getByTestId('slot-Afternoon')).toBeDisabled()
    await expect(page.getByTestId('slot-Evening')).toBeEnabled()
  })

  test('18:00 today → all three disabled', async ({ page }) => {
    await openAbuDhabiCheckout(page, AT_18_00)
    await page.locator('[data-field="date"] input[type="date"]').fill(TODAY)
    await expect(page.getByTestId('slot-Morning')).toBeDisabled()
    await expect(page.getByTestId('slot-Afternoon')).toBeDisabled()
    await expect(page.getByTestId('slot-Evening')).toBeDisabled()
  })

  test('tomorrow → all three enabled regardless of time', async ({ page }) => {
    await openAbuDhabiCheckout(page, AT_18_00)
    await page.locator('[data-field="date"] input[type="date"]').fill(TOMORROW)
    await expect(page.getByTestId('slot-Morning')).toBeEnabled()
    await expect(page.getByTestId('slot-Afternoon')).toBeEnabled()
    await expect(page.getByTestId('slot-Evening')).toBeEnabled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test tests/delivery-rules.spec.js -g "FIX 2" --project=desktop-1440`
Expected: FAIL — `slot-Morning` etc. testids do not exist yet, and Morning is not disabled same-day under the old `endHour` model.

- [ ] **Step 3: Add the slot model + predicate to `fulfillment.js`**

Append to `src/lib/fulfillment.js`:

```js
// ── Abu Dhabi same-day delivery slots (Asia/Dubai) ─────────────────────────────
// sameDayCutoff: minutes-since-midnight after which the slot closes for TODAY.
// null = never available same-day (must be ordered the day before).
export const TIME_SLOTS = [
  { label: 'Morning',   hours: '9AM – 12PM', sameDayCutoff: null },
  { label: 'Afternoon', hours: '12PM – 5PM', sameDayCutoff: 13 * 60 },      // 13:00
  { label: 'Evening',   hours: '5PM – 8PM',  sameDayCutoff: 17 * 60 + 30 }, // 17:30
]

// True when the slot cannot be delivered for the chosen date.
// deliveryDate / now.date are 'YYYY-MM-DD' (Asia/Dubai); now.minutes is minutes-since-midnight.
export function slotClosedToday(slot, deliveryDate, now) {
  if (deliveryDate !== now.date) return false   // tomorrow-or-later: always open
  if (slot.sameDayCutoff == null) return true    // never same-day (Morning)
  return now.minutes >= slot.sameDayCutoff
}
```

- [ ] **Step 4: Switch CheckoutPage to the shared model**

In `src/pages/CheckoutPage.jsx`:

a) Update the import (`:6`):

```jsx
import { EMIRATE_AREAS, EMIRATES, getDeliveryFee, getFulfillment, TIME_SLOTS, slotClosedToday } from '../lib/fulfillment'
```

b) Delete the local `TIME_SLOTS` (`:9-13`) and the local `slotHasPassed` function (`:49-51`).

c) Delete the now-unused `ALL_SLOTS_PASSED_MSG` constant (`:15`).

d) Replace the derived flags (`:210-211`):

```jsx
  const isTodayUAE = isAbuDhabi && form.date === now.date
```

(Remove the `allSlotsPassed` line entirely.)

e) Update `handleDateChange` (`:308-310`) to use `slotClosedToday`:

```jsx
    setFormState(f => {
      const slot   = TIME_SLOTS.find(s => `${s.label} ${s.hours}` === f.timeSlot)
      const closed = slot && slotClosedToday(slot, newDate, nowUAE)
      return { ...f, date: newDate, timeSlot: closed ? '' : f.timeSlot }
    })
```

f) In `validate()`, remove the "all slots passed" date branch (`:335-338`, the `else if (form.emirate === 'Abu Dhabi' && ... TIME_SLOTS.every(...))` clause) so the date checks are just:

```jsx
      if (!form.date) {
        e.date = 'Please choose a delivery date'
      } else if (form.date < minDate) {
        e.date = form.emirate !== 'Abu Dhabi'
          ? 'Same-day delivery is only available in Abu Dhabi — please select tomorrow or later'
          : 'Please select today or later'
      }
```

g) In `validate()`, the slot check (edited in Task 1) must now call `slotClosedToday` instead of `slotHasPassed`:

```jsx
          if (slot && slotClosedToday(slot, form.date, nowUAE)) {
            e.timeSlot = 'That time slot has passed — please pick another'
          }
```

- [ ] **Step 5: Rewrite the time-slot picker block**

Replace the inner content of the Preferred-Time `<Field>` (`:540-582`, the `allSlotsPassed ? (...) : (...)` ternary) with always-rendered buttons plus helper text:

```jsx
                  <div className="co-time-slots" style={{ display: 'flex', gap: '0.75rem' }}>
                    {TIME_SLOTS.map(slot => {
                      const val    = `${slot.label} ${slot.hours}`
                      const closed = slotClosedToday(slot, form.date, now)
                      const active = !closed && form.timeSlot === val
                      return (
                        <button key={slot.label} data-testid={`slot-${slot.label}`}
                          className="co-time-btn" type="button" disabled={closed}
                          onClick={() => set('timeSlot', val)}
                          style={{
                            flex: 1, padding: '0.75rem 0.875rem',
                            border: `1px solid ${active ? 'var(--color-dark)' : 'rgba(61,26,26,0.18)'}`,
                            background: closed ? 'rgba(61,26,26,0.05)' : active ? 'var(--color-dark)' : '#fff',
                            color: active ? '#FDF6F0' : 'var(--color-dark)',
                            opacity: closed ? 0.55 : 1,
                            borderRadius: '8px', cursor: closed ? 'not-allowed' : 'pointer', textAlign: 'left',
                            fontFamily: 'var(--font-sans)', transition: 'all 0.22s ease',
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' }}>
                            {slot.label}
                            {closed && (
                              <span style={{ marginLeft: '0.4rem', fontSize: '0.58rem', fontWeight: 500,
                                letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c0392b' }}>
                                Closed
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.66rem', opacity: 0.65, marginTop: '2px' }}>{slot.hours}</div>
                        </button>
                      )
                    })}
                  </div>
                  {isTodayUAE && TIME_SLOTS.some(s => slotClosedToday(s, form.date, now)) && (
                    <p data-testid="slot-helper" style={{
                      margin: '0.5rem 0 0', fontFamily: 'var(--font-sans)', fontSize: '0.68rem',
                      color: 'rgba(61,26,26,0.6)',
                    }}>
                      Some slots are closed for today&apos;s orders.
                    </p>
                  )}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx playwright test tests/delivery-rules.spec.js -g "FIX 2" --project=desktop-1440`
Expected: PASS (4 tests).

- [ ] **Step 7: Guard against regressions in Task 1's test**

Run: `npx playwright test tests/delivery-rules.spec.js -g "Al Ain" --project=desktop-1440`
Expected: PASS (still no time section for Al Ain).

- [ ] **Step 8: Commit**

```bash
git add src/lib/fulfillment.js src/pages/CheckoutPage.jsx tests/delivery-rules.spec.js
git commit -m "FIX 2: Abu Dhabi same-day slot cutoffs (Morning day-before, 13:00, 17:30)"
```

---

### Task 4: FIX 3 — Checkout apparel pill = 48–72h

**Files:**
- Modify: `src/pages/CheckoutPage.jsx` (emirate pill `:482-493`)
- Test: `tests/delivery-rules.spec.js` (append)

**Interfaces:**
- Consumes: existing `allApparel` (`:196`), `form.emirate`.
- Produces: `data-testid="checkout-delivery-badge"` on the emirate pill.

- [ ] **Step 1: Write the failing test**

Append to `tests/delivery-rules.spec.js`:

```js
const APPAREL_CART = [{
  id: 'a1', name: 'Butterfly Tee', price: 120, quantity: 1,
  isApparel: true, variantId: 'gid://shopify/ProductVariant/2',
}]

test.describe('FIX 3 — apparel checkout', () => {
  test('apparel-only checkout → 48–72h badge, no date/time', async ({ page }) => {
    await seed(page, {
      cart: APPAREL_CART,
      fulfillment: { type: 'delivery', emirate: 'Abu Dhabi', area: 'Al Mushrif' },
    })
    await page.goto('/checkout')

    await expect(page.getByTestId('checkout-delivery-badge')).toContainText('48–72 hour delivery · AED 22')
    await expect(page.getByText('Same-day delivery available')).toHaveCount(0)
    await expect(page.locator('[data-field="date"]')).toHaveCount(0)
    await expect(page.locator('[data-field="timeSlot"]')).toHaveCount(0)
    await expect(page.getByText('Delivery: 48–72 hours')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/delivery-rules.spec.js -g "apparel checkout" --project=desktop-1440`
Expected: FAIL — the badge testid does not exist and the pill reads "Same-day delivery available".

- [ ] **Step 3: Update the emirate pill**

In `src/pages/CheckoutPage.jsx`, replace the pill span inside the emirate `<Field>` (`:484-491`):

```jsx
                    <span data-testid="checkout-delivery-badge" style={{
                      fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.06em',
                      padding: '0.18rem 0.6rem', borderRadius: '100px', fontWeight: 600,
                      background: allApparel || form.emirate === 'Abu Dhabi' ? 'rgba(201,169,110,0.15)' : 'rgba(201,160,163,0.2)',
                      color: allApparel || form.emirate === 'Abu Dhabi' ? 'var(--color-gold)' : 'var(--color-dark)',
                    }}>
                      {allApparel
                        ? '48–72 hour delivery · AED 22'
                        : (form.emirate === 'Abu Dhabi' ? 'Same-day delivery available' : 'Next-day delivery')}
                    </span>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/delivery-rules.spec.js -g "apparel checkout" --project=desktop-1440`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CheckoutPage.jsx tests/delivery-rules.spec.js
git commit -m "FIX 3: apparel-only checkout shows 48-72h delivery, no same-day"
```

---

### Task 5: FIX 3 — Shop fulfillment gate switches on cart contents

**Files:**
- Modify: `src/lib/fulfillment.js` (add `cartMode`)
- Modify: `src/pages/ShopPage.jsx` (import `:7`; add `useCart` items + `apparelMode` near `:842-923`; `FulfillmentSelector` badge `:139-147`; pass-through props `:1010`, `:1017`)
- Test: `tests/delivery-rules.spec.js` (append)

**Interfaces:**
- Consumes: `useCart()` → `{ items }` (already exported by `CartContext`).
- Produces (in `fulfillment.js`): `cartMode(items): 'empty' | 'apparel' | 'truffle'`.

- [ ] **Step 1: Write the failing test**

Append to `tests/delivery-rules.spec.js`:

```js
test.describe('FIX 3 — apparel shop gate', () => {
  test('apparel-only cart, Abu Dhabi → 48–72h badge, AED 22, no same-day', async ({ page }) => {
    await page.goto('/')
    await page.evaluate((cart) => {
      localStorage.setItem('posa-rosa-cart', JSON.stringify(cart))
      sessionStorage.removeItem('posa-rosa-fulfillment')
    }, APPAREL_CART)

    await page.goto('/shop?category=collection')
    await page.getByTestId('emirate-Abu-Dhabi').click()

    await expect(page.getByTestId('delivery-timing-badge')).toHaveText('48–72 hour delivery')
    await expect(page.getByTestId('area-fee-info')).toContainText('AED 22')
    await expect(page.getByText('Same-day delivery', { exact: true })).toHaveCount(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/delivery-rules.spec.js -g "apparel shop gate" --project=desktop-1440`
Expected: FAIL — `delivery-timing-badge` testid does not exist and the badge reads "Same-day delivery".

- [ ] **Step 3: Add `cartMode` to `fulfillment.js`**

Append to `src/lib/fulfillment.js`:

```js
// Classify cart for delivery-rule display: 'empty' | 'apparel' | 'truffle'.
export function cartMode(items) {
  if (!items || items.length === 0) return 'empty'
  return items.every(i => i.isApparel) ? 'apparel' : 'truffle'
}
```

- [ ] **Step 4: Import `cartMode` and `useCart` in ShopPage**

In `src/pages/ShopPage.jsx`:

a) Add `cartMode` to the fulfillment import (`:7`):

```jsx
import { EMIRATE_AREAS, EMIRATES, getDeliveryFee, getDeliveryTiming, getFulfillment, setFulfillment, cartMode } from '../lib/fulfillment'
```

b) The main `ShopPage` component (`:842`) does not yet read the cart. Add, right after `const [searchParams, setSearchParams] = useSearchParams()` (`:843`):

```jsx
  const { items } = useCart()
```

(`useCart` is already imported at `:4`.)

- [ ] **Step 5: Derive `apparelMode` and pass it through**

In `src/pages/ShopPage.jsx`, just after `const isApparel = activeTab === 'COLLECTION'` (`:923`), add:

```jsx
  const cartKind    = cartMode(items)
  const apparelMode = cartKind === 'empty' ? isApparel : cartKind === 'apparel'
```

Then change the two render sites to pass `apparelMode` instead of `isApparel`:

`:1010`:
```jsx
        <FulfillmentSelector onComplete={completeFulfillment} isApparel={apparelMode} />
```

`:1017`:
```jsx
          <FulfillmentSummary data={fulfillmentData} onChange={changeFulfillment} isApparel={apparelMode} />
```

- [ ] **Step 6: Update the FulfillmentSelector area badge**

In `src/pages/ShopPage.jsx`, replace the timing badge span in the area step (`:139-147`):

```jsx
              <span data-testid="delivery-timing-badge" style={{
                fontFamily: 'var(--font-sans)', fontSize: '0.62rem', letterSpacing: '0.06em',
                padding: '0.15rem 0.5rem', borderRadius: '100px',
                background: isApparel || selectedEm === 'Abu Dhabi' ? 'rgba(201,169,110,0.18)' : 'rgba(201,160,163,0.2)',
                color: isApparel || selectedEm === 'Abu Dhabi' ? 'var(--color-gold)' : 'var(--color-dark)',
                fontWeight: 600,
              }}>
                {isApparel
                  ? '48–72 hour delivery'
                  : (selectedEm === 'Abu Dhabi' ? 'Same-day delivery' : 'Next-day delivery')}
              </span>
```

(The `fee` variable in `FulfillmentSelector` already resolves to `22` when `isApparel` is true, so the "Delivery fee: AED 22" text needs no change.)

- [ ] **Step 7: Run test to verify it passes**

Run: `npx playwright test tests/delivery-rules.spec.js -g "apparel shop gate" --project=desktop-1440`
Expected: PASS.

- [ ] **Step 8: Run the full new suite + existing shop suite**

Run: `npx playwright test tests/delivery-rules.spec.js tests/shop.spec.js --project=desktop-1440`
Expected: PASS — all new delivery-rule tests plus the existing shop tests (the truffle fulfillment flow still shows AED 35/40 and Same-day/Next-day, because those tests use empty carts and browse-tab fallback).

- [ ] **Step 9: Commit**

```bash
git add src/lib/fulfillment.js src/pages/ShopPage.jsx tests/delivery-rules.spec.js
git commit -m "FIX 3: shop fulfillment gate switches to 48-72h for apparel-only carts"
```

---

## Self-Review

**Spec coverage:**
- FIX 1 client (time slot AD-only, validation) → Task 1. ✓
- FIX 1 server (create-order timeSlot AD-only; finalize verified) → Task 2. ✓
- FIX 2 (Morning day-before, Afternoon 13:00, Evening 17:30, greyed+disabled, helper text) → Task 3. ✓
- FIX 3 checkout pill (48–72h · AED 22, no date/time) → Task 4. ✓
- FIX 3 shop gate (cart-content switch, 48–72h badge, AED 22) → Task 5. ✓
- All seven Playwright acceptance cases: Al Ain (T1), 11:00/13:30/18:00/tomorrow (T3), apparel shop (T5), apparel checkout (T4). ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. ✓

**Type consistency:** `slotClosedToday(slot, deliveryDate, now)` and `TIME_SLOTS` field names (`label`, `hours`, `sameDayCutoff`) are identical in `fulfillment.js`, CheckoutPage usage, and the unit test. `cartMode(items)` return values (`'empty'|'apparel'|'truffle'`) match ShopPage's `apparelMode` derivation. `data-testid` values (`slot-Morning/Afternoon/Evening`, `slot-helper`, `checkout-delivery-badge`, `delivery-timing-badge`) match between the implementation steps and the tests. ✓

**Note on `now` reference in the picker:** CheckoutPage already computes `const now = uaeNow()` at `:209`, used by the picker via `slotClosedToday(slot, form.date, now)`. Confirmed in scope of Task 3 Step 5.
