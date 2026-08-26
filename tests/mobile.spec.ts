import { test, expect } from '@playwright/test';
import { PAGES } from './pages';

/* Mobile is art-directed, not downgraded. These are the promises that a phone
   in one hand depends on. */

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

for (const p of PAGES) {
  test(`${p}: every control is at least 44 px tall`, async ({ page }) => {
    await page.goto(p, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);

    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a,button,summary')]
        .map((el) => {
          const e = el as HTMLElement;
          const r = e.getBoundingClientRect();
          // A link inside a sentence is exempt: padding it to 44 px would break
          // the leading of the paragraph around it.
          const inline =
            !!e.closest('p,li,dd') &&
            getComputedStyle(e).display.startsWith('inline') &&
            !e.classList.contains('btn');
          // A project title's ::after covers the whole card, so the card is the
          // target and the link's own box is not the hit area.
          const card = !!e.closest('.work__title, .wk__t');
          return { h: r.height, text: (e.textContent || '').trim().slice(0, 30), skip: e.classList.contains('skip'), inline, card };
        })
        .filter((x) => x.h > 0 && x.h < 44 && !x.skip && !x.inline && !x.card)
        .map((x) => `${x.text} (${Math.round(x.h)}px)`)
    );
    expect(small).toEqual([]);
  });
}

test('the whole project card is one tap target', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('work.html', { waitUntil: 'load' });
  const card = page.locator('.work').first();
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;
  // Tapping anywhere in the card row navigates, because the title's ::after
  // covers it — so a thumb landing on the blurb goes to the case study.
  await card.click({ position: { x: box.width / 2, y: box.height - 24 } });
  /* Generous, because what this test is about is the hit area and nothing
     else. How fast the navigation completes is transitions.spec.ts's
     assertion, and on a CI machine software-rasterising the atmosphere plane
     in every one of a dozen parallel workers it is not five seconds. */
  await expect(page).toHaveURL(/spellbomb\.html$/, { timeout: 45000 });
});

test('landscape keeps the menu reachable and the page within its width', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('index.html', { waitUntil: 'load' });
  await page.locator('[data-menu] summary').click();
  await expect(page.locator('.navmob__panel').getByRole('link', { name: 'Projects' })).toBeVisible();
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(over).toBeLessThanOrEqual(0);
});

test('turning the system preference on mid-visit stops the renderer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await expect.poll(() => page.locator('canvas').count(), { timeout: 12000 }).toBe(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.locator('canvas').count(), { timeout: 6000 }).toBe(0);
});
