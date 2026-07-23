import { test, expect } from '@playwright/test'

// TEST-ONLY: verifies the AED-2 test-product bypass (zero delivery fee, no
// delivery-field validation). Remove alongside the TEST-ONLY code.

const TEST_CART = [{
  id: 'test1', name: 'Test Product', price: 2, quantity: 1,
  handle: 'test-product', variantId: 'gid://shopify/ProductVariant/999', isApparel: false,
}]

test.describe('TEST-ONLY — AED 2 test product', () => {
  test('cart of only the test product → AED 0 delivery, AED 2 total, no delivery-field validation', async ({ page }) => {
    // /api isn't available under vite — stub the PaymentIntent so the Place
    // Order button can reflect form validity.
    await page.route('**/api/create-payment-intent', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ clientSecret: 'pi_3Test_secret_test', paymentIntentId: 'pi_3Test', amount: 200 }),
    }))

    await page.goto('/')
    await page.evaluate((cart) => {
      localStorage.setItem('posa-rosa-cart', JSON.stringify(cart))
    }, TEST_CART)
    await page.goto('/checkout')

    // Money: delivery fee is zero and the total equals the AED 2 product price.
    await expect(page.getByText('AED 0').first()).toBeVisible()
    await expect(page.getByText('AED 2').first()).toBeVisible()

    // Place Order is disabled before any details are filled.
    const placeBtn = page.getByRole('button', { name: /place order/i }).first()
    await expect(placeBtn).toBeDisabled()

    // Fill ONLY contact fields — no address, area, date, or time.
    await page.getByPlaceholder('Fatima Al Mansoori').fill('Test Buyer')
    await page.getByPlaceholder('+971 50 000 0000').fill('+971500000000')
    await page.getByPlaceholder('you@example.com').fill('test@example.com')

    // Button becomes enabled → delivery fields are NOT required for the test product.
    await expect(placeBtn).toBeEnabled({ timeout: 10_000 })
  })
})
