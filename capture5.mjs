import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await page.waitForTimeout(800);

// Check footer logo bounding rect
const rect = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('footer img'));
  return imgs.map(img => ({ 
    src: img.src.split('/').pop(), 
    rect: img.getBoundingClientRect(),
    computedWidth: img.offsetWidth,
    computedHeight: img.offsetHeight,
  }));
});
console.log('footer images:', JSON.stringify(rect, null, 2));

await browser.close();
