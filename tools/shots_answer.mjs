/* Capture the evidence for section 10 — THE ANSWER.

   The other sets in artifacts/ are matched before/after pairs of pages. This
   one cannot be: none of what it shows existed before, so what it holds is one
   capture of each state the section promises, including the two states that
   are about what is *not* there.

     node tools/shots_answer.mjs [outdir] [baseUrl]
*/
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'artifacts/answer';
const base = process.argv[3] || 'http://127.0.0.1:8123/';
const exe = process.env.PW_CHROMIUM_PATH || undefined;
mkdirSync(out, { recursive: true });

const DESK = { width: 1600, height: 950 };
const MOB = { width: 390, height: 844 };

const browser = await chromium.launch({ executablePath: exe });

async function shot(name, { vp = DESK, mobile = false, reduced = false, js = true }, run) {
  const ctx = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 2,
    isMobile: mobile,
    hasTouch: mobile,
    javaScriptEnabled: js,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  await run(page);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  await ctx.close();
  console.log(name);
}

const settle = async (page, url = '') => {
  await page.goto(base + url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
};

const open = async (page, q) => {
  await page.keyboard.press('/');
  await page.waitForSelector('.cons__row');
  if (q) await page.locator('.cons__input').type(q);
  await page.waitForTimeout(450);
};

await shot('console-rest', {}, async (p) => {
  await settle(p);
  await open(p);
});

await shot('console-query', {}, async (p) => {
  await settle(p);
  await open(p, 'order of draw');
});

await shot('console-nothing', {}, async (p) => {
  await settle(p);
  await open(p, 'qzzxwv');
});

await shot('console-reduced', { reduced: true }, async (p) => {
  await settle(p);
  await open(p, 'manifester');
});

await shot('console-mobile', { vp: MOB, mobile: true }, async (p) => {
  await settle(p);
  await p.locator('.masthead .findbtn').click();
  await p.waitForSelector('.cons__row');
  await p.locator('.cons__input').type('phlebotomy');
  await p.waitForTimeout(450);
});

await shot('receipt', {}, async (p) => {
  await settle(p, 'about.html');
  await p.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < 3200; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
  });
  await p.waitForTimeout(900);
  await p.locator('main .anchor').first().click({ force: true });
  await p.waitForTimeout(400);
});

await shot('return', {}, async (p) => {
  await settle(p, 'about.html');
  await p.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < 3600; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
  });
  await p.waitForTimeout(900);
  await p.locator('[data-totop]').hover();
  await p.waitForTimeout(400);
});

await shot('chapters', {}, async (p) => {
  await settle(p, 'spellbomb.html');
  await p.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < 4200; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 110));
    }
  });
  await p.waitForTimeout(900);
  await p.locator('.chapters__a[aria-current="true"]').hover();
  await p.waitForTimeout(450);
});

await shot('no-js', { js: false }, async (p) => {
  await settle(p, 'about.html');
});

await browser.close();
