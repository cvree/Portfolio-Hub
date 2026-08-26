import { test, expect, Page } from '@playwright/test';

/* THE CARD.
   ---------------------------------------------------------------------------
   The contact page is an object with two faces, and both of them carry real
   content. Turning it over is an enhancement and never a gate, so the thing
   worth testing is not the rotation — it is that no route out of this page can
   ever end up in the document but out of reach. */

const ROUTES = [
  { k: /email/i, href: 'mailto:connor.eppolito803@myci.csuci.edu' },
  { k: /linkedin/i, href: 'https://www.linkedin.com/in/connor-eppolito-2aba63310/' },
  { k: /github/i, href: 'https://github.com/cvree' },
  { k: /résumé/i, href: 'resume.html' },
];

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-vcard-flip]')).toBeVisible();
}

/* --- 1. no JavaScript: two panels, both complete -------------------------- */

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('both faces are laid out and both are readable', async ({ page }) => {
    await page.goto('contact.html');
    await expect(page.locator('[data-vc-face="front"]')).toBeVisible();
    await expect(page.locator('[data-vc-face="back"]')).toBeVisible();
    for (const sel of ['.vc__name', '.vc__role', '.vc__foot', '.vc__h']) {
      const o = await page.locator(sel).evaluate((e) => Number(getComputedStyle(e).opacity));
      expect(o, `${sel} must be legible with no script`).toBeGreaterThan(0.99);
    }
  });

  test('every route out is an ordinary link that works', async ({ page }) => {
    await page.goto('contact.html');
    for (const r of ROUTES) {
      const a = page.locator('.vc__ways a').filter({ hasText: r.k });
      await expect(a).toHaveAttribute('href', r.href);
      await expect(a).toBeVisible();
    }
  });

  test('no control is on screen that could not work', async ({ page }) => {
    await page.goto('contact.html');
    expect(await page.locator('[data-vcard-flip]:visible').count()).toBe(0);
  });

  test('nothing is left inert by a script that never ran', async ({ page }) => {
    await page.goto('contact.html');
    const blocked = await page.$$eval('[data-vc-face]', (els) =>
      els.filter((e) => e.hasAttribute('inert') || e.getAttribute('aria-hidden') === 'true').length
    );
    expect(blocked).toBe(0);
  });
});

/* --- 2. the turn ----------------------------------------------------------- */

test.describe('turning it over', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    await page.goto('contact.html', { waitUntil: 'load' });
    await ready(page);
  });

  test('the control says which way up the card is, and what it will do next', async ({ page }) => {
    const btn = page.locator('[data-vcard-flip]');
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(btn).toContainText(/turn the card over/i);

    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(btn).toContainText(/turn the card back/i);

    await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    await expect(btn).toContainText(/turn the card over/i);
  });

  test('the face turned away leaves the tab order with the pixels', async ({ page }) => {
    /* Front up: the back's links are in the document and must not be
       focusable. A link you cannot see but can tab to is worse than no link. */
    const reachable = async () =>
      page.$$eval('[data-vc-face="back"] a[href]', (as) =>
        as.filter((a) => {
          const face = a.closest('[data-vc-face]')!;
          return !(face as HTMLElement & { inert?: boolean }).inert &&
                 a.getAttribute('tabindex') !== '-1';
        }).length
      );

    expect(await reachable()).toBe(0);
    await expect(page.locator('[data-vc-face="back"]')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('[data-vc-face="front"]')).toHaveAttribute('aria-hidden', 'false');

    await page.locator('[data-vcard-flip]').click();
    await expect(page.locator('[data-vc-face="front"]')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('[data-vc-face="back"]')).toHaveAttribute('aria-hidden', 'false');
    await expect.poll(reachable, { timeout: 3000 }).toBe(4);
  });

  test('the keyboard can turn it and then walk straight into it', async ({ page }) => {
    const btn = page.locator('[data-vcard-flip]');
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    /* Focus follows the card, once the face is actually facing the visitor. */
    await expect
      .poll(() => page.evaluate(() => (document.activeElement as HTMLElement)?.textContent || ''), { timeout: 4000 })
      .toMatch(/connor\.eppolito803/i);
  });

  test('every route is a target a thumb can hit', async ({ page }) => {
    await page.locator('[data-vcard-flip]').click();
    await page.waitForTimeout(900);
    const small = await page.$$eval('.vc__ways a, [data-vcard-flip]', (els) =>
      els.map((e) => ({ h: e.getBoundingClientRect().height, t: (e.textContent || '').trim().slice(0, 24) }))
         .filter((x) => x.h < 44)
    );
    expect(small).toEqual([]);
  });
});

/* --- 3. it is an object, not two rectangles ------------------------------- */

test('the card has a front, a back, four edges and a thickness', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto('contact.html', { waitUntil: 'load' });
  await ready(page);

  await expect(page.locator('.vc__edge')).toHaveCount(4);
  const preserved = await page.locator('.vc__card').evaluate((e) => getComputedStyle(e).transformStyle);
  expect(preserved).toBe('preserve-3d');

  /* Both faces hide their own back, which is what stops the reversed type of
     one showing through the other. */
  for (const f of ['front', 'back']) {
    const bf = await page.locator(`[data-vc-face="${f}"]`).evaluate((e) => getComputedStyle(e).backfaceVisibility);
    expect(bf).toBe('hidden');
  }

  /* And the pixels are actually there. */
  const painted = await page.locator('.vc__card').screenshot();
  expect(painted.byteLength).toBeGreaterThan(6000);
});

/* --- 4. stillness ---------------------------------------------------------- */

test.describe('with prefers-reduced-motion: reduce', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('the turn is instant, and loses nothing on the way', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 980 });
    await page.goto('contact.html', { waitUntil: 'load' });
    await ready(page);

    /* The card names no property to transition at all — the site-wide rule
       that collapses every duration under reduce would hide a card that still
       claimed one, so this asserts the card's own answer rather than that. */
    const eased = await page.locator('.vc__card').evaluate((e) => getComputedStyle(e).transitionProperty);
    expect(eased).toBe('none');

    await page.locator('[data-vcard-flip]').click();
    await expect(page.locator('[data-vcard-flip]')).toHaveAttribute('aria-pressed', 'true');
    for (const r of ROUTES) {
      await expect(page.locator('.vc__ways a').filter({ hasText: r.k })).toHaveAttribute('href', r.href);
    }
  });
});

/* --- 5. the practical bits are still the practical bits ------------------- */

test('the page still states where he is, when he is free and what he wants', async ({ page }) => {
  await page.goto('contact.html', { waitUntil: 'load' });
  const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  for (const fact of [
    'Camarillo, California',
    'December 2026',
    'Health informatics',
  ]) {
    expect(text.toLowerCase()).toContain(fact.toLowerCase());
  }
});
