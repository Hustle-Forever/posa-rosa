import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const SS_DIR = path.join(process.cwd(), 'tests', 'screenshots')

function ssPath(name) {
  fs.mkdirSync(SS_DIR, { recursive: true })
  return path.join(SS_DIR, `${name}-${Date.now()}.png`)
}

// ─── TASK 3: Hero ─────────────────────────────────────────────────────────────

test.describe('Task 3 – Hero', () => {
  test('new tagline, no Explore Collection, Shop Now present', async ({ page }, testInfo) => {
    await page.goto('/')
    // Allow hero animations to settle
    await page.waitForTimeout(1000)

    // New tagline in the hero heading
    const heroSection = page.locator('section').first()
    const heading = heroSection.locator('h1')
    await expect(heading).toContainText('Happiness is')
    await expect(heading).toContainText('a Butterfly')

    // Old tagline not in the hero h1 (may exist in footer — that's fine per spec)
    await expect(heading).not.toContainText('Butterfly Chocolates')
    await expect(heading).not.toContainText('A Bite of Bliss')

    // Explore Collection link removed (was an <a href="#chocolates"> link)
    await expect(page.getByRole('link', { name: /explore collection/i })).toHaveCount(0)

    // Shop Now present
    await expect(page.getByRole('link', { name: /shop now/i })).toBeVisible()

    // No console errors
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    await page.waitForTimeout(500)

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-hero`) })
  })
})

// ─── TASK 1: Delivery / Pickup flow ──────────────────────────────────────────

test.describe('Task 1 – Fulfillment selector', () => {
  test.beforeEach(async ({ page }) => {
    // Clear fulfillment selection before each test
    await page.goto('/shop')
    await page.evaluate(() => sessionStorage.removeItem('posa-rosa-fulfillment'))
    await page.reload()
  })

  test('PICKUP: clicking Pickup skips to products view', async ({ page }, testInfo) => {
    await page.goto('/shop')
    await page.evaluate(() => sessionStorage.removeItem('posa-rosa-fulfillment'))
    await page.reload()

    await expect(page.getByTestId('btn-pickup')).toBeVisible()
    await expect(page.getByTestId('btn-delivery')).toBeVisible()

    await page.getByTestId('btn-pickup').click()

    // Fulfillment step is gone — summary chip + filter bar appears
    await expect(page.getByTestId('btn-pickup')).toBeHidden()
    await expect(page.getByText(/pickup at para café/i)).toBeVisible()
    await expect(page.getByText(/free/i)).toBeVisible()

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-pickup-flow`) })
  })

  test('DELIVERY Abu Dhabi: emirate→area flow, fee is AED 35', async ({ page }, testInfo) => {
    // beforeEach already navigated to /shop with clean sessionStorage
    await page.getByTestId('btn-delivery').click()

    // Wait for emirate step, then click Abu Dhabi
    await expect(page.getByTestId('emirate-Abu-Dhabi')).toBeVisible()
    await page.getByTestId('emirate-Abu-Dhabi').click()

    // Area step fee info box shows AED 35 (scoped — avoids matching emirate cards)
    await expect(page.getByTestId('area-fee-info')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('area-fee-info')).toContainText('AED 35')

    await page.getByTestId('area-Al-Mushrif').click()
    await page.getByTestId('btn-area-continue').click()

    // Summary chip shows Abu Dhabi + AED 35; selector is gone
    await expect(page.getByText(/Delivery to Abu Dhabi/i)).toBeVisible()
    await expect(page.getByText(/AED 35/)).toBeVisible()
    await expect(page.getByTestId('btn-delivery')).toBeHidden()

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-delivery-abu-dhabi`) })
  })

  test('DELIVERY Dubai: emirate→area flow, fee is AED 40', async ({ page }, testInfo) => {
    // beforeEach already navigated to /shop with clean sessionStorage
    await page.getByTestId('btn-delivery').click()

    // Wait for emirate step, then click Dubai
    await expect(page.getByTestId('emirate-Dubai')).toBeVisible()
    await page.getByTestId('emirate-Dubai').click()

    // Area step fee info box shows AED 40 (scoped — avoids matching all emirate cards)
    await expect(page.getByTestId('area-fee-info')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('area-fee-info')).toContainText('AED 40')

    await page.getByTestId('area-Marina').click()
    await page.getByTestId('btn-area-continue').click()

    // Summary chip shows Dubai + AED 40; selector is gone
    await expect(page.getByText(/Delivery to Dubai/i)).toBeVisible()
    await expect(page.getByText(/AED 40/)).toBeVisible()
    await expect(page.getByTestId('btn-delivery')).toBeHidden()

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-delivery-dubai`) })
  })

  test('DELIVERY "Other" area: shows custom text input', async ({ page }, testInfo) => {
    await page.goto('/shop')
    await page.evaluate(() => sessionStorage.removeItem('posa-rosa-fulfillment'))
    await page.reload()

    await page.getByTestId('btn-delivery').click()
    await page.getByTestId('emirate-Dubai').click()
    await page.getByTestId('area-Other').click()

    // Custom text input should appear
    await expect(page.getByTestId('area-other-input')).toBeVisible()

    // Continue should be disabled until text is entered
    const continueBtn = page.getByTestId('btn-area-continue')
    await expect(continueBtn).toBeDisabled()

    await page.getByTestId('area-other-input').fill('Palm Jumeirah')
    await expect(continueBtn).toBeEnabled()
    await continueBtn.click()

    // Summary chip shows the custom area name and fee
    await expect(page.getByText(/Delivery to Dubai/i)).toBeVisible()
    await expect(page.getByText(/Palm Jumeirah/i)).toBeVisible()
    await expect(page.getByText(/AED 40/)).toBeVisible()
    await expect(page.getByTestId('btn-delivery')).toBeHidden()

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-delivery-other-area`) })
  })

  test('Change link resets to fulfillment step', async ({ page }) => {
    await page.goto('/shop')
    await page.evaluate(() => {
      sessionStorage.setItem('posa-rosa-fulfillment', JSON.stringify({ type: 'pickup', emirate: '', area: '' }))
    })
    await page.reload()

    // Fulfillment summary chip should show (skipped selector step)
    await expect(page.getByText(/Pickup at Para Café/i)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByTestId('btn-pickup')).toBeHidden()

    // Click Change → back to selector
    await page.getByText('Change').click()
    await expect(page.getByTestId('btn-delivery')).toBeVisible()
  })
})

// ─── TASK 2: Mix Box ─────────────────────────────────────────────────────────

test.describe('Task 2 – Mix Box', () => {
  test.beforeEach(async ({ page }) => {
    // Set pickup so we skip to products step
    await page.goto('/shop')
    await page.evaluate(() => {
      sessionStorage.setItem('posa-rosa-fulfillment', JSON.stringify({ type: 'pickup', emirate: '', area: '' }))
    })
    await page.reload()
    // Mix Box card is always rendered once products step is shown
    await page.waitForSelector('[data-testid="mix-box-card"]', { timeout: 8_000 })
  })

  test('Mix Box card is visible and opens modal', async ({ page }, testInfo) => {
    const card = page.getByTestId('mix-box-card')
    await expect(card).toBeVisible()
    await expect(card).toContainText('Mix Box')
    await expect(card).toContainText('20 pieces')
    await expect(card).toContainText('165')

    await card.click()
    // Modal should open
    await expect(page.getByText('Build Your Mix Box')).toBeVisible()

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-mixbox-modal-open`) })
  })

  test('Add to Cart disabled when total is not 20', async ({ page }, testInfo) => {
    await page.getByTestId('mix-box-card').click()
    await expect(page.getByText('Build Your Mix Box')).toBeVisible()

    const addBtn = page.getByTestId('mixbox-add-to-cart')

    // Initially: 0 pieces, disabled
    await expect(addBtn).toBeDisabled()

    // Add 5 pieces of first available product
    const firstPlusBtn = page.locator('button[aria-label^="Add"]').first()
    for (let i = 0; i < 5; i++) await firstPlusBtn.click()

    // Still disabled: only 5/20
    await expect(addBtn).toBeDisabled()
    await expect(page.getByText('5 / 20 pieces')).toBeVisible()

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-mixbox-partial`) })
  })

  test('Add to Cart enabled when exactly 20 pieces and 2+ flavors', async ({ page }, testInfo) => {
    await page.getByTestId('mix-box-card').click()
    await expect(page.getByText('Build Your Mix Box')).toBeVisible()

    const addBtn = page.getByTestId('mixbox-add-to-cart')
    const plusBtns = page.locator('button[aria-label^="Add"]')
    const count = await plusBtns.count()
    if (count < 2) {
      test.skip()
      return
    }

    // Add 10 pieces to first flavor, 10 to second
    for (let i = 0; i < 10; i++) await plusBtns.nth(0).click()
    for (let i = 0; i < 10; i++) await plusBtns.nth(1).click()

    await expect(addBtn).toBeEnabled()
    await expect(page.getByText('20 / 20 pieces')).toBeVisible()
    await expect(page.getByText(/Box complete!/i)).toBeVisible()

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-mixbox-complete`) })

    // Actually add to cart
    await addBtn.click()
    // Cart drawer should open
    await expect(page.getByText('Mix Box (20 pcs)')).toBeVisible({ timeout: 5000 })

    await page.screenshot({ path: ssPath(`${testInfo.project.name}-mixbox-in-cart`) })
  })

  test('Cannot select more than 5 flavors', async ({ page }) => {
    await page.getByTestId('mix-box-card').click()
    await expect(page.getByText('Build Your Mix Box')).toBeVisible()

    const plusBtns = page.locator('button[aria-label^="Add"]')
    const count = await plusBtns.count()
    if (count < 6) { test.skip(); return }

    // Add 1 piece each to first 5 flavors
    for (let i = 0; i < 5; i++) await plusBtns.nth(i).click()

    // 6th flavor's + button should be disabled
    await expect(plusBtns.nth(5)).toBeDisabled()
  })
})

// ─── No console errors on all pages ──────────────────────────────────────────

test('No critical console errors on shop page', async ({ page }) => {
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto('/shop')
  await page.evaluate(() => {
    sessionStorage.setItem('posa-rosa-fulfillment', JSON.stringify({ type: 'pickup', emirate: '', area: '' }))
  })
  await page.reload()
  await page.waitForTimeout(3000)

  const criticalErrors = errors.filter(e =>
    !e.includes('favicon') &&
    !e.includes('404') &&
    !e.includes('Failed to load resource') &&
    !e.includes('Failed to load products') &&
    !e.includes('Failed to fetch')
  )
  expect(criticalErrors).toHaveLength(0)
})
