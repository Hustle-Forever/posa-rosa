// Loads the home page headlessly and reports every console error/warning,
// page error, and failed network request — used to hunt the CORS error.
import { chromium } from '@playwright/test'

const url = process.argv[2] || 'http://localhost:5173/'
const browser = await chromium.launch()
const page = await browser.newPage()

const logs = []
page.on('console', msg => {
  if (['error', 'warning'].includes(msg.type())) {
    logs.push(`[console.${msg.type()}] ${msg.text()}`)
  }
})
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`))
page.on('requestfailed', req =>
  logs.push(`[requestfailed] ${req.url()} — ${req.failure()?.errorText}`)
)

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(4000)

console.log(logs.length ? logs.join('\n') : 'CLEAN — no console errors/warnings or failed requests')
await browser.close()
