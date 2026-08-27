import { test, expect } from '@playwright/test';

/* PROJECTS IS A PLACE, NOT A PAGE.
   ---------------------------------------------------------------------------
   There is no work.html any more, only the old URL kept alive as a redirect and
   a section of the home page that everything labelled Projects points at. What
   is worth testing is not the animation — it is that every route still arrives,
   that arriving is never a prerequisite for reading, and that the page is handed
   straight back the moment the visitor touches anything. */

const top = (page: import('@playwright/test').Page) =>
  page.evaluate(() => window.scrollY);

test('every route labelled Projects goes to the same place on the home page', async ({ page }) => {
  for (const from of ['index.html', 'resume.html', 'contact.html', 'spellbomb.html']) {
    await page.goto(from, { waitUntil: 'load' });
    const nav = page.locator('.masthead nav[aria-label="Primary"] a', { hasText: 'Projects' });
    await expect(nav, from).toHaveAttribute('href', 'index.html#work');
    const foot = page.locator('.foot a', { hasText: 'Projects' });
    await expect(foot, from).toHaveAttribute('href', 'index.html#work');
  }
});

test('the old projects URL still lands somewhere real', async ({ page }) => {
  await page.goto('work.html');
  await page.waitForURL(/index\.html#work$/, { timeout: 15000 });
  await expect(page.locator('#work')).toBeVisible();
});

/* Where #work has to end up: on screen, below the sticky masthead rather than
   underneath it, and near the top of what is left. */
async function landed(page: import('@playwright/test').Page) {
  const box = await page.locator('#work').boundingBox();
  const mast = await page.locator('.masthead').boundingBox();
  if (!box || !mast) return null;
  return box.y >= mast.height - 1 && box.y < 260;
}

test('arriving on the fragment comes to rest on the section, clear of the masthead', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html#work', { waitUntil: 'load' });
  /* The glide is bounded, so this resolves well inside its timeout — what is
     being asserted is where the page stops, not how long it takes. */
  await expect.poll(() => landed(page), { timeout: 8000 }).toBe(true);
});

test('a same-page link travels, and any input hands the page straight back', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });

  const destination = await page
    .locator('#w-paper-animator')
    .evaluate((el) => {
      const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      const own = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      return el.getBoundingClientRect().top + window.scrollY - pad - own;
    });

  /* The key goes in with nothing awaited between it and the click, because the
     whole glide is over inside about a second and a poll in between would be
     racing it. */
  await page.locator('.th__rail a[data-rail="paper-animator"]').click();
  await page.keyboard.press('ArrowUp');
  await expect(page).toHaveURL(/#w-paper-animator$/);

  await page.waitForTimeout(200);
  const stolen = await top(page);
  await page.waitForTimeout(1600);
  const rest = await top(page);
  /* The glide is over — not paused — so nothing moved the page after the key
     but the key, and it never resumed its own journey. */
  expect(Math.abs(rest - stolen)).toBeLessThan(120);
  expect(Math.abs(rest - destination)).toBeGreaterThan(400);
});

test('a same-page link that is left alone does arrive', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await page.locator('.th__rail a[data-rail="paper-animator"]').click();
  await expect
    .poll(async () => {
      const box = await page.locator('#w-paper-animator').boundingBox();
      const mast = await page.locator('.masthead').boundingBox();
      return !!box && !!mast && box.y >= mast.height - 1 && box.y < 260;
    }, { timeout: 8000 })
    .toBe(true);
});

test('the fragment works with no script at all', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('index.html#work', { waitUntil: 'load' });
  /* No script: `scroll-behavior:smooth` and `scroll-padding-top` do the whole
     job, and they come to rest in exactly the same place. */
  await expect.poll(() => landed(page), { timeout: 8000 }).toBe(true);
  await ctx.close();
});

test('the smaller pieces came with it, and the status key that explains them', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  const section = page.locator('#work');
  await expect(section.locator('.th__key dt')).toHaveCount(4);
  await expect(section.locator('.cards .card')).toHaveCount(8);
  await expect(section.getByRole('link', { name: 'Story Atlas' })).toHaveAttribute(
    'href',
    'https://github.com/cvree/Story-Atlas'
  );
});
