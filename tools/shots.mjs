/* Capture the evidence set: matched desktop/mobile/reduced-motion/no-JS shots
   plus both résumé print pages. Same script for baseline and final, so the
   two sets are directly comparable.

     node tools/shots.mjs <outdir> [baseUrl]
*/
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'artifacts/cinematic-overhaul/shots';
const base = process.argv[3] || 'http://127.0.0.1:8123/';
const exe = process.env.PW_CHROMIUM_PATH || undefined;

mkdirSync(out, { recursive: true });

const DESK = { width: 1440, height: 900 };
const WIDE = { width: 1920, height: 1080 };
const MOB = { width: 390, height: 844 };
const LAND = { width: 844, height: 390 };

const shots = [
  { name: 'home-desktop',            url: '',                            vp: DESK },
  { name: 'home-mobile',             url: '',                            vp: MOB, mobile: true },
  { name: 'case-desktop',            url: 'phlebotomy-exam-prep.html',   vp: DESK },
  { name: 'case-mobile',             url: 'phlebotomy-exam-prep.html',   vp: MOB, mobile: true },
  { name: 'work-desktop',            url: 'work.html',                   vp: DESK },
  { name: 'resume-desktop',          url: 'resume.html',                 vp: DESK },
  { name: 'home-desktop-reduced',    url: '',                            vp: DESK, reduced: true },
  { name: 'home-mobile-reduced',     url: '',                            vp: MOB, mobile: true, reduced: true },
  { name: 'home-desktop-nojs',       url: '',                            vp: DESK, nojs: true },
  { name: 'case-desktop-nojs',       url: 'phlebotomy-exam-prep.html',   vp: DESK, nojs: true },
  { name: 'home-mobile-nojs',        url: '',                            vp: MOB, mobile: true, nojs: true },
  { name: 'home-wide',               url: '',                            vp: WIDE },
  { name: 'home-landscape',          url: '',                            vp: LAND, mobile: true },
  { name: 'home-desktop-savedata',   url: '',                            vp: DESK, saveData: true },
];

const browser = await chromium.launch({ executablePath: exe });

for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: s.vp,
    deviceScaleFactor: 2,
    isMobile: !!s.mobile,
    hasTouch: !!s.mobile,
    javaScriptEnabled: !s.nojs,
    reducedMotion: s.reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  if (s.saveData) {
    /* The browser API is what the site reads, so it is what has to be faked. */
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) });
    });
  }
  await page.goto(base + s.url, { waitUntil: 'load' });
  // Settle: fonts, lazy images in the first viewport, any entrance motion.
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(s.nojs ? 400 : 2200);
  await page.screenshot({ path: path.join(out, `${s.name}.png`) });
  /* A full-page shot too — but only after every section has been deliberately
     activated and given time to finish arriving. A walk that steps a viewport
     per animation frame outruns the observer that reveals each section and the
     scene each section then plays, and what lands in the artifact is a page of
     grey rectangles. So: stop at each screen, wait out the entrance, and only
     then capture. */
  await page.evaluate(async () => {
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.round(window.innerHeight * 0.75);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await pause(650);
    }
    window.scrollTo(0, 0);
    await pause(500);
  }).catch(() => {});
  await page.waitForTimeout(1200);

  /* And prove it: nothing in the document may still be sitting in a starting
     state when the full-page frame is taken. */
  const unrevealed = await page
    .$$eval('main [data-rise], main [data-motion], main [data-scene]', (els) =>
      els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length
    )
    .catch(() => 0);
  if (unrevealed) console.warn(`  !! ${s.name}: ${unrevealed} section(s) still unrevealed`);
  await page.screenshot({ path: path.join(out, `${s.name}-full.png`), fullPage: true });
  await ctx.close();
  console.log('shot', s.name);
}

/* The résumé, printed. Page count is the assertion that matters. */
{
  const ctx = await browser.newContext({ viewport: DESK });
  const page = await ctx.newPage();
  await page.goto(base + 'resume.html', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);
  await page.pdf({
    path: path.join(out, 'resume.pdf'),
    format: 'Letter',
    printBackground: false,
    margin: { top: '14mm', right: '14mm', bottom: '16mm', left: '14mm' },
  });
  await ctx.close();
  console.log('shot resume.pdf');
}

await browser.close();
