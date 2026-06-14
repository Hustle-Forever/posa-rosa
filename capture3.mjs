import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);

// Find the dark editorial banner (section with dark bg after product grid)
// It's section 4 in main — scroll past product grid
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(500);

// Get all section positions
const positions = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('main section')).map((s, i) => ({
    i,
    top: s.getBoundingClientRect().top + window.scrollY,
    bg: getComputedStyle(s).backgroundColor,
    id: s.id,
  }));
});
console.log('sections:', JSON.stringify(positions, null, 2));

// Editorial banner is the one right after product grid (dark bg, no id)
const bannerSection = positions.find(s => !s.id && s.i === 2);
if (bannerSection) {
  await page.evaluate((top) => window.scrollTo({ top: top - 50, behavior: 'instant' }), bannerSection.top);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '/tmp/editorial.png', fullPage: false });
  console.log('editorial done at top:', bannerSection.top);
}

// Footer
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/footer2.png', fullPage: false });
console.log('footer done');

await browser.close();
