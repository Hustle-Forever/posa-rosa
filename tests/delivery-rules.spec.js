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
