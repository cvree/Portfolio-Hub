import { test, expect } from '@playwright/test';
import { PAGES } from './pages';

/* Section 10 of the design system — THE ANSWER: every action gets one, and it
   is proportional to the action. These are the answers. */

test.describe('the receipt', () => {
  test.beforeEach(async ({ page, context }) => {
    /* Chromium is the only engine Playwright can grant the clipboard to, so it
       is the only engine where what actually landed on the clipboard can be
       read back. Everywhere else the assertion is the one that matters to a
       visitor anyway: the site said what happened. */
    await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('every heading on a document is a place that can be linked to', async ({ page }) => {
    await page.goto('spellbomb.html', { waitUntil: 'load' });
    const heads = await page.$$eval('main h2, main h3', (hs) =>
      hs.filter((h) => !h.classList.contains('vh')).map((h) => h.id)
    );
    expect(heads.length).toBeGreaterThan(6);
    expect(heads.filter((id) => !id)).toEqual([]);
  });

  test('the anchor hands over the link, and says what happened', async ({ page, browserName }) => {
    await page.goto('about.html', { waitUntil: 'load' });
    const anchor = page.locator('main .anchor').first();
    await expect(anchor).toHaveCount(1);
    await anchor.click({ force: true });

    /* Something was said, in both places, either way. The live region is
       cleared and refilled a frame later — that is what makes two identical
       replies in a row announce twice — so it is polled rather than read at
       whatever moment this line happens to run. */
    await expect(page.locator('.toast')).toHaveCount(1);
    await expect
      .poll(async () => ((await page.locator('[data-announce]').textContent()) || '').length)
      .toBeGreaterThan(4);
    /* And the address bar is the anchor's, so the link is copyable by hand. */
    expect(page.url()).toMatch(/about\.html#/);

    if (browserName === 'chromium') {
      await expect(page.locator('[data-announce]')).toHaveText(/copied/i);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/about\.html#/);
    }
  });

  test('the address on the card goes to the clipboard', async ({ page, browserName }) => {
    await page.goto('contact.html', { waitUntil: 'load' });
    await page.locator('.vc__copy').click();
    /* The control's own state first: it is the shortest-lived of the three
       answers, and asserting it after two round trips is asserting it after it
       has correctly gone. */
    await expect(page.locator('.vc__copy')).toHaveClass(/copied/);
    await expect(page.locator('.toast')).toHaveCount(1);

    if (browserName === 'chromium') {
      await expect(page.locator('[data-announce]')).toHaveText('Email address copied');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('@');
    }
    /* And it takes itself off again. */
    await expect(page.locator('.vc__copy')).not.toHaveClass(/copied/, { timeout: 4000 });
  });

  test('a reply takes itself away, and never stacks up', async ({ page }) => {
    await page.goto('contact.html', { waitUntil: 'load' });
    for (let i = 0; i < 5; i++) {
      await page.locator('.vc__copy').click();
      await page.waitForTimeout(120);
    }
    expect(await page.locator('.toast').count()).toBeLessThanOrEqual(3);
    await page.waitForTimeout(4200);
    await expect(page.locator('.toast')).toHaveCount(0);
  });

  test('the rail is decoration for anybody who can see it', async ({ page }) => {
    /* The same words go out through the announcer at the same moment, and a
       screen reader that heard both would hear everything twice. */
    await page.goto('contact.html', { waitUntil: 'load' });
    await expect(page.locator('[data-toasts]')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('[data-announce]')).toHaveAttribute('aria-live', 'polite');
  });
});

test.describe('the return', () => {
  test('is not on screen until there is something to return from', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('about.html', { waitUntil: 'load' });
    const dial = page.locator('[data-totop]');
    const shown = () => dial.evaluate((e) => Number(getComputedStyle(e).opacity));

    await expect(dial).toHaveAttribute('aria-hidden', 'true');
    expect(await shown()).toBeLessThan(0.05);

    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
    await expect(dial).toHaveAttribute('aria-hidden', 'false');
    /* Polled: it arrives over 240 ms, and the assertion is that it arrives —
       not that it had already arrived by whatever moment this line ran. */
    await expect.poll(shown).toBeGreaterThan(0.9);
  });

  test('reports how far down the document is behind you', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('about.html', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect
      .poll(() =>
        page.locator('[data-totop]').evaluate((e) => Number(e.style.getPropertyValue('--read-pct')))
      )
      .toBeGreaterThan(95);
  });

  test('goes back to the top, and takes focus with it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('about.html', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
    await page.waitForTimeout(400);
    await page.locator('[data-totop]').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(4);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('main');
  });
});

test.describe('the chapters', () => {
  test('a long document carries its own contents', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('about.html', { waitUntil: 'load' });
    const rail = page.locator('.chapters');
    await expect(rail).toBeVisible();
    expect(await page.locator('.chapters__a').count()).toBeGreaterThanOrEqual(4);
    await expect(rail).toHaveAttribute('aria-label', /Sections/);
  });

  test('it reports which section you are in, and never more than one', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('experience.html', { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const current = () => page.locator('.chapters__a[aria-current="true"]').textContent();
    const first = await current();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.7));
    await expect.poll(current).not.toBe(first);
    await expect(page.locator('.chapters__a[aria-current="true"]')).toHaveCount(1);
  });

  test('the home page keeps the one spine it already has', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await expect(page.locator('.chapters')).toHaveCount(0);
    await expect(page.locator('[data-theatre]')).toHaveCount(1);
  });

  test('no chapter label runs its own words together', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('about.html', { waitUntil: 'load' });
    for (const label of await page.locator('.chapters__label').allTextContents()) {
      expect(label, `"${label}" has a word joined to another`).not.toMatch(/[a-z][A-Z]/);
    }
  });
});

