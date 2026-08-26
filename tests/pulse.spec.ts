import { test, expect, Page } from '@playwright/test';
import { PAGES } from './pages';

/* THE PULSE LAYER.
   ---------------------------------------------------------------------------
   One signal, on every page, answering the visitor. It writes three custom
   properties onto <html> and nothing else, so what follows checks the values
   themselves rather than the pixels they happen to move: that they rise from a
   real cause, that they come back to rest on their own, and that not one of
   them is ever written on a page that asked for less.

   The hold it used to own — taking the sculpture in hand — belongs to the
   hologram now, and is asserted in hero.spec.ts against the object that
   actually answers it. Two modules reaching for the same pointer was one
   module too many. */

const read = (page: Page, prop: string) =>
  page.evaluate(
    (p) => Number(getComputedStyle(document.documentElement).getPropertyValue(p) || 0),
    prop
  );

async function loaded(page: Page) {
  await expect
    .poll(() => page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--reach').trim() !== ''
    ), { timeout: 15000 })
    .toBe(true);
}

/* Drive the scroll from inside the page, a frame at a time, so the exertion is
   measured against real animation frames rather than against a synthetic wheel
   event the compositor may coalesce away.

   Two details the first version of this got wrong, both worth keeping written
   down: the site sets `scroll-behavior: smooth`, so scrollBy() animates and a
   single frame sees almost none of the distance asked for — the position has
   to be set outright. And a short page runs out of room, so the walk turns
   round at the bottom rather than pushing against it and reporting no
   movement at all. */
async function exert(page: Page, frames = 24) {
  const peak = await page.evaluate(async (n) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max < 240) return -1;
    const step = Math.min(100, Math.max(40, Math.round(max / 8)));
    let peak = 0, y = window.scrollY, dir = 1;
    for (let i = 0; i < n; i++) {
      y += dir * step;
      if (y >= max) { y = max; dir = -1; }
      if (y <= 0) { y = 0; dir = 1; }
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => requestAnimationFrame(r));
      peak = Math.max(peak, Number(getComputedStyle(document.documentElement).getPropertyValue('--pulse') || 0));
    }
    return peak;
  }, frames);
  expect(peak, 'the page has to be long enough to scroll for this to mean anything').toBeGreaterThan(-1);
  return peak;
}

/* --- 1. it is the whole site's, not the home page's ----------------------- */

test.describe('every page gets it', () => {
  for (const p of PAGES) {
    test(`${p}: the pulse layer arrives and answers the scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(p, { waitUntil: 'load' });
      await loaded(page);

      const peak = await exert(page);
      expect(peak, 'scrolling has to raise the trace').toBeGreaterThan(0.25);
      expect(peak, 'and it may never exceed its own ceiling').toBeLessThanOrEqual(1);
    });
  }
});

/* --- 2. it settles, which is the half that makes it a heartbeat ----------- */

test('exertion decays back to rest on its own', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await loaded(page);

  const peak = await exert(page);
  expect(peak).toBeGreaterThan(0.4);

  /* Hands off. A signal that stays loud after the effort stops is not a pulse,
     it is an idle animation with a story attached. */
  await expect.poll(() => read(page, '--pulse'), { timeout: 6000 }).toBeLessThan(0.05);
  await expect.poll(() => read(page, '--pulse'), { timeout: 6000 }).toBe(0);
});

test('the resting page writes no movement at all', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await loaded(page);
  await page.waitForTimeout(1200);
  expect(await read(page, '--pulse')).toBe(0);
});

/* --- 3. one beat, on a real activation ------------------------------------ */

test('pressing a control sends one beat, and only one', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await loaded(page);

  /* A real activation on a real control. The navigation is cancelled from a
     capture listener registered after the module's own, so the beat still
     fires and the test stays on the page to watch it clear.

     The beat is deliberately short — it clears itself inside 760 ms — so it is
     recorded as it happens rather than polled for afterwards. A poll that
     arrives late on a busy machine cannot tell a beat that already finished
     from a beat that never fired, and the difference is the whole test. */
  await page.evaluate(() => {
    const w = window as unknown as { __beats: number };
    w.__beats = 0;
    new MutationObserver(() => {
      if (document.documentElement.classList.contains('is-beat')) w.__beats++;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', (e) => e.preventDefault(), true);
  });
  await page.locator('.sig__actions a').first().click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __beats: number }).__beats), { timeout: 8000 })
    .toBe(1);
  /* It is finite: the class clears itself rather than leaving the trace lit. */
  await expect(page.locator('html.is-beat')).toHaveCount(0, { timeout: 4000 });
});

test('scrolling and hovering never send a beat', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await loaded(page);
  await page.evaluate(() => {
    const w = window as unknown as { __beats: number };
    w.__beats = 0;
    new MutationObserver(() => {
      if (document.documentElement.classList.contains('is-beat')) w.__beats++;
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  });
  await exert(page, 12);
  await page.mouse.move(700, 400);
  await page.mouse.move(900, 500);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => (window as unknown as { __beats: number }).__beats)).toBe(0);
});

/* --- 4. the gates ---------------------------------------------------------- */

test.describe('when the visitor asked for less', () => {
  test('reduced motion never fetches it and never writes a property', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const asked: string[] = [];
    page.on('request', (r) => /vendor\//.test(r.url()) && asked.push(r.url()));
    await page.goto('index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    expect(asked).toEqual([]);
    const written = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--reach').trim()
    );
    expect(written).toBe('');
  });

  test('Save-Data never fetches it', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) });
    });
    const asked: string[] = [];
    page.on('request', (r) => /vendor\//.test(r.url()) && asked.push(r.url()));
    await page.goto('/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    expect(asked).toEqual([]);
    await ctx.close();
  });

  test("the site's own motion control tears it down and takes its values with it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await loaded(page);
    await page.locator('.masthead__in > [data-motion-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect
      .poll(() => page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--reach').trim()
      ), { timeout: 4000 })
      .toBe('');
  });
});

/* --- 5. a phone has no pointer, and still gets the part that matters ------- */

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('the trace still answers the scroll, with no pointer anywhere', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await loaded(page);
    const peak = await exert(page, 20);
    expect(peak).toBeGreaterThan(0.25);
    /* And nothing on a touch screen is draggable out from under the scroll. */
    const stage = await page.locator('.sig__stage').evaluate((e) => getComputedStyle(e).pointerEvents);
    expect(stage).toBe('none');
  });
});

/* --- 6. it costs the page nothing it cannot give -------------------------- */

test('it never changes the height or the width of the document', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await loaded(page);
  /* Walk the whole document first, so every lazily-decoded capture below the
     fold has arrived and every entrance has finished. Measuring before that is
     measuring the page still loading, not measuring the pulse. */
  await exert(page, 24);
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => [
    document.documentElement.scrollHeight,
    document.documentElement.scrollWidth,
  ]);
  await exert(page, 20);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => [
    document.documentElement.scrollHeight,
    document.documentElement.scrollWidth,
  ]);
  expect(after).toEqual(before);
});
