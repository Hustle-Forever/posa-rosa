import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/footer3.png', fullPage: false });
console.log('done');
await browser.close();
