import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { PAGES } from './pages';

/* The console is the one thing on this site that can send a visitor somewhere
   that does not exist, because it is the one thing that navigates from a list
   rather than from a link somebody wrote. So the first test here is that every
   destination in the index is real, and the rest are about the contract: it
   answers every keystroke, it can be driven entirely from the keyboard, and it
   gives the page back exactly as it found it. */

type Entry = { k: string; t: string; u: string; c: string; d?: string; w?: string };

const INDEX: Entry[] = JSON.parse(readFileSync(new URL('../assets/search.json', import.meta.url), 'utf8'));

async function openConsole(page: Page, by: 'slash' | 'meta' | 'button' = 'slash') {
  if (by === 'button') await page.locator('[data-console-open]').first().click();
  else if (by === 'meta') await page.keyboard.press('Control+k');
  else await page.keyboard.press('/');
  await expect(page.locator('.cons__box')).toBeVisible();
  await expect(page.locator('.cons__input')).toBeFocused();
  await expect(page.locator('.cons__row').first()).toBeVisible();
}

test('every destination in the index exists, and every anchor in it is real', async ({ page }) => {
  expect(INDEX.length).toBeGreaterThan(40);

  const bodies = new Map<string, string>();
  for (const entry of INDEX) {
    const [file, id] = entry.u.split('#');
    expect(PAGES, `${entry.t} points at ${file}`).toContain(file);
    if (!bodies.has(file)) {
      const res = await page.request.get(file);
      expect(res.status(), `${file} should exist`).toBeLessThan(400);
      bodies.set(file, await res.text());
    }
    if (id) {
      expect(bodies.get(file)!, `${file} should carry #${id}`).toContain(`id="${id}"`);
    }
  }
});

test('the index carries every product and every page', async () => {
  const products = INDEX.filter((e) => e.k === 'project').map((e) => e.t);
  expect(products).toHaveLength(6);
  /* One row per destination: a product's card and its case study are the same
     place and must not both be offered. */
  const urls = INDEX.map((e) => e.u);
  expect(new Set(urls).size).toBe(urls.length);
});

