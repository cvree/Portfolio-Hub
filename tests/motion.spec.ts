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

  test('the home hero is a composed frame, not an empty stage', async ({ page }) => {
    await page.goto('index.html');
    const iris = page.locator('.ap__iris img');
    await expect(iris).toBeVisible();
    const box = await iris.boundingBox();
    expect(box!.height).toBeGreaterThan(180);
    /* The blades are one thing that could cover the evidence; the aperture's
       own clip is the other, and a clipped element still reports a box and
       still counts as visible, so it has to be asserted directly. */
    expect(await page.locator('.ap__blade:visible').count()).toBe(0);
    const clip = await page.locator('.ap__iris').evaluate((e) => getComputedStyle(e).clipPath);
    expect(clip).not.toMatch(/inset\(\s*(?:[1-9]\d|100)/);

    /* And, finally, that the pixels are actually there: a fully clipped frame
       is indistinguishable from an empty one in the DOM but not on screen. */
    const painted = await page.locator('.ap__frame').screenshot();
    expect(painted.byteLength).toBeGreaterThan(9000);
  });

  test('the résumé and contact routes work', async ({ page }) => {
    await page.goto('index.html');
    await page.getByRole('link', { name: /download résumé/i }).click();
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
    page.on('request', (r) => /vendor\/(aperture|atmosphere)\.js/.test(r.url()) && asked.push(r.url()));
    await page.goto('index.html', { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    expect(asked).toEqual([]);
    expect(await page.locator('canvas').count()).toBe(0);
  });

  for (const p of ['index.html', 'spellbomb.html', 'health-journal.html', 'manifester.html']) {
    test(`${p}: every section is in its final state`, async ({ page }) => {
      await page.goto(p, { waitUntil: 'load' });
      await page.waitForTimeout(900);
      const unfinished = await page.$$eval('main [data-rise], main [data-motion]', (els) =>
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

test.describe('the hardware gate', () => {
  test('a 390px viewport never gets a canvas', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    expect(await page.locator('canvas').count()).toBe(0);
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

  test('a device that reports no memory at all never gets a canvas', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => undefined });
    });
    await page.goto('index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    expect(await page.locator('canvas').count()).toBe(0);
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