test.describe('stillness', () => {
  test('it still reports; it simply does not move', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto('about.html', { waitUntil: 'load' });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    /* Nothing is withheld: the dial still appears and still reports. */
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 3));
    await page.waitForTimeout(400);
    await expect(page.locator('[data-totop]')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('.chapters__a[aria-current="true"]')).toHaveCount(1);

    /* And nothing animates. */
    await page.keyboard.press('/');
    await expect(page.locator('.cons__box')).toBeVisible();
    const anim = await page.locator('.cons__box').evaluate((e) => getComputedStyle(e).animationName);
    expect(anim, 'the panel appears rather than arriving').toBe('none');
  });
});

test.describe('the magnets', () => {
  test('travel is four pixels, and it comes back', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    const btn = page.locator('.sig__actions .btn--primary');
    await expect(btn).toHaveAttribute('data-magnet', '');
    /* The hero is still composing itself for the first second and a half. */
    await page.waitForTimeout(1900);

    const travel = () =>
      btn.evaluate((e) => {
        const t = getComputedStyle(e).translate;
        if (!t || t === 'none') return 0;
        const [x, y] = t.split(/\s+/).map(parseFloat);
        return Math.hypot(x || 0, y || 0);
      });

    /* The pointer event is dispatched at a known point rather than driven with
       the synthetic cursor. What is under test is the handler and the rule it
       feeds — not whether a cursor aimed at a box measured a moment ago still
       lands on a hero that is settling. */
    const box = (await btn.boundingBox())!;
    await btn.dispatchEvent('pointermove', {
      clientX: box.x + box.width - 4,
      clientY: box.y + box.height - 4,
      bubbles: true,
    });

    /* Polled through the 260 ms it takes to travel, rather than measured at one
       arbitrary moment inside it. */
    await expect.poll(travel).toBeGreaterThan(0.2);
    /* The law says four pixels. Four pixels is what it is. */
    expect(await travel()).toBeLessThanOrEqual(4 * Math.SQRT2 + 0.01);

    /* And it lets go the moment the pointer leaves. */
    await btn.dispatchEvent('pointerleave', { bubbles: false });
    await expect.poll(travel).toBeLessThan(0.5);
  });
});

test('the answer layer adds nothing to the critical path', async ({ page }) => {
  const asked: string[] = [];
  page.on('request', (r) => asked.push(r.url()));
  for (const p of PAGES.slice(0, 3)) {
    await page.goto(p, { waitUntil: 'load' });
    await page.waitForTimeout(1400);
  }
  expect(asked.filter((u) => /console\.js|search\.json/.test(u))).toEqual([]);
});
