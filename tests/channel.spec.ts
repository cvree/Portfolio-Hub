import { test, expect, Page } from '@playwright/test';

/* THE INSTRUMENT.
   ---------------------------------------------------------------------------
   The home hero is a six-position control, and a control has to answer to all
   five inputs before it is allowed to exist: pointer, touch, keyboard, reduced
   motion and no JavaScript. What follows is the proof, one input at a time,
   plus the three hard limits — nothing learnable-before-usable, no fact that
   only an interaction can reach, and no interaction that delays navigation. */

const CHANNELS = [
  { slug: 'spellbomb', name: 'SpellBomb', href: 'spellbomb.html', accent: 'rgb(240, 162, 60)' },
  { slug: 'health-journal', name: 'Health Journal', href: 'health-journal.html', accent: 'rgb(127, 166, 240)' },
  { slug: 'phlebotomy', name: 'Phlebotomy Exam Prep', href: 'phlebotomy-exam-prep.html', accent: 'rgb(23, 160, 143)' },
  { slug: 'manifester', name: 'Manifester', href: 'manifester.html', accent: 'rgb(201, 145, 137)' },
  { slug: 'owcs', name: 'OWCS Comp Tracker', href: 'owcs-comp-tracker.html', accent: 'rgb(185, 226, 77)' },
  { slug: 'paper-animator', name: 'PaperAnimator', href: 'paper-animator.html', accent: 'rgb(222, 215, 198)' },
];

/* The module is lazy and deliberately not in the critical path, so every test
   that operates the instrument waits for it to have taken over. */
async function wired(page: Page) {
  await expect(page.locator('.ap.is-wired')).toHaveCount(1, { timeout: 15000 });
}

/* --- 1. no JavaScript ------------------------------------------------------
   The strip is six ordinary links to six case studies. Not a dead widget, not
   a disabled control, not a placeholder — the design. */

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('the strip is six working links to the six case studies', async ({ page }) => {
    await page.goto('index.html');
    const opts = page.locator('.ch__opt');
    await expect(opts).toHaveCount(6);
    for (const c of CHANNELS) {
      const a = page.locator(`.ch__opt[data-ch="${c.slug}"]`);
      await expect(a).toHaveJSProperty('tagName', 'A');
      await expect(a).toHaveAttribute('href', c.href);
      await expect(a).toContainText(c.name);
    }
  });

  test('one channel is composed, and only that one is in the document', async ({ page }) => {
    await page.goto('index.html');
    /* Exactly one caption, one link, one read-out — the other five carry a
       hidden attribute and are not rendered at all. */
    await expect(page.locator('.ap__cap [data-cap]:visible')).toHaveCount(1);
    await expect(page.locator('.ap__cap [data-link]:visible')).toHaveCount(1);
    await expect(page.locator('.ap__readout:visible')).toHaveCount(1);
    await expect(page.locator('.ap__readout:visible li').first()).toContainText('Live');
    /* And the composition standing in the frame is the channel it says. */
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'phlebotomy');
    await expect(page.locator('.ap__cap [data-link]:visible')).toHaveAttribute('href', 'phlebotomy-exam-prep.html');
  });

  test('no hotspot is rendered, because none of them could work', async ({ page }) => {
    await page.goto('index.html');
    expect(await page.locator('.ap__spot:visible').count()).toBe(0);
    /* And nothing that only a hotspot says is a fact the page needs: the
       caption still names the product and the drill it is running. */
    await expect(page.locator('.ap__cap [data-cap]:visible')).toContainText('Order of Draw');
  });

  test('the strip navigates, like the links it is', async ({ page }) => {
    await page.goto('index.html');
    await page.locator('.ch__opt[data-ch="owcs"]').click();
    await expect(page).toHaveURL(/owcs-comp-tracker\.html$/);
    await expect(page.locator('h1')).toBeVisible();
  });
});

/* --- 2. keyboard ----------------------------------------------------------- */

