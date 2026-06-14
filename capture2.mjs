import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

// Editorial banner
await page.evaluate(() => {
  const el = document.querySelector('section:nth-of-type(4)');
  if (el) el.scrollIntoView({ behavior: 'instant' });
});
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/banner.png', fullPage: false });
console.log('banner done');

// Gift boxes
await page.evaluate(() => {
  const el = document.querySelector('#gift-boxes');
  if (el) el.scrollIntoView({ behavior: 'instant' });
});
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/gifts.png', fullPage: false });
console.log('gifts done');

// Brand story
await page.evaluate(() => {
  const el = document.querySelector('#about');
  if (el) el.scrollIntoView({ behavior: 'instant' });
});
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/story.png', fullPage: false });
console.log('story done');

await browser.close();
