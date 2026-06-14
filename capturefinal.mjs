import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

// 1. Hero
await page.screenshot({ path: '/tmp/final_hero.png' });

// 2. Product grid
await page.evaluate(() => document.querySelector('#chocolates')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/final_grid.png' });

// 3. Editorial banner
await page.evaluate(() => window.scrollTo({ top: 5500, behavior: 'instant' }));
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/final_banner.png' });

// 4. How to order
await page.evaluate(() => document.querySelector('#order')?.scrollIntoView({ behavior: 'instant' }));
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/final_order.png' });

// 5. Footer
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight }));
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/final_footer.png' });

// verify logo centered
const logoX = await page.evaluate(() => document.querySelector('footer img')?.getBoundingClientRect().x);
console.log('footer logo x:', logoX, '(expected ~692 for centered)');

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
console.log('errors:', errors.length ? errors.join(' | ') : 'none');

await browser.close();