test.describe('the keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await wired(page);
  });

  test('the strip is a radio group with a name and a roving tabindex', async ({ page }) => {
    const group = page.locator('.ch__list');
    await expect(group).toHaveAttribute('role', 'radiogroup');
    await expect(group).toHaveAccessibleName(/instrument/i);
    await expect(page.locator('[role="radio"]')).toHaveCount(6);

    /* One stop in the tab order for the whole group, on the committed one. */
    const tabbable = await page.$$eval('[role="radio"]', (bs) => bs.filter((b) => (b as HTMLElement).tabIndex === 0).length);
    expect(tabbable).toBe(1);
    await expect(page.locator('[role="radio"][aria-checked="true"]')).toHaveAttribute('data-ch', 'phlebotomy');
  });

  test('arrow keys move between positions and commit as they go', async ({ page }) => {
    await page.locator('[role="radio"][aria-checked="true"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'manifester');
    await expect(page.locator(':focus')).toHaveAttribute('data-ch', 'manifester');

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'health-journal');

    await page.keyboard.press('Home');
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'spellbomb');
    await page.keyboard.press('End');
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'paper-animator');
  });

  test('the group wraps rather than trapping', async ({ page }) => {
    await page.locator('[role="radio"][data-ch="paper-animator"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'spellbomb');
    /* Tab leaves the group entirely — one stop in, one stop out. */
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.ch__list'))).toBe(false);
  });

  test('Enter and Space commit the focused position', async ({ page }) => {
    await page.locator('[role="radio"][data-ch="owcs"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'owcs');
    await page.locator('[role="radio"][data-ch="spellbomb"]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'spellbomb');
  });
});

/* --- 3. the retune itself --------------------------------------------------
   One input, one machine answering across every layer at once. */

test.describe('a channel change retunes the whole page', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await wired(page);
  });

  for (const c of CHANNELS) {
    test(`${c.slug}: accent, signal, bracket, evidence, read-out, caption and link all move`, async ({ page }) => {
      await page.locator(`[role="radio"][data-ch="${c.slug}"]`).click();
      await page.waitForTimeout(900);

      // the accent, interpolated on the hero
      await expect
        .poll(() => page.locator('.ap').evaluate((e) => getComputedStyle(e).getPropertyValue('--accent').trim()))
        .toBe(c.accent);

      // the signal — a different waveform, on the one live path
      const d = await page.locator('.ap__signal[data-sig="live"]').getAttribute('d');
      const want = await page.locator(`.ap__signal[data-sig="${c.slug}"]`).getAttribute('d');
      expect(d!.split(/[ ,]/)[1]).toBe(want!.split(/[ ,]/)[1]);

      // the bracket — one seed showing, and it is this channel's
      await expect(page.locator(`.ap__bracket-group[data-brk="${c.slug}"]`)).toHaveCSS('opacity', '1');

      // the evidence — this product's real capture, from assets/projects/
      const src = await page.locator('.ap__iris img').getAttribute('src');
      const row = await page.locator(`.works--rig .work[data-accent="${c.slug}"] .work__shot img`).getAttribute('src');
      expect(src).toBe(row);

      // the caption, the link and the read-out — one of each, and all this one's
      await expect(page.locator('.ap__cap [data-cap]:visible')).toHaveCount(1);
      await expect(page.locator(`.ap__cap [data-cap="${c.slug}"]`)).toBeVisible();
      await expect(page.locator('.ap__cap [data-link]:visible')).toHaveCount(1);
      await expect(page.locator(`.ap__cap [data-link="${c.slug}"]`)).toHaveAttribute('href', c.href);
      await expect(page.locator('.ap__cap [data-link]:visible')).toContainText(c.name);
      await expect(page.locator('.ap__readout:visible')).toHaveCount(1);
      await expect(page.locator(`.ap__readout[data-readout="${c.slug}"]`)).toBeVisible();

      // and the work index lights the row whose product this is
      await expect(page.locator('html')).toHaveAttribute('data-channel', c.slug);
    });
  }

  test('the read-out states facts, not adjectives', async ({ page }) => {
    await page.locator('[role="radio"][data-ch="phlebotomy"]').click();
    const out = page.locator('.ap__readout:visible');
    await expect(out).toContainText('513');
    await expect(out).toContainText('257');
    /* The same numbers the work index states, because there is one set of
       facts on this page rather than two. */
    const row = page.locator('.works--rig .work[data-accent="phlebotomy"] .work__spec');
    await expect(row).toContainText('513');
    await expect(row).toContainText('257');
  });

  test('the URL and the history are never touched', async ({ page }) => {
    const before = page.url();
    const depth = await page.evaluate(() => history.length);
    for (const c of CHANNELS) {
      await page.locator(`[role="radio"][data-ch="${c.slug}"]`).click();
      await page.waitForTimeout(120);
    }
    expect(page.url()).toBe(before);
    expect(await page.evaluate(() => history.length)).toBe(depth);
  });

  test('the evidence is never blank, at any point in a swap', async ({ page }) => {
    await page.locator('[role="radio"][data-ch="owcs"]').click();
    for (let i = 0; i < 8; i++) {
      const ok = await page.locator('.ap__iris img').evaluate((img: HTMLImageElement) => {
        const r = img.getBoundingClientRect();
        return r.width > 100 && r.height > 100 && !!img.getAttribute('src') && !!img.getAttribute('alt');
      });
      expect(ok).toBe(true);
      await page.waitForTimeout(90);
    }
  });

  test('the hero never claims a transition name the work index owns', async ({ page }) => {
    await page.locator('[role="radio"][data-ch="spellbomb"]').click();
    await page.waitForTimeout(700);
    const names = await page.$$eval('[data-vt]', (els) => els.map((e) => e.getAttribute('data-vt')));
    expect(new Set(names).size).toBe(names.length);
  });
});

