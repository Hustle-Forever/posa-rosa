import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
await page.waitForTimeout(800);

const info = await page.evaluate(() => {
  const footer = document.querySelector('footer');
  const container = footer?.firstElementChild;
  const logoWrapper = container?.firstElementChild;
  const img = logoWrapper?.querySelector('img');
  return {
    footerRect: footer?.getBoundingClientRect(),
    containerRect: container?.getBoundingClientRect(),
    containerStyle: container ? getComputedStyle(container).cssText.substring(0, 200) : null,
    logoWrapperRect: logoWrapper?.getBoundingClientRect(),
    logoWrapperStyle: logoWrapper ? window.getComputedStyle(logoWrapper).display + ', justifyContent:' + window.getComputedStyle(logoWrapper).justifyContent : null,
    imgRect: img?.getBoundingClientRect(),
    imgComputedMargin: img ? window.getComputedStyle(img).margin : null,
    imgComputedDisplay: img ? window.getComputedStyle(img).display : null,
  };
});
console.log(JSON.stringify(info, null, 2));

await browser.close();
