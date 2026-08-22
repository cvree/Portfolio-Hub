/* ===========================================================================
   Calibrate the metric-matched fallback faces in assets/fonts.css
   ---------------------------------------------------------------------------
   `font-display: swap` paints the first frame in a system face. If that face
   is not the same width as the webfont replacing it, every line re-wraps and
   the page jumps. The fallback faces in fonts.css correct for that with
   `size-adjust`; this measures how well, and rewrites the numbers.

   It measures in the DOM, at the size each family is actually set at, because
   Newsreader carries an optical-size axis and its width is not the same at
   18 px as it is at 100 px.

     node tools/calibrate_fallbacks.mjs            # report the error
     node tools/calibrate_fallbacks.mjs --write    # correct fonts.css

   Run it after replacing or instancing a font, then rebuild the pages.
   =========================================================================== */

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const PORT = 8199;
const write = process.argv.includes('--write');

/* family, style, the weight range as written in fonts.css, and the size the
   site actually sets that face at. */
const FACES = [
  ['Instrument Serif', 'normal', '400', 64],
  ['Instrument Serif', 'italic', '400', 64],
  ['Newsreader', 'normal', '400 500', 18],
  ['Newsreader', 'normal', '501 700', 18],
  ['Newsreader', 'italic', '400 700', 18],
  ['Space Grotesk', 'normal', '400', 15],
  ['Space Grotesk', 'normal', '500', 15],
  ['Space Grotesk', 'normal', '600 700', 16],
  ['IBM Plex Mono', 'normal', '400', 12],
];

const SAMPLE =
  'I work at the seam between patient care and the tools that support it and I build the tools. ' +
  'Six products, shipped and shown running: a private health journal with a living timeline, a ' +
  'phlebotomy certification platform, and a computer-vision pipeline that reads an esports ' +
  'broadcast. Health Science Student NREMT-Certified EMT Product Builder Esports Leader 2026';

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 900));

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

const results = await page.evaluate(
  async ({ faces, sample }) => {
    const probe = document.createElement('span');
    probe.style.cssText =
      'position:absolute;left:-99999px;top:0;white-space:nowrap;visibility:hidden;letter-spacing:normal';
    document.body.appendChild(probe);

    const measure = async (family, style, weight, size) => {
      const spec = `${style === 'italic' ? 'italic ' : ''}${weight} ${size}px "${family}"`;
      await document.fonts.load(spec, sample).catch(() => {});
      probe.style.font = `${style === 'italic' ? 'italic ' : ''}${weight} ${size}px "${family}"`;
      probe.textContent = sample;
      return probe.getBoundingClientRect().width;
    };

    const out = [];
    for (const [family, style, weights, size] of faces) {
      const weight = String(weights).split(' ')[0];
      const real = await measure(family, style, weight, size);
      const fb = await measure(`${family} fallback`, style, weight, size);
      out.push({ family, style, weights, size, correction: fb ? real / fb : 1 });
    }
    probe.remove();
    return out;
  },
  { faces: FACES, sample: SAMPLE }
);

await browser.close();
server.kill();

let css = readFileSync('assets/fonts.css', 'utf8');
let worst = 0;

for (const r of results) {
  const drift = Math.abs(1 - r.correction) * 100;
  worst = Math.max(worst, drift);
  console.log(
    `${(r.family + ' ' + r.style + ' ' + r.weights).padEnd(38)} ` +
      `at ${String(r.size).padStart(3)}px  off by ${drift.toFixed(2)}%`
  );

  const head = `font-family:'${r.family} fallback';\n  font-style:${r.style}; font-weight:${r.weights};`;
  const i = css.indexOf(head);
  if (i < 0) {
    console.warn(`  (no face declared for ${r.family} ${r.style} ${r.weights})`);
    continue;
  }
  const tail = css.indexOf('}', i);
  const block = css.slice(i, tail);
  const fixed = block.replace(
    /size-adjust:([\d.]+)%; ascent-override:([\d.]+)%; descent-override:([\d.]+)%;/,
    (_m, sa, asc, desc) =>
      `size-adjust:${(parseFloat(sa) * r.correction).toFixed(1)}%; ` +
      `ascent-override:${(parseFloat(asc) / r.correction).toFixed(1)}%; ` +
      `descent-override:${(parseFloat(desc) / r.correction).toFixed(1)}%;`
  );
  css = css.slice(0, i) + fixed + css.slice(tail);
}

console.log(`\nworst drift: ${worst.toFixed(2)}%`);
if (write) {
  writeFileSync('assets/fonts.css', css, 'utf8');
  console.log('assets/fonts.css corrected — now run: python3 tools/build_pages.py');
} else {
  console.log('(dry run — pass --write to correct assets/fonts.css)');
}
