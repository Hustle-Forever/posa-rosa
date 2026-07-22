# Delivery-Rule Fixes — Design

**Date:** 2026-07-22
**Scope:** Three delivery-rule fixes for Posa Rosa checkout + shop fulfillment gate. No changes outside the files listed.

## Problem

Three delivery rules are wrong today:

1. The "Preferred Time" slot picker renders for **every** emirate on truffle orders; it should render **only** for Abu Dhabi. Server validation also wrongly requires `timeSlot` for non-Abu-Dhabi orders.
2. Abu Dhabi same-day slot cutoffs are modelled as "disabled after the slot's end hour," which does not match the real cutoffs (Morning never same-day; Afternoon closes 13:00; Evening closes 17:30).
3. Apparel-only carts still show Abu Dhabi "Same-day delivery" and area-based fees. Apparel must always be "48–72 hour delivery · AED 22" for every emirate, with no date/time pickers.

## Affected files

- `src/lib/fulfillment.js` — shared cart classification + slot model/predicate (new exports).
- `src/pages/CheckoutPage.jsx` — FIX 1, FIX 2, FIX 3 (emirate pill).
- `src/pages/ShopPage.jsx` — FIX 3 (fulfillment gate `FulfillmentSelector` + `FulfillmentSummary`).
- `netlify/functions/create-order.js` — FIX 1 (server validation).
- `netlify/functions/finalize-order.js` — already does not require `timeSlot`; verify only, no change expected.
- `tests/delivery-rules.spec.js` — new Playwright spec (verification).

Netlify functions cannot import from `src/`, so the server keeps its own inline copy of the "require timeSlot only for Abu Dhabi" rule. The slot model is duplicated intentionally (client-only concern).

## Shared helper — `src/lib/fulfillment.js`

Add pure, side-effect-free exports so every surface classifies carts identically:

```js
// 'empty' | 'apparel' | 'truffle'
export function cartMode(items) {
  if (!items || items.length === 0) return 'empty'
  return items.every(i => i.isApparel) ? 'apparel' : 'truffle'
}
```

- `apparel` → 48–72h / AED 22, no date/time, no same-day badge.
- `truffle` → existing same-day (Abu Dhabi) / next-day (other) behavior.
- `empty` → caller chooses fallback.

Add the Abu-Dhabi slot model + same-day cutoff predicate (client display concern; consumed by CheckoutPage):

```js
// Same-day cutoff per slot, in Asia/Dubai minutes-since-midnight.
// null = never available same-day (must order the day before).
export const TIME_SLOTS = [
  { label: 'Morning',   hours: '9AM – 12PM', sameDayCutoff: null },
  { label: 'Afternoon', hours: '12PM – 5PM', sameDayCutoff: 13 * 60 },      // 13:00
  { label: 'Evening',   hours: '5PM – 8PM',  sameDayCutoff: 17 * 60 + 30 }, // 17:30
]

// True when the slot cannot be delivered for the chosen date.
// deliveryDate / now.date are 'YYYY-MM-DD' Asia/Dubai; now.minutes is minutes-since-midnight.
export function slotClosedToday(slot, deliveryDate, now) {
  if (deliveryDate !== now.date) return false        // tomorrow-or-later: always open
  if (slot.sameDayCutoff == null) return true          // Morning: never same-day
  return now.minutes >= slot.sameDayCutoff
}
```

`CheckoutPage.jsx` imports `TIME_SLOTS` and `slotClosedToday` from `fulfillment.js` instead of its local `TIME_SLOTS`/`slotHasPassed`. `uaeNow()` stays in CheckoutPage.

## FIX 1 — Time slot = Abu Dhabi + truffle only

`CheckoutPage.jsx`:
- The Preferred-Time `<Field>` renders only when `isAbuDhabi && !allApparel` (currently `!allApparel`). Non-Abu-Dhabi truffle orders show the Delivery Date picker and **no** time-slot section.
- `formValid` (memo): require `timeSlot` only when `isAbuDhabi && !allApparel`. Date still required for any non-apparel order.
- `validate()`: build the `timeSlot` error only when `isAbuDhabi && !allApparel`. Keep the date checks for all non-apparel orders.

`netlify/functions/create-order.js` — `validateOrder`:
- Keep requiring a valid `date` for any non-apparel order.
- Require `timeSlot` only when `delivery.emirate === 'Abu Dhabi'`.