/* --- 4. pointer: hover previews, it never commits --------------------------- */

test('hovering a position previews the room and leaves the record alone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await wired(page);

  const before = await page.locator('.ap__iris img').getAttribute('src');
  await page.locator('[role="radio"][data-ch="owcs"]').hover();
  await page.waitForTimeout(700);

  // the room retuned
  await expect(page.locator('.ap')).toHaveAttribute('data-tune', 'owcs');
  // the record did not
  await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'phlebotomy');
  expect(await page.locator('.ap__iris img').getAttribute('src')).toBe(before);
  await expect(page.locator('.ap__cap [data-link="phlebotomy"]')).toBeVisible();

  // and it goes back when the pointer leaves
  await page.mouse.move(10, 10);
  await page.waitForTimeout(700);
  await expect(page.locator('.ap')).toHaveAttribute('data-tune', 'phlebotomy');
});

test('hovering a work row previews it in the hero without delaying the link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await wired(page);

  const row = page.locator('.works--rig .work[data-accent="manifester"]');
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await page.waitForTimeout(600);
  await expect(page.locator('.ap')).toHaveAttribute('data-tune', 'manifester');
  await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'phlebotomy');

  const t0 = Date.now();
  await row.locator('a').click();
  await page.waitForURL(/manifester\.html$/);
  await expect(page.locator('h1')).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(4000);
});

/* --- 5. touch --------------------------------------------------------------- */

test.describe('a finger', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('tap commits, and every target is at least 44 px', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await wired(page);

    const small = await page.$$eval('.ch__opt, .ap__spot', (els) =>
      els.filter((e) => e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().height < 44).length
    );
    expect(small).toBe(0);

    await page.locator('[role="radio"][data-ch="spellbomb"]').tap();
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'spellbomb');
    await expect(page.locator('.ap__cap [data-link="spellbomb"]')).toBeVisible();
  });

  test('nothing on the page depends on hovering', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await wired(page);
    /* The hint names the input this device has. */
    await expect(page.locator('[data-ch-hint]')).toContainText(/tap/i);
  });
});

/* --- 6. the specimen -------------------------------------------------------- */

test.describe('the hotspots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await wired(page);
  });

  test('only the tuned channel’s hotspots are on the specimen', async ({ page }) => {
    await expect(page.locator('.ap__spot:visible')).toHaveCount(3);
    await page.locator('[role="radio"][data-ch="owcs"]').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.ap__spot:visible')).toHaveCount(2);
  });

  test('each one is a real button with a real name, and its panel is beside the frame', async ({ page }) => {
    const spots = page.locator('.ap__spot:visible');
    const n = await spots.count();
    for (let i = 0; i < n; i++) {
      const b = spots.nth(i);
      await expect(b).toHaveJSProperty('tagName', 'BUTTON');
      await expect(b).toHaveAttribute('aria-expanded', 'false');
      expect((await b.evaluate((e) => e.textContent || '')).trim().length).toBeGreaterThan(6);
    }

    const first = spots.first();
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    const id = await first.getAttribute('aria-controls');
    const note = page.locator(`#${id}`);
    await expect(note).toBeVisible();

    /* Beside the picture, never over the thing it is describing. */
    const frame = (await page.locator('.ap__frame').boundingBox())!;
    const box = (await note.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(frame.y + frame.height - 2);
  });

  test('one panel at a time, and a channel change closes them', async ({ page }) => {
    const spots = page.locator('.ap__spot:visible');
    await spots.nth(0).click();
    await spots.nth(1).click();
    await expect(page.locator('.ap__spot[aria-expanded="true"]')).toHaveCount(1);

    await page.locator('[role="radio"][data-ch="manifester"]').click();
    await page.waitForTimeout(800);
    await expect(page.locator('.ap__spot[aria-expanded="true"]')).toHaveCount(0);
    await expect(page.locator('.ap__note:visible')).toHaveCount(0);
  });

  test('they are reachable and operable from the keyboard', async ({ page }) => {
    const b = page.locator('.ap__spot:visible').first();
    await b.focus();
    await expect(b).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(b).toHaveAttribute('aria-expanded', 'true');
  });
});

