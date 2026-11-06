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
  await expect(section.locator('.th__key dt')).toHaveText(['Live', 'In progress', 'Experiment', 'Updates soon']);
  await expect(section.locator('.tiles .tile')).toHaveCount(13);
  /* Everything that runs carries a capture of itself running and its current
     version. What has only a name gets a stamp, not a capture pretending. */
  await expect(section.locator('.tiles .tile__shot img')).toHaveCount(9);
  await expect(section.locator('.tiles .tile--soon .soon__stamp')).toHaveCount(4);
  await expect(section.locator('.tiles .tile__v')).toHaveCount(13);
  await expect(section.getByRole('link', { name: /^Story Atlas \(opens/ })).toHaveAttribute(
    'href',
    'https://cvree.github.io/Story-Atlas/'
  );
});

test('in progress wears the tape, and the tape is never the only word for it', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  const wip = page.locator('#work .tile[data-status~="building"]');
  const n = await wip.count();
  expect(n).toBe(3);
  /* the six rooms are finished enough to go without it */
  await expect(page.locator('#work .wk .tape')).toHaveCount(0);
  await expect(page.locator('#work')).not.toContainText(/wet paint/i);
  for (let i = 0; i < n; i++) {
    const item = wip.nth(i);
    /* the tape is decoration: hidden from assistive technology ... */
    for (const t of await item.locator('.tape').all()) await expect(t).toHaveAttribute('aria-hidden', 'true');
    /* ... and the status is real text beside it */
    await expect(item.locator('.chip--dev')).toHaveText(/In progress/);
  }
});

test('every running tile opens its live site in a new tab', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  const go = page.locator('#work .tile .tile__go[href^="https://cvree.github.io/"]');
  expect(await go.count()).toBe(8);
  for (const a of await go.all()) {
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAccessibleName(/\(opens the live site in a new tab\)$/);
  }
});

test('the shelf narrows with four toggle buttons and says what it did', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  const bar = page.locator('[data-shelf-bar]');
  await expect(bar).toBeVisible();
  const all = bar.getByRole('button', { name: /Everything/ });
  await expect(all).toHaveAttribute('aria-pressed', 'true');

  await bar.getByRole('button', { name: /In progress/ }).click();
  await expect(page.locator('.tiles .tile:visible')).toHaveCount(3);
  await expect(page.locator('[data-shelf-status]')).toHaveText('Showing 3 projects in progress.');
  await expect(bar.getByRole('button', { name: /In progress/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');

  await bar.getByRole('button', { name: /Updates soon/ }).click();
  await expect(page.locator('.tiles .tile:visible')).toHaveCount(4);

  await bar.getByRole('button', { name: /Live/ }).click();
  await expect(page.locator('.tiles .tile:visible')).toHaveCount(8);

  await all.click();
  await expect(page.locator('.tiles .tile:visible')).toHaveCount(13);
});

test('with no script, the shelf is simply all of it and offers no buttons that do nothing', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('index.html', { waitUntil: 'load' });
  await expect(page.locator('[data-shelf-bar]')).toBeHidden();
  await expect(page.locator('.tiles .tile:visible')).toHaveCount(13);
  await ctx.close();
});

test('every project on the home page states the version it is at', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  /* Six rooms, nine running tiles, and one version on each — the number a visitor
     needs to know whether what they are reading about is what is deployed. */
  const versions = await page
    .locator('#work .wk__meta .chip, #work .tile__v')
    .evaluateAll((els) => els.map((e) => (e.textContent || '').trim()).filter((t) => /^v?\d+\.\d+/.test(t)));
  expect(versions).toEqual([
    'v9.3.0', 'v1.39.0', 'v0.1.0', 'v1.0.0', 'v1.0.1', 'v0.1.0',
    'v2.31.0', 'v0.2.0-preview', 'v1.0.0', 'v1.0.0', 'v1.0.0', 'v0.1.0', 'v1.0.0', 'v1.1.0',
  ]);
});
