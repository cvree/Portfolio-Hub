/* One capture of each product's rail, so the six rhythms are on the record
   side by side. Same script, same width, same moment in the sweep.

     node tools/rails.mjs <outdir> [baseUrl]
*/
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'artifacts/instrument/rails';
const base = process.argv[3] || 'http://127.0.0.1:8123/';
mkdirSync(out, { recursive: true });

const PAGES = [
  ['spellbomb', 'a fuse'],
  ['health-journal', 'a circadian rise'],
  ['phlebotomy-exam-prep', 'a clinical trace'],
  ['manifester', 'a breath'],
  ['owcs-comp-tracker', 'a swap timeline'],
  ['paper-animator', 'a page fold'],
];

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
for (const [page, what] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(base + page + '.html', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await p.waitForTimeout(2400);
  await p.locator('.ap__rail').scrollIntoViewIfNeeded();
  await p.locator('.ap__rail').screenshot({ path: path.join(out, page + '.png') });
  console.log('rail', page, '—', what);
  await ctx.close();
}
await browser.close();
