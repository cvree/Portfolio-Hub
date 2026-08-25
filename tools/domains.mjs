/* One frame per hero domain, desktop and mobile, plus the six Selected Work
   rooms in the state a visitor actually reads them in.

     node tools/domains.mjs artifacts/one-signal/states [baseUrl]
*/
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'artifacts/one-signal/states';
const base = process.argv[3] || 'http://127.0.0.1:8123/';
const exe = process.env.PW_CHROMIUM_PATH || undefined;
mkdirSync(out, { recursive: true });

const DOMAINS = ['care', 'build', 'compete'];
const ROOMS = ['spellbomb', 'health-journal', 'phlebotomy', 'manifester', 'owcs', 'paper-animator'];
const VPS = [
  ['desktop', { width: 1440, height: 900 }, false],
  ['mobile', { width: 390, height: 844 }, true],
];

const browser = await chromium.launch({ executablePath: exe });

for (const [label, vp, mobile] of VPS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  /* The arrival, caught mid-sequence and then finished. */
  if (label === 'desktop') {
    const p2 = await ctx.newPage();
    await p2.goto(base, { waitUntil: 'load' });
    await p2.waitForTimeout(520);
    await p2.screenshot({ path: path.join(out, 'hero-arrival-mid.png') });
    await p2.close();
    console.log('shot hero-arrival-mid');
  }

  await page.waitForTimeout(2600);

  for (const d of DOMAINS) {
    await page.locator(`.dom__opt:has([data-dom="${d}"])`).click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(out, `hero-${d}-${label}.png`) });
    console.log(`shot hero-${d}-${label}`);
  }

  /* Each room, activated by scrolling to it and given time to play. */
  for (const r of ROOMS) {
    await page.locator(`#w-${r}`).scrollIntoViewIfNeeded();
    await page.evaluate((id) => {
      document.getElementById('w-' + id).scrollIntoView({ block: 'center', behavior: 'instant' });
    }, r);
    await page.waitForTimeout(2400);
    await page.screenshot({ path: path.join(out, `room-${r}-${label}.png`) });
    console.log(`shot room-${r}-${label}`);
  }

  /* And the keyboard's own state, which a mouse never shows. */
  if (label === 'desktop') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.locator('[data-dom="build"]').focus();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, 'hero-focus-desktop.png') });
    console.log('shot hero-focus-desktop');
  }

  await ctx.close();
}

await browser.close();
