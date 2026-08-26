import { test, expect } from '@playwright/test';
import { PAGES } from './pages';

/* The three states this site promises: with no script, with reduced motion,
   and on a device that does not qualify for the cinematic layer. In all three
   the page must be complete — not a stripped-down version of itself. */

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  for (const p of PAGES) {
    test(`${p}: renders complete, navigable content`, async ({ page }) => {
      await page.goto(p);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav[aria-label="Primary"] a').first()).toBeVisible();

      /* Nothing may be left hidden by a class the absent script would have set,
         and no canvas or loading state may survive. */
      const hidden = await page.$$eval('main [data-rise], main [data-motion]', (els) =>
        els.filter((e) => {
          const c = getComputedStyle(e);
          return Number(c.opacity) < 0.99 || c.visibility === 'hidden' || c.display === 'none';
        }).length
      );
      expect(hidden).toBe(0);
      expect(await page.locator('canvas').count()).toBe(0);

      const shots = await page.locator('main img').count();
      if (shots) await expect(page.locator('main img').first()).toBeVisible();
    });
  }

  test('the home hero is a standing projection, not an empty stage', async ({ page }) => {
    await page.goto('index.html');
    const holo = page.locator('.holo');
    await expect(holo).toBeVisible();
    const box = await holo.boundingBox();
    expect(box!.height).toBeGreaterThan(280);

    /* A clipped element still reports a box and still counts as visible, so
       the clip has to be asserted directly. */
    const clip = await holo.evaluate((e) => getComputedStyle(e).clipPath);
    expect(clip).not.toMatch(/inset\(\s*(?:[1-9]\d|100)/);

    /* And, finally, that the pixels are actually there: an object that never
       materialised is indistinguishable from a standing one in the DOM but not
       on screen. */
    const painted = await holo.screenshot();
    expect(painted.byteLength).toBeGreaterThan(4000);
  });

  test('the résumé and contact routes work', async ({ page }) => {
    await page.goto('index.html');
    await page.getByRole('link', { name: /view résumé/i }).click();
    await expect(page).toHaveURL(/resume\.html$/);
    await expect(page.locator('h1')).toContainText('Connor Eppolito');
  });
});

test.describe('with prefers-reduced-motion: reduce', () => {
  /* Set explicitly rather than through the fixture, so the emulation is applied
     before the first navigation on every browser this suite runs in. */
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('no shader is created, and no cinematic bundle is fetched', async ({ page }) => {
    const asked: string[] = [];
    page.on('request', (r) => /vendor\/(pulse|atmosphere)\.js/.test(r.url()) && asked.push(r.url()));
    await page.goto('index.html', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    expect(asked).toEqual([]);
    expect(await page.locator('canvas').count()).toBe(0);
  });

  for (const p of ['index.html', 'spellbomb.html', 'health-journal.html', 'manifester.html']) {
    test(`${p}: every section is in its final state`, async ({ page }) => {
      await page.goto(p, { waitUntil: 'load' });
      await page.waitForTimeout(900);
      const unfinished = await page.$$eval('main [data-rise], main [data-motion], main [data-scene]', (els) =>
        els
          .filter((e) => {
            const c = getComputedStyle(e);
            return Number(c.opacity) < 0.99 || (c.transform !== 'none' && c.transform !== 'matrix(1, 0, 0, 1, 0, 0)');
          })
          .map((e) => (e as HTMLElement).className)
      );
      expect(unfinished).toEqual([]);
    });
  }
});

/* THE GATES.
   ---------------------------------------------------------------------------
   These are deliberately looser than they were, and the change is the point of
   the redesign rather than an accident of it. The atmosphere used to be built,
   compiled and thrown away for one screenful behind one hero, and only for a
   visitor with a fine pointer, a viewport of at least 1000 px and a browser
   that reports four gigabytes or more of memory — which is to say: no phone,
   no tablet, and no Safari at all, because Safari does not implement
   `deviceMemory`. It is now the room every page is read in, so the gates that
   remain are the ones that mean something.

   Reduced motion and Save-Data are somebody telling you not to. No WebGL is
   the browser telling you it cannot. A device that reports its memory and
   reports less than four gigabytes is telling you it is small. Silence is not
   any of those, and is no longer read as one. */

test.describe('the gates', () => {
  test('a phone gets the plane, because it is the same room', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('index.html', { waitUntil: 'load' });
    await expect.poll(() => page.locator('canvas').count(), { timeout: 12000 }).toBe(1);
  });

  test('every page gets the plane, not only the one with the hero', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const p of ['work.html', 'about.html', 'contact.html', 'spellbomb.html']) {
      await page.goto(p, { waitUntil: 'load' });
      await expect.poll(() => page.locator('canvas').count(), { timeout: 12000 }).toBe(1);
      /* And it is mounted on the fixed atmosphere plane rather than inside a
         section, so it survives the whole scroll. */
      expect(await page.locator('.atmos > canvas.atmos__canvas').count(), p).toBe(1);
    }
  });

  test('Save-Data never gets a canvas or a cinematic bundle', async ({ browser }) => {
    const ctx = await browser.newContext({ extraHTTPHeaders: { 'Save-Data': 'on' } });
    const page = await ctx.newPage();
    /* The browser API is what the site actually reads, so it is what the test
       has to fake — the header alone would not exercise the gate. */
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) });
    });
    const asked: string[] = [];
    page.on('request', (r) => /vendor\//.test(r.url()) && asked.push(r.url()));
    await page.goto('/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    expect(asked).toEqual([]);
    expect(await page.locator('canvas').count()).toBe(0);
    await ctx.close();
  });

  test('a device reporting under 4 GB never gets a canvas', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
    });
    await page.goto('index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    expect(await page.locator('canvas').count()).toBe(0);
  });

  test('a device that reports no memory at all is not treated as a small one', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => undefined });
    });
    await page.goto('index.html', { waitUntil: 'load' });
    await expect.poll(() => page.locator('canvas').count(), { timeout: 12000 }).toBe(1);
  });

  test('no WebGL, no plane, and the page is untouched by its absence', async ({ page }) => {
    await page.addInitScript(() => {
      const real = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
        if (String(kind).startsWith('webgl') || String(kind) === 'experimental-webgl') return null;
        return real.call(this, kind, ...rest);
      } as typeof real;
    });
    await page.goto('index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    expect(await page.locator('canvas').count()).toBe(0);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.holo__slice')).toHaveCount(18);
  });
});

test.describe('the motion control', () => {
  test('has an accessible name, a pressed state, and actually stops the shader', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    const btn = page.locator('.masthead__in > [data-motion-toggle]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAccessibleName(/reduce motion/i);
    await expect(btn).toHaveAttribute('aria-pressed', 'false');

    await page.waitForTimeout(2600);
    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await page.waitForTimeout(500);
    expect(await page.locator('canvas').count()).toBe(0);

    /* And it is remembered, without ever overriding the operating system. */
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await page.waitForTimeout(2600);
    expect(await page.locator('canvas').count()).toBe(0);
  });
});
