import { test, expect } from '@playwright/test';
import sharp from 'sharp';

/* ---------------------------------------------------------------------------
   THE LEGIBILITY FLOOR
   ---------------------------------------------------------------------------
   Every other contrast check on this site could be done against the tokens:
   #9d9a90 on #0b0c0e is 6.9:1 and there is nothing to argue about. That stopped
   being the truth the day a WebGL plane was mounted behind every page. What a
   visitor reads over is not --ink any more — it is the composite of the ink,
   the gradient wash, the shader, the grain and the plane's own opacity, and the
   only honest way to know what that adds up to is to render it and look at the
   pixels.

   So this suite does exactly that:

     1. load the page and wait until the plane has actually drawn frames
     2. find the real line boxes of real text with a Range, not the elements —
        a block is as wide as its container however narrow its ink is
     3. make the glyphs transparent and hide the decorative marks inside them,
        so what is left in those boxes is precisely the backdrop
     4. screenshot, decode, and compute WCAG contrast between the text's own
        computed colour and the brightest thing behind it

   The floor is the real one: 4.5:1 for body copy, 3:1 for large text, using
   WCAG's own definition of large. The measurement is the 98th percentile of the
   backdrop rather than the single brightest pixel, because the plane dithers
   deliberately and the grain overlay is noise by construction — one speckle a
   glyph's width from anything is not what makes a paragraph hard to read.

   If this fails, the atmosphere got louder. Turn it down; do not turn this
   number down.
   --------------------------------------------------------------------------- */

/* The classes the copy on this site is actually set in. */
const BODY =
  '.wk__blurb, .prose p, .quiet, .proof__list li, .card__d, .tile__d, .sig__lede, ' +
  '.case-hero__lede, .sig__creed, .wk__proof .k, .eyebrow, .facts dd, .lede';
const DISPLAY = '.h1, .h2, .h3, .display, .sig__title, .foot__sig';

type Line = { x: number; y: number; w: number; h: number };
type Run = { color: string; large: boolean; where: string; lines: Line[] };

function toLinear(c: number) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(r: number, g: number, b: number) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/* Find every run of text currently on screen, with its own line boxes and the
   colour it is set in. Marks each one so the blanking rule below can find it. */
async function runs(page: import('@playwright/test').Page, selector: string) {
  return page.evaluate((sel) => {
    const head = document.querySelector('.masthead');
    const under = head ? head.getBoundingClientRect().bottom + 2 : 0;
    const out: Run[] = [];
    document.querySelectorAll(sel).forEach((el) => {
      if (!el.textContent || !el.textContent.trim()) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0') return;

      const range = document.createRange();
      range.selectNodeContents(el);
      const lines: Line[] = [];
      for (const b of Array.from(range.getClientRects())) {
        if (b.width < 8 || b.height < 8) continue;
        /* Only what is unambiguously in front of a reader: clear of the fixed
           masthead above it and of the bottom edge of the frame. */
        if (b.top < under || b.bottom > window.innerHeight - 2) continue;
        if (b.left < 0 || b.right > window.innerWidth) continue;
        lines.push({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) });
      }
      if (!lines.length) return;

      const px = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      el.setAttribute('data-legibility', '');
      out.push({
        color: cs.color,
        /* WCAG's own threshold for large text, not a convenient one. */
        large: px >= 24 || (px >= 18.66 && weight >= 700),
        where: (el.className || el.tagName).toString().slice(0, 40),
        lines,
      });
    });
    return out;
  }, selector) as Promise<Run[]>;
}

const BLANK = `
  [data-legibility], [data-legibility] * { color: transparent !important; }
  [data-legibility] { text-shadow: none !important; -webkit-text-stroke: 0 !important; }
  /* Ticks, rules and LEDs are marks the page draws in front of the plane. They
     are not text and they are not backdrop, so they are not measured. */
  [data-legibility] [aria-hidden="true"] { visibility: hidden !important; }
`;