/* --- 7. reduced motion: the same state change, arriving instantly ------------ */

test.describe('with prefers-reduced-motion: reduce', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('nothing is withheld: the selector still selects and the page still retunes', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await wired(page);

    await page.locator('[role="radio"][data-ch="owcs"]').click();
    /* Instantly — not after a swap that was never going to play. */
    await page.waitForTimeout(120);
    await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'owcs');
    await expect(page.locator('.ap__readout[data-readout="owcs"]')).toBeVisible();
    await expect(page.locator('.ap__cap [data-link="owcs"]')).toBeVisible();
    const src = await page.locator('.ap__iris img').getAttribute('src');
    expect(src).toContain('owcs');

    /* And still no shader, and still no shutter. */
    expect(await page.locator('canvas').count()).toBe(0);
    expect(await page.locator('.ap__blade:visible').count()).toBe(0);
  });

  test('the counters print their finished value rather than climbing to it', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await page.locator('.vitals').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await expect(page.locator('.vitals')).toContainText('3.813');
    await expect(page.locator('.vitals')).toContainText('105');
  });
});

test('with motion turned off by the site’s own control, the instrument still works', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await wired(page);
  await page.locator('.masthead__in > [data-motion-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');

  await page.locator('[role="radio"][data-ch="spellbomb"]').click();
  await page.waitForTimeout(150);
  await expect(page.locator('.ap')).toHaveAttribute('data-channel', 'spellbomb');
  await expect(page.locator('.ap__readout[data-readout="spellbomb"]')).toBeVisible();
});

/* --- 8. Save-Data: the six links, and not one byte more --------------------- */

test('Save-Data gets the links and no module at all', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) });
  });
  const asked: string[] = [];
  page.on('request', (r) => /vendor\//.test(r.url()) && asked.push(r.url()));
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(2800);

  expect(asked).toEqual([]);
  await expect(page.locator('.ap.is-wired')).toHaveCount(0);
  await expect(page.locator('.ch__opt')).toHaveCount(6);
  await expect(page.locator('.ch__opt[data-ch="owcs"]')).toHaveAttribute('href', 'owcs-comp-tracker.html');
  expect(await page.locator('.ap__spot:visible').count()).toBe(0);
  await ctx.close();
});

/* --- 9. the three hard limits ----------------------------------------------- */

test('a visitor who ignores the instrument entirely still gets the whole page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await wired(page);

  /* Both actions, the résumé, and all six case studies, by scrolling and
     clicking links — without touching a single channel. */
  await expect(page.getByRole('link', { name: /View projects/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /download résumé/i })).toBeVisible();
  for (const c of CHANNELS) {
    await expect(page.locator(`.works--rig a[href="${c.href}"]`)).toHaveCount(1);
  }
  await page.getByRole('link', { name: /download résumé/i }).click();
  await expect(page).toHaveURL(/resume\.html$/);
});

test('every fact in the read-out is also stated somewhere no interaction is needed', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  await wired(page);
  /* The read-out is a second view of the work index, not the only copy of
     anything: each channel's numbers are in its row as ordinary text. */
  const body = await page.locator('.works--rig').innerText();
  for (const n of ['260', '107', '21', '$0', '9.3.0']) expect(body).toContain(n);
});

test('a number that climbs is a number the prose beside it also states', async ({ page }) => {
  await page.goto('index.html', { waitUntil: 'load' });
  /* content: counter() is not in the text layer, so the treatment is only ever
     applied where losing that text would lose nothing. */
  const counted = await page.$$eval('.num', (els) => els.map((e) => e.textContent!.trim()));
  expect(counted.sort()).toEqual(['105', '257', '3.813', '513']);

  await expect(page.locator('.works--rig .work[data-accent="phlebotomy"] .work__blurb')).toContainText('513');
  await expect(page.locator('.works--rig .work[data-accent="phlebotomy"] .work__meta')).toContainText('257');
  /* Both counted cells state their number once, in the text, for anything not
     reading pixels — and the drawn numeral beside it is marked decorative. */
  const research = page.locator('.vitals__cell').filter({ has: page.getByText('Research', { exact: true }) });
  const flat = (e: any) => (e as HTMLElement).innerText.replace(/\s+/g, ' ').trim();
  expect(await research.evaluate(flat)).toContain('105 participants surveyed');
  const education = page.locator('.vitals__cell').filter({ has: page.getByText('Education', { exact: true }) });
  expect(await education.evaluate(flat)).toContain('3.813 GPA');
  await expect(page.locator('.vitals__v[aria-hidden="true"]')).toHaveCount(2);
});
