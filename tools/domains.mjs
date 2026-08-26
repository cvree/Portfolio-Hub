/* One frame per hero domain, desktop and mobile, the six Projects rooms
   in the state a visitor actually reads them in, the sculpture under the hand,
   and the contact card on both of its faces.

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

/* --- the sculpture, under the hand -------------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(2600);

  const box = await page.locator('.ce').boundingBox();
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 170, cy + 70, { steps: 12 });
    await page.waitForTimeout(320);
    await page.screenshot({ path: path.join(out, 'hero-held-desktop.png') });
    await page.mouse.up();
    console.log('shot hero-held-desktop');
  }

  /* The trace across the top of the page, at rest and under load. */
  const strip = { x: 0, y: 0, width: 1440, height: 120 };
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(out, 'spine-at-rest.png'), clip: strip });
  await page.evaluate(async () => {
    for (let i = 0; i < 24; i++) {
      window.scrollBy(0, 100);
      await new Promise((r) => requestAnimationFrame(r));
    }
  });
  await page.screenshot({ path: path.join(out, 'spine-under-load.png'), clip: strip });
  console.log('shot spine-at-rest, spine-under-load');
  await ctx.close();
}

/* --- the card ------------------------------------------------------------ */
for (const [label, vp, js] of [
  ['desktop', { width: 1440, height: 980 }, true],
  ['mobile', { width: 390, height: 844 }, true],
  ['nojs', { width: 1440, height: 980 }, false],
]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, javaScriptEnabled: js });
  const page = await ctx.newPage();
  await page.goto(base + 'contact.html', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(js ? 1100 : 500);

  if (js) await page.mouse.move(vp.width * 0.68, vp.height * 0.45);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, `card-front-${label}.png`) });
  console.log(`shot card-front-${label}`);

  if (js) {
    /* Mid-turn is the frame that shows it is an object: the stock has a
       thickness and the foil rakes across it. */
    await page.locator('[data-vcard-flip]').click();
    await page.waitForTimeout(330);
    await page.screenshot({ path: path.join(out, `card-turning-${label}.png`) });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(out, `card-back-${label}.png`) });
    console.log(`shot card-turning-${label}, card-back-${label}`);
  }
  await ctx.close();
}

await browser.close();
