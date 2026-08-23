/* One screenshot per channel, so all six compositions are on the record and
   any one of them can be compared with any other. Same script, same scroll
   position, same viewport, every time.

     node tools/channels.mjs <outdir> [baseUrl]
*/
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'artifacts/instrument/channels';
const base = process.argv[3] || 'http://127.0.0.1:8123/';
const exe = process.env.PW_CHROMIUM_PATH || undefined;
mkdirSync(out, { recursive: true });

const CH = ['spellbomb', 'health-journal', 'phlebotomy', 'manifester', 'owcs', 'paper-animator'];
const browser = await chromium.launch({ executablePath: exe });

for (const vp of [{ w: 1440, h: 900, tag: 'desktop' }, { w: 390, h: 844, tag: 'mobile' }]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: vp.tag === 'mobile',
    hasTouch: vp.tag === 'mobile',
  });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(2600);

  for (const slug of CH) {
    await page.locator(`[data-ch="${slug}"]`).click();
    /* Clicking scrolls the control into view; the record is of the composition
       at the position every visitor actually arrives at. */
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, `${vp.tag}-${slug}.png`) });
    console.log('shot', vp.tag, slug);
  }
  await ctx.close();
}
await browser.close();
