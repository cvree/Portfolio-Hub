import { test, expect } from '@playwright/test';
import { PAGES, WIDTHS } from './pages';

/* Structure, links and layout. These are the assertions that stop a cinematic
   change from quietly costing the site something a visitor depends on. */

test.describe('every page', () => {
  for (const page of PAGES) {
    test(`${page}: exactly one h1, in a sane heading order`, async ({ page: p }) => {
      await p.goto(page);
      await expect(p.locator('h1')).toHaveCount(1);

      const levels = await p.$$eval('h1,h2,h3,h4,h5,h6', (hs) =>
        hs.map((h) => Number(h.tagName[1]))
      );
      expect(levels[0]).toBe(1);
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
      }
    });

    test(`${page}: every image declares alt, width and height`, async ({ page: p }) => {
      await p.goto(page);
      const bad = await p.$$eval('img', (imgs) =>
        imgs
          .filter((i) => !i.hasAttribute('alt') || !i.hasAttribute('width') || !i.hasAttribute('height'))
          .map((i) => i.getAttribute('src'))
      );
      expect(bad).toEqual([]);

      const empty = await p.$$eval('img', (imgs) =>
        imgs.filter((i) => (i.getAttribute('alt') || '').trim().length < 12).map((i) => i.getAttribute('src'))
      );
      expect(empty).toEqual([]);
    });

    test(`${page}: no view-transition-name is used twice`, async ({ page: p }) => {
      await p.goto(page);
      const names = await p.$$eval('[data-vt]', (els) => els.map((e) => e.getAttribute('data-vt')));
      expect(new Set(names).size).toBe(names.length);
    });

    for (const w of WIDTHS) {
      test(`${page}: no horizontal overflow at ${w}px`, async ({ page: p }) => {
        await p.setViewportSize({ width: w, height: 900 });
        await p.goto(page);
        await p.evaluate(() => document.fonts.ready);
        const over = await p.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(over).toBeLessThanOrEqual(0);

        /* A single element sticking out is the usual cause, and the page-level
           number can hide it behind overflow-x: hidden. */
        const wide = await p.evaluate((vw) => {
          const out: string[] = [];
          // A wide diagram inside its own scroller is deliberate: it keeps its
          // labels legible instead of shrinking them to nothing. Anything else
          // sticking past the viewport is a bug.
          // body{overflow-x:hidden} is the site's own safety net and must not
          // be allowed to excuse anything, so the walk stops before it.
          const contained = (el: Element) => {
            for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
              const ox = getComputedStyle(n).overflowX;
              if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
            }
            return false;
          };
          document.querySelectorAll('main *').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > vw + 1.5 && !contained(el)) {
              const e = el as HTMLElement;
              out.push(`${e.tagName.toLowerCase()}.${e.className} right=${Math.round(r.right)}`.slice(0, 90));
            }
          });
          return out.slice(0, 5);
        }, w);
        expect(wide).toEqual([]);
      });
    }

    test(`${page}: loads with no console errors`, async ({ page: p }) => {
      const errs: string[] = [];
      p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      p.on('pageerror', (e) => errs.push(String(e)));
      await p.goto(page, { waitUntil: 'load' });
      await p.waitForTimeout(2500);
      expect(errs).toEqual([]);
    });
  }
});

test('every internal link resolves to a page that exists', async ({ page }) => {
  const seen = new Set<string>();
  for (const src of PAGES) {
    await page.goto(src);
    const hrefs = await page.$$eval('a[href]', (as) =>
      as.map((a) => a.getAttribute('href')!).filter((h) => !/^(https?:|mailto:|#)/.test(h))
    );
    for (const h of hrefs) seen.add(h.split('#')[0]);
  }
  for (const target of [...seen]) {
    if (!target) continue;
    const res = await page.request.get(target);
    expect(res.status(), `${target} should exist`).toBeLessThan(400);
  }
});

test('nothing in the critical path comes from another origin', async ({ page }) => {
  const foreign: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.hostname !== '127.0.0.1' && u.protocol !== 'data:' && u.protocol !== 'blob:') foreign.push(r.url());
  });
  for (const p of PAGES) {
    await page.goto(p, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
  }
  expect(foreign).toEqual([]);
});