async function worstContrast(page: import('@playwright/test').Page, selector: string) {
  const found = await runs(page, selector);
  if (!found.length) return null;

  const style = await page.addStyleTag({ content: BLANK });
  await page.waitForTimeout(120);
  const shot = await page.screenshot({ type: 'png' });
  await style.evaluate((el) => el.remove());
  await page.evaluate(() => {
    document.querySelectorAll('[data-legibility]').forEach((el) => el.removeAttribute('data-legibility'));
  });

  const { data, info } = await sharp(shot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let worst: { ratio: number; need: number; where: string } | null = null;
  for (const run of found) {
    const rgb = (run.color.match(/[\d.]+/g) || ['255', '255', '255']).map(Number);
    const ink = luminance(rgb[0], rgb[1], rgb[2]);

    const behind: number[] = [];
    for (const ln of run.lines) {
      const x1 = Math.min(info.width, ln.x + ln.w);
      const y1 = Math.min(info.height, ln.y + ln.h);
      for (let y = Math.max(0, ln.y); y < y1; y++) {
        for (let x = Math.max(0, ln.x); x < x1; x++) {
          const o = (y * info.width + x) * info.channels;
          behind.push(luminance(data[o], data[o + 1], data[o + 2]));
        }
      }
    }
    if (!behind.length) continue;
    behind.sort((a, b) => a - b);
    const bright = behind[Math.min(behind.length - 1, Math.floor(behind.length * 0.98))];

    const ratio = contrast(ink, bright);
    const need = run.large ? 3 : 4.5;
    if (!worst || ratio - need < worst.ratio - worst.need) worst = { ratio, need, where: run.where };
  }
  return worst;
}

/* The plane arrives on its own fade ramp and its mask eases toward the text, so
   a measurement taken the instant it mounts is a measurement of a plane that is
   not finished arriving. These are the two settling waits, and they are the
   reason this file is slower than the rest of the suite. */
const ARRIVE = 2600;
const SETTLE = 2000;

async function planeIsLive(page: import('@playwright/test').Page) {
  return page
    .waitForSelector('.atmos__canvas', { timeout: 10000 })
    .then(() => true)
    .catch(() => false);
}

/* One teal-accented page, one gold, one lime — the three the accent levelling
   has to hold together — plus the home page's hero, which is the one place on
   the site where an object with its own light in it stands behind the words. */
const PAGES: Array<[string, string]> = [
  ['index.html', 'the home page, teal'],
  ['experience.html', 'a chapter page, teal'],
  ['spellbomb.html', 'a case study, gold'],
  ['owcs-comp-tracker.html', 'a case study, lime'],
  ['about.html', 'a page that opens on a paragraph'],
];

const VIEWPORTS: Array<[string, number, number]> = [
  ['1440x900', 1440, 900],
  ['390x844', 390, 844],
];

for (const [url, what] of PAGES) {
  for (const [size, width, height] of VIEWPORTS) {
    test(`text clears its contrast floor over the live atmosphere — ${what}, ${size}`, async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width, height });
      await page.goto(url, { waitUntil: 'load' });

      /* No shader, nothing to prove: this suite exists to police the plane, and
         a browser that never got one is already covered by every other test. */
      test.skip(!(await planeIsLive(page)), 'no WebGL plane in this browser');
      await page.waitForTimeout(ARRIVE);

      let measured = 0;
      for (const at of [0, 0.5]) {
        await page.evaluate((frac) => {
          const doc = document.documentElement;
          window.scrollTo({ top: (doc.scrollHeight - window.innerHeight) * frac, behavior: 'instant' });
        }, at);
        await page.waitForTimeout(SETTLE);

        for (const [kind, selector] of [['body copy', BODY], ['display type', DISPLAY]] as const) {
          const worst = await worstContrast(page, selector);
          if (!worst) continue;
          measured++;
          expect(
            worst.ratio,
            `${kind} at scroll ${at} on ${url}: worst run is .${worst.where} at ` +
              `${worst.ratio.toFixed(2)}:1 against the rendered composite, needs ${worst.need}:1`
          ).toBeGreaterThanOrEqual(worst.need);
        }
      }
      /* A contrast test that found no text to measure has proved nothing at
         all, and would go on passing after somebody renamed every class in
         here. */
      expect(measured, 'no text was found to measure').toBeGreaterThan(0);
    });
  }
}

test('the plane opens back up where there is nothing to read', async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  test.skip(!(await planeIsLive(page)), 'no WebGL plane in this browser');
  await page.waitForTimeout(ARRIVE + SETTLE);

  /* The hero's words are a column down the left and the projection stands in
     the empty half. If the mask were one rectangle around all the text on
     screen it would cover both, so this is the assertion that keeps the mask
     honest: the right of the hero has to be measurably brighter than the left.
     Sampled from the plane alone, with everything the page draws over it — the
     copy and the projection both — taken out of the frame. */
  const strip = await page.evaluate(() => {
    document.querySelectorAll('.sig__copy, .sig__stage, .grain').forEach((el) => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
    return document.querySelector('.sig')!.getBoundingClientRect().height;
  });
  await page.waitForTimeout(120);

  const shot = await page.screenshot({ type: 'png', clip: { x: 0, y: 160, width: 1440, height: Math.min(400, strip - 200) } });
  const { data, info } = await sharp(shot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let left = 0;
  let right = 0;
  let n = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < 420; x++) {
      const a = (y * info.width + x) * info.channels;
      const b = (y * info.width + (info.width - 1 - x)) * info.channels;
      left += luminance(data[a], data[a + 1], data[a + 2]);
      right += luminance(data[b], data[b + 1], data[b + 2]);
      n++;
    }
  }
  expect(right / n).toBeGreaterThan((left / n) * 1.3);
});