test.describe('the console', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
  });

  for (const by of ['slash', 'meta', 'button'] as const) {
    test(`opens on ${by}`, async ({ page }) => {
      await openConsole(page, by);
      await expect(page.locator('.cons__input')).toBeFocused();
    });
  }

  test('an empty field is a menu, not a blank panel', async ({ page }) => {
    await openConsole(page);
    expect(await page.locator('.cons__row').count()).toBeGreaterThan(8);
    expect(await page.locator('.cons__group').allTextContents()).toContain('Projects');
  });

  test('typing narrows the list, and the count is what the list is', async ({ page }) => {
    await openConsole(page);
    await page.keyboard.type('manifester');
    await expect(page.locator('.cons__row').first()).toContainText('Manifester');
    const shown = await page.locator('.cons__row').count();
    const said = Number((await page.locator('[data-count]').textContent())!.trim());
    expect(said).toBe(shown);
    /* And the count is announced, because the list is the one thing a screen
       reader cannot see change. */
    await expect(page.locator('[data-announce]')).toContainText(/result/);
  });

  test('what matched is shown as what matched', async ({ page }) => {
    await openConsole(page);
    await page.keyboard.type('phlebotomy');
    await expect(page.locator('.cons__row').first()).toContainText('Phlebotomy');
    const hit = page.locator('.cons__row .cons__hit').first();
    await expect(hit).toBeVisible();
    expect((await hit.textContent())!.toLowerCase()).toBe('phlebotomy');
  });

  test('nothing matching says so, and says what it looked in', async ({ page }) => {
    await openConsole(page);
    await page.keyboard.type('qzzxwv');
    await expect(page.locator('.cons__row')).toHaveCount(0);
    await expect(page.locator('.cons__none').first()).toBeVisible();
    await expect(page.locator('[data-announce]')).toHaveText('No results');
  });

  test('the arrow keys move the selection, and the field points at it', async ({ page }) => {
    await openConsole(page);
    const first = await page.locator('.cons__input').getAttribute('aria-activedescendant');
    await page.keyboard.press('ArrowDown');
    const second = await page.locator('.cons__input').getAttribute('aria-activedescendant');
    expect(second).not.toBe(first);
    await expect(page.locator(`#${second}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.cons__row.is-on')).toHaveCount(1);

    await page.keyboard.press('ArrowUp');
    expect(await page.locator('.cons__input').getAttribute('aria-activedescendant')).toBe(first);
  });

  test('Enter travels to another document', async ({ page }) => {
    await openConsole(page);
    await page.keyboard.type('spellbomb');
    await page.keyboard.press('Enter');
    await page.waitForURL(/spellbomb\.html/, { timeout: 15_000 });
    await expect(page.locator('h1')).toHaveText('SpellBomb');
  });

  test('Enter travels within the document it is already in', async ({ page }) => {
    await page.goto('about.html', { waitUntil: 'load' });
    await openConsole(page);
    await page.keyboard.type('what i want a screen');
    await expect(page.locator('.cons__row').first()).toBeVisible();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1400);
    expect(page.url()).toMatch(/#/);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
  });

  test('Escape undoes the query before it closes the panel', async ({ page }) => {
    await openConsole(page);
    await page.keyboard.type('resume');
    await expect(page.locator('.cons__input')).toHaveValue('resume');
    await page.keyboard.press('Escape');
    await expect(page.locator('.cons__input')).toHaveValue('');
    await expect(page.locator('.cons__box')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.cons')).toBeHidden();
  });

  test('focus goes back where it came from', async ({ page }) => {
    await openConsole(page, 'button');
    await page.keyboard.press('Escape');
    await expect(page.locator('.masthead .findbtn')).toBeFocused();
  });

  test('Tab cannot walk out of the panel', async ({ page }) => {
    await openConsole(page);
    const inside: boolean[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      inside.push(await page.evaluate(() => !!document.activeElement?.closest('.cons__box')));
    }
    expect(inside.every(Boolean)).toBe(true);
  });

  test('it says where you already are', async ({ page }) => {
    await page.goto('spellbomb.html', { waitUntil: 'load' });
    await openConsole(page);
    await page.keyboard.type('spellbomb');
    await expect(page.locator('.cons__row.is-here .cons__here').first()).toBeVisible();
  });

  test('the page behind it does not move while it is open', async ({ page }) => {
    await openConsole(page);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
  });

  test('a heading never appears twice in one result', async ({ page }) => {
    for (const q of ['motion', 'health', 'the', 'exam', 'connor', 'a']) {
      await openConsole(page);
      await page.keyboard.type(q);
      await expect(page.locator('.cons__row').first()).toBeVisible();
      const heads = await page.locator('.cons__group').allTextContents();
      expect(new Set(heads).size, `"${q}" repeats a heading: ${heads.join(', ')}`).toBe(heads.length);
      await page.keyboard.press('Escape');
      await expect(page.locator('.cons__input')).toHaveValue('');
      await page.keyboard.press('Escape');
      await expect(page.locator('.cons')).toBeHidden();
    }
  });

  test('the motion command and the masthead switch are the same switch', async ({ page }) => {
    await openConsole(page);
    await page.keyboard.type('reduce motion');
    await expect(page.locator('.cons__row').first()).toContainText('Reduce motion');
    await page.keyboard.press('Enter');
    await expect(page.locator('.cons')).toBeHidden();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect(page.locator(".masthead__in > [data-motion-toggle]")).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-announce]')).toHaveText('Motion reduced');

    /* And the command now offers the other half of the same switch. */
    await openConsole(page);
    await page.keyboard.type('motion');
    await expect(page.locator('.cons__row').filter({ hasText: 'Restore motion' })).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('.cons__input')).toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(page.locator('.cons')).toBeHidden();
    await page.locator(".masthead__in > [data-motion-toggle]").click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'auto');
  });

  test('the key hint names a key the keyboard in front of you has', async ({ page }) => {
    await openConsole(page, 'button');
    await page.keyboard.press('Escape');
    const hint = (await page.locator('[data-console-key]').first().textContent())!.trim();
    expect(['/', '⌘K']).toContain(hint);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('it opens as a sheet, and closes the menu it was opened from', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await page.locator('[data-menu] summary').click();
    await expect(page.locator('[data-menu]')).toHaveAttribute('open', '');

    await page.locator('.navmob__find').click();
    await expect(page.locator('.cons__box')).toBeVisible();
    await expect(page.locator('[data-menu]')).not.toHaveAttribute('open', '');

    /* A sheet, not a panel with a keyboard underneath it. */
    const box = (await page.locator('.cons__box').boundingBox())!;
    expect(box.height).toBeGreaterThan(700);
    expect(box.width).toBeGreaterThan(380);

    /* And every row is a target a thumb can hit. */
    const small = await page.$$eval('.cons__row', (rows) =>
      rows.map((r) => r.getBoundingClientRect().height).filter((h) => h < 44)
    );
    expect(small).toEqual([]);
  });

  test('the masthead control is a target too', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    const box = (await page.locator('.masthead .findbtn').boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  });
});

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('there is no control that cannot work', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html');
    await expect(page.locator('.findbtn')).toBeHidden();
    await expect(page.locator('.cons')).toHaveCount(0);
    /* And every place the console would have gone is still reachable. */
    await expect(page.locator('footer a[href="resume.html"]')).toBeVisible();
  });
});
