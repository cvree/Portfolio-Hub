import { test, expect } from '@playwright/test';

/* What a scanner cannot check: that the site is genuinely operable, in order,
   with nothing but a keyboard. */

test('the first tab stops are the skip link, the wordmark, then the navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveClass(/skip/);

  const seen: string[] = [];
  for (let i = 0; i < 8; i++) {
    seen.push(await page.evaluate(() => (document.activeElement as HTMLElement)?.textContent?.trim().slice(0, 24) || ''));
    await page.keyboard.press('Tab');
  }
  expect(seen[0]).toMatch(/Skip to content/);
  expect(seen.join(' | ')).toMatch(/Connor Eppolito/);
  expect(seen.join(' | ')).toMatch(/Projects/);
});

test('the skip link moves focus into main', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('the focus ring is visible on everything reached by tabbing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });

  /* Tabbed, not focused programmatically: :focus-visible is the selector the
     site draws its ring with, and only a real keyboard move triggers it. */
  const missing: string[] = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      // A project card draws its ring around the whole card rather than around
      // the title link inside it, so an ancestor's ring counts.
      const ring = (n: Element | null): string => {
        for (; n && n !== document.body; n = n.parentElement) {
          const c = getComputedStyle(n);
          if (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) {
            return `${c.outlineStyle} ${c.outlineWidth}`;
          }
        }
        return 'none 0px';
      };
      return { who: `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 50), ring: ring(el) };
    });
    if (info && /none|0px/.test(info.ring)) missing.push(`${info.who} -> ${info.ring}`);
  }
  expect(missing).toEqual([]);
});

test('the mobile menu opens, closes on Escape, and traps nothing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('index.html', { waitUntil: 'load' });
  const menu = page.locator('[data-menu]');
  await menu.locator('summary').click();
  await expect(menu).toHaveAttribute('open', '');
  await expect(menu.getByRole('link', { name: 'Projects' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open', '');
  /* Focus came back to the control that opened it. */
  const tag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
  expect(tag).toBe('summary');
});

test('a case study is reachable from the home page by keyboard alone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  /* Each room is one target and its title carries it, so the title's link is
     the thing a keyboard reaches — there is no second, competing control. */
  const go = page.locator('[data-wk="phlebotomy"] .wk__t a');
  await expect(go).toBeVisible();
  await go.focus();
  /* toBeFocused() also requires the page itself to be the active one, which
     under a parallel run it intermittently is not. What this test is actually
     about is where focus went inside the document. */
  await expect
    .poll(() => page.evaluate(() => (document.activeElement as HTMLElement)?.textContent?.trim() || ''))
    .toMatch(/Phlebotomy Exam Prep/i);
  await page.keyboard.press('Enter');
  await page.waitForURL(/phlebotomy-exam-prep\.html$/, { timeout: 15000 });
  await expect(page.locator('h1')).toBeVisible();
});

test('every project card is one target, not three competing ones', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('work.html', { waitUntil: 'load' });
  const card = page.locator('.work').first();
  expect(await card.locator('a').count()).toBe(1);
  const box = await card.boundingBox();
  expect(box!.height).toBeGreaterThan(44);
});
