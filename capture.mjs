import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/hero.png', fullPage: false });
console.log('hero done');

// scroll to product grid
await page.evaluate(() => window.scrollTo({ top: document.querySelector('#chocolates')?.offsetTop - 100 || 1200, behavior: 'instant' }));
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/grid.png', fullPage: false });
console.log('grid done');

// scroll to how to order
await page.evaluate(() => window.scrollTo({ top: document.querySelector('#order')?.offsetTop - 100 || 5000, behavior: 'instant' }));
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/order.png', fullPage: false });
console.log('order done');

// footer
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/footer.png', fullPage: false });
console.log('footer done');

// errors?
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
console.log('console errors:', errors.join(' | ') || 'none');

await browser.close();