`netlify/functions/finalize-order.js`:
- Already only requires `date` (not `timeSlot`) for non-apparel. No change; verified as part of this work.

## FIX 2 — Abu Dhabi same-day cutoffs

Uses the new `TIME_SLOTS` + `slotClosedToday`. Behavior:

| Slot | Same-day rule (delivery date = today) |
|---|---|
| Morning | Always closed today (orderable only for tomorrow-or-later) |
| Afternoon | Closed if UAE now ≥ 13:00 |
| Evening | Closed if UAE now ≥ 17:30 |

Tomorrow-or-later: all three open regardless of current time.

`CheckoutPage.jsx` time picker:
- Always render the three slot buttons (per decision: greyed disabled buttons, not a replacement message).
- A closed slot is styled greyed **and** carries the `disabled` attribute (unclickable). The existing "passed" visual/label becomes "closed".
- Selecting a slot that becomes closed clears the selection (reuse existing `handleDateChange` clearing via `slotClosedToday`).
- Helper text appears **under** the picker when the chosen date is today (UAE) and at least one slot is closed: `Some slots are closed for today's orders.`
- Remove the swap-to-red-box behavior (`allSlotsPassed` → `ALL_SLOTS_PASSED_MSG`) from the time picker. The date field keeps `min` = today for Abu Dhabi (Afternoon/Evening can still be same-day). Date-level validation no longer needs the "all slots passed" branch because the buttons themselves enforce availability and `validate()` rejects a closed selected slot.

`validate()` slot check uses `slotClosedToday` (was `slotHasPassed`): if a selected slot is closed for the chosen date, error "That time slot has passed — please pick another".

## FIX 3 — Apparel = 48–72h everywhere, no same-day

Display mode via `cartMode(items)` with browse-tab fallback when the cart is empty.

`src/pages/ShopPage.jsx`:
- Compute an effective mode inside the shop: `const apparelMode = items.length ? cartMode(items) === 'apparel' : isApparel` (where `isApparel = activeTab === 'COLLECTION'`). Pass this to `FulfillmentSelector` and `FulfillmentSummary` in place of the raw `isApparel`.
- `FulfillmentSelector`:
  - Emirate cards show `AED 22` in apparel mode (already the case via the `isApparel` prop — now driven by `apparelMode`).
  - Area-step info box: in apparel mode the badge reads `48–72 hour delivery` for every emirate (no Same-day/Next-day pill); fee shows `AED 22`. Truffle mode keeps the existing Same-day (Abu Dhabi) / Next-day pill.
- `FulfillmentSummary` chip: fee already reflects `apparelMode` (AED 22). No same-day text present today; left as-is aside from the fee.

`src/pages/CheckoutPage.jsx`:
- Emirate pill (`Same-day delivery available` / `Next-day delivery`): when `allApparel`, render `48–72 hour delivery · AED 22` instead. Date/time hiding for apparel already exists.

## Verification — `tests/delivery-rules.spec.js`

Playwright (auto-starts Vite on :5173, `data-testid` selectors, `page.clock` for UAE time). Seven acceptance cases:

1. **Truffle, Al Ain** → date picker visible, no time-slot section.
2. **Truffle, Abu Dhabi, 11:00 today, date=today** → Morning disabled, Afternoon enabled, Evening enabled; helper text visible.
3. **Truffle, Abu Dhabi, 13:30 today, date=today** → Morning disabled, Afternoon disabled, Evening enabled.
4. **Truffle, Abu Dhabi, 18:00 today, date=today** → all three disabled.
5. **Truffle, Abu Dhabi, date=tomorrow** → all three enabled regardless of current time.
6. **Apparel-only, Abu Dhabi (shop gate)** → `48–72 hour delivery · AED 22` shown, no Same-day pill.
7. **Apparel-only, checkout** → no date picker, no time picker, `Delivery: 48–72 hours` line present.

Clock mocking: fix an instant whose Asia/Dubai wall clock is the target (UTC = UAE − 4h). Derive the UAE `YYYY-MM-DD` in-test to fill the date input. New `data-testid` hooks added to CheckoutPage time-slot buttons and the shop area badge so assertions are stable (test-only attributes, no behavior change).

## Out of scope / guardrails

- No changes to pricing, Stripe flow, Firestore schema, or any file not listed above.
- Apparel fee stays AED 22; truffle fees stay AED 35 (Abu Dhabi) / AED 40 (other).
- English-only copy; mobile-first layout unchanged.
