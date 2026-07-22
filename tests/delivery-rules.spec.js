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
