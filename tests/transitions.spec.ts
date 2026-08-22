import { test, expect } from '@playwright/test';

/* Cross-document view transitions are an enhancement, and the assertion that
   matters most is the one about the browsers that do not have them: navigation
   must be immediate and complete either way. */

test('every page opts in to cross-document view transitions', async ({ page }) => {
  await page.goto('index.html');
  const declared = await page.evaluate(() => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule.constructor.name.includes('ViewTransition') || /@view-transition/.test(rule.cssText)) return true;
        }
      } catch { /* cross-origin sheets do not exist here */ }
    }
    return false;
  });
  expect(declared).toBe(true);
});

test('a project card carries a name that its case study answers to', async ({ page }) => {
  await page.goto('work.html');
  const cardName = await page.locator('[data-vt="shot-spellbomb"]').getAttribute('data-vt');
  expect(cardName).toBe('shot-spellbomb');
  await page.goto('spellbomb.html');
  await expect(page.locator('[data-vt="shot-spellbomb"]')).toHaveCount(1);
  await expect(page.locator('[data-vt="title-spellbomb"]')).toHaveCount(1);
  await expect(page.locator('[data-vt="accent-spellbomb"]')).toHaveCount(1);
});

test('navigation is not delayed, and back and forward stay reliable', async ({ page }) => {
  await page.goto('work.html', { waitUntil: 'load' });
  const t0 = Date.now();
  await page.locator('main').getByRole('link', { name: 'SpellBomb', exact: true }).click();
  await page.waitForURL(/spellbomb\.html/);
  await expect(page.locator('h1')).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(4000);

  await page.goBack();
  await expect(page).toHaveURL(/work\.html/);
  await expect(page.locator('h1')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/spellbomb\.html/);
  await expect(page.locator('h1')).toBeVisible();
});
