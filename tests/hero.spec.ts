import { test, expect, Page } from '@playwright/test';

/* THE PROJECTION.
   ---------------------------------------------------------------------------
   The hero is one object and no controls. That is the change this suite is
   written against: what stood here before was a monogram with a three-position
   tab set under it, and two thirds of that panel's content was only reachable
   by pressing something. Every fact it held is now open, in the strip below
   the hero, with nothing to press.

   So the assertions divide in two. The first half is what a hero owes a
   visitor and owes it in every state — pointer, touch, keyboard, reduced
   motion and no JavaScript. The second half is the promise that the
   simplification actually happened and cannot quietly come back: no tab set,
   no second switch in the masthead, no fact behind an interaction, and one
   object that says nothing at all so that nobody who ignores it loses
   anything. */

/* Everything below the fold is a promise the first viewport already made. */
const FIRST_VIEWPORT = [
  '@cvree',
  'Connor',
  'Eppolito',
  'Camarillo, California',
  'December 2026',
  'NREMT-Certified EMT',
  'Health Science',
  'Product Builder',
  'CSUCI Esports President',
];

/* The three domains are gone as a control. These are the facts their panels
   held, and every one of them has to be readable on the page with nothing
   pressed, expanded or hovered. */
const OPEN_FACTS = [
  'NREMT',
  '3.813',
  'CPT',
  'President',
  '105',
  'Health data',
];

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.sig.is-settled')).toHaveCount(1, { timeout: 10000 });
}

const cssVar = (page: Page, prop: string) =>
  page.locator('.holo').evaluate((e, p) => getComputedStyle(e).getPropertyValue(p).trim(), prop);

/* --- 1. no JavaScript ------------------------------------------------------
   The projection stands, turns, scans and catches the light — all of that is
   keyframes. Not a placeholder, not a fallback: the design. */

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('the projection is a whole object, with every layer on it', async ({ page }) => {
    await page.goto('index.html');

    /* Eighteen depth slices, all referencing the one path, plus the film, the
       two chromatic ghosts and the scan bar. */
    await expect(page.locator('.holo__slice')).toHaveCount(18);
    await expect(page.locator('.holo__slice use')).toHaveCount(18);
    const targets = await page.$$eval('.holo__slice use', (us) =>
      us.map((u) => u.getAttribute('href'))
    );
    expect(new Set(targets)).toEqual(new Set(['#ghm']));

    for (const sel of ['.holo__film', '.holo__scan', '.holo__ghost--c', '.holo__ghost--m']) {
      await expect(page.locator(sel)).toHaveCount(1);
      const clip = await page.locator(sel).evaluate((e) => getComputedStyle(e).clipPath);
      expect(clip, `${sel} must be cut to the silhouette`).toContain('ghm-clip');
    }
    await expect(page.locator('.holo__ring')).toHaveCount(3);

    /* And it is a volume rather than a stack of identical stickers: the slices
       run a hue ramp and step back along Z. */
    const depth = await page.$$eval('.holo__slice', (els) =>
      els.map((e) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
        return { z: m.m43, fill: getComputedStyle(e).fill };
      })
    );
    expect(depth.every((d) => d.z < 0)).toBe(true);
    expect(Math.min(...depth.map((d) => d.z))).toBeLessThan(-30);
    expect(new Set(depth.map((d) => d.fill)).size).toBe(18);
  });

  test('the object is on screen at a size that reads, and is actually painted', async ({ page }) => {
    await page.goto('index.html');
    const box = (await page.locator('.holo').boundingBox())!;
    expect(box.width).toBeGreaterThan(280);
    expect(box.height).toBeGreaterThan(280);
    const painted = await page.locator('.holo').screenshot();
    expect(painted.byteLength).toBeGreaterThan(4000);
  });

  test('no control is on screen that could not work', async ({ page }) => {
    await page.goto('index.html');
    /* The motion control has no motion to stop with no script running. */
    expect(await page.locator('[data-motion-toggle]:visible').count()).toBe(0);
    /* And the two things that used to be here are gone from the markup
       entirely rather than merely hidden. */
    expect(await page.locator('[data-sound-toggle]').count()).toBe(0);
    expect(await page.locator('[data-domains]').count()).toBe(0);
  });

  test('the name and both actions are readable without any animation', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.locator('h1')).toContainText('Connor');
    for (const sel of ['.sig__title', '.sig__creed', '.sig__stance', '.sig__actions']) {
      const o = await page.locator(sel).evaluate((e) => Number(getComputedStyle(e).opacity));
      expect(o, `${sel} must be legible with no script`).toBeGreaterThan(0.99);
    }
  });

  test('the six rooms are six ordinary articles with ordinary links', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.locator('.wk')).toHaveCount(6);
    const hrefs = await page.$$eval('.wk__t a', (as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual([
      'spellbomb.html', 'health-journal.html', 'phlebotomy-exam-prep.html',
      'manifester.html', 'owcs-comp-tracker.html', 'paper-animator.html',
    ]);
    /* And the rail is six same-page anchors, not a tab set. */
    const rail = await page.$$eval('[data-rail]', (as) => as.map((a) => a.getAttribute('href')));
    expect(rail).toEqual([
      '#w-spellbomb', '#w-health-journal', '#w-phlebotomy',
      '#w-manifester', '#w-owcs', '#w-paper-animator',
    ]);
  });

  test('every scene is its composed final frame', async ({ page }) => {
    await page.goto('index.html');
    const unfinished = await page.$$eval('.scene *', (els) =>
      els
        .filter((e) => {
          const c = getComputedStyle(e);
          if (c.display === 'none') return false;
          return Number(c.opacity) < 0.3;
        })
        .map((e) => (e as HTMLElement).className)
        .filter((c) => typeof c === 'string' && c.length)
    );
    expect(unfinished).toEqual([]);
  });
});

/* --- 2. the first viewport ------------------------------------------------ */

test.describe('the first viewport', () => {
  for (const [w, h] of [[1440, 900], [390, 844]] as const) {
    test(`${w}x${h}: identifies Connor without any interaction`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto('index.html', { waitUntil: 'load' });
      await ready(page);

      const visibleText = await page.evaluate((vh) => {
        const out: string[] = [];
        document.querySelectorAll('.sig__copy, .sig__copy *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < vh && r.bottom > 0 && r.height > 0) out.push(el.textContent || '');
        });
        return out.join(' ').replace(/\s+/g, ' ');
      }, h);

      for (const fact of FIRST_VIEWPORT) {
        expect(visibleText, `"${fact}" must be in the first viewport at ${w}x${h}`).toContain(fact);
      }

      /* Both actions, above the fold, at full size. */
      for (const name of [/explore the work/i, /view résumé/i]) {
        const link = page.getByRole('link', { name });
        const box = (await link.boundingBox())!;
        expect(box.y + box.height).toBeLessThanOrEqual(h);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });
  }

  test('no capture of any kind appears above Selected Work', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    const worksTop = await page.locator('[data-theatre]').evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    const early = await page.$$eval('img', (imgs, top) =>
      imgs
        .filter((i) => i.getBoundingClientRect().top + window.scrollY < (top as number))
        .map((i) => i.getAttribute('src') || ''),
      worksTop
    );
    expect(early).toEqual([]);
  });

  test('the hero holds no raster image of any kind — it is geometry', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    expect(await page.locator('.sig img').count()).toBe(0);
    expect(await page.locator('.sig svg').count()).toBeGreaterThanOrEqual(18);
  });
});

/* --- 3. the simplification, asserted so it cannot come back ---------------- */

test.describe('what the hero no longer asks of anybody', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await ready(page);
  });

  test('there is no tab set, no radio group and no hidden panel', async ({ page }) => {
    expect(await page.getByRole('radio').count()).toBe(0);
    expect(await page.locator('[role="tab"]').count()).toBe(0);
    expect(await page.locator('.sig [hidden], .sig [aria-expanded]').count()).toBe(0);
    /* Nothing inside the hero is display:none waiting for a press. */
    const hiddenInHero = await page.$$eval('.sig__copy *', (els) =>
      els.filter((e) => getComputedStyle(e).display === 'none').length
    );
    expect(hiddenInHero).toBe(0);
  });

  test('every fact the old panel held is open on the page, unpressed', async ({ page }) => {
    const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    for (const fact of OPEN_FACTS) expect(text).toContain(fact);
  });

  test('the masthead carries one control and four destinations', async ({ page }) => {
    const nav = page.locator('.masthead nav[aria-label="Primary"] a');
    await expect(nav).toHaveCount(4);
    expect(await nav.allInnerTexts()).toEqual(['Selected Work', 'About', 'Résumé', 'Contact']);
    expect(await page.locator('.masthead__in > button').count()).toBe(1);
    await expect(page.locator('.masthead__in > [data-motion-toggle]')).toBeVisible();
  });

  test('no page anywhere on the site carries a sound control', async ({ page }) => {
    for (const p of ['index.html', 'work.html', 'about.html', 'contact.html', 'resume.html']) {
      await page.goto(p, { waitUntil: 'load' });
      expect(await page.locator('[data-sound-toggle], .soundbtn').count(), p).toBe(0);
    }
  });

  test('the first viewport offers two actions and one aside, and no more', async ({ page }) => {
    /* Counted rather than described, because "a couple of links" is how a hero
       grows back to nine. Two buttons and the @cvree handle. */
    const links = await page.locator('.sig__copy a').count();
    expect(links).toBe(3);
  });
});

/* --- 4. the object answers a hand, and changes nothing when it does -------- */

test.describe('turning the projection', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await ready(page);
    await expect(page.locator('.holo.is-live')).toHaveCount(1, { timeout: 15000 });
  });

  test('the pointer leads the tilt', async ({ page }) => {
    await page.mouse.move(300, 700);
    await expect.poll(() => cssVar(page, '--tilt'), { timeout: 4000 }).not.toBe('');
    const left = Number(await cssVar(page, '--tilt'));
    await page.mouse.move(1300, 200);
    await expect
      .poll(async () => Number(await cssVar(page, '--tilt')), { timeout: 4000 })
      .toBeGreaterThan(left + 0.3);
  });

  test('a drag throws it, and it comes back to rest rather than spinning forever', async ({ page }) => {
    const box = (await page.locator('.holo').boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 260, cy, { steps: 12 });
    await expect(page.locator('.holo.is-held')).toHaveCount(1);
    const thrown = parseFloat(await cssVar(page, '--spin'));
    expect(Math.abs(thrown)).toBeGreaterThan(20);

    await page.mouse.up();
    await expect(page.locator('.holo.is-held')).toHaveCount(0);

    /* Inertia, and then rest: the angle stops changing on its own. Polled
       rather than timed, because how long the coast takes is a number of
       frames and a CI machine with no GPU does not produce them at the rate a
       laptop does. */
    await expect
      .poll(async () => {
        const a = parseFloat(await cssVar(page, '--spin'));
        await page.waitForTimeout(400);
        return Math.abs(parseFloat(await cssVar(page, '--spin')) - a);
      }, { timeout: 30000 })
      .toBeLessThan(0.5);
  });

  test('turning it changes nothing else — no URL, no history, no page state', async ({ page }) => {
    const before = page.url();
    const len = await page.evaluate(() => history.length);
    const box = (await page.locator('.holo').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2 + 80, { steps: 8 });
    await page.mouse.up();
    expect(page.url()).toBe(before);
    expect(await page.evaluate(() => history.length)).toBe(len);
  });

  test('it never widens or lengthens the document, however hard it is turned', async ({ page }) => {
    const before = await page.evaluate(() => [
      document.documentElement.scrollHeight,
      document.documentElement.scrollWidth,
    ]);
    const box = (await page.locator('.holo').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 4000, box.y + 4000, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => [
      document.documentElement.scrollHeight,
      document.documentElement.scrollWidth,
    ])).toEqual(before);
  });

  test('it is decorative, and says nothing to a screen reader', async ({ page }) => {
    await expect(page.locator('.sig__stage')).toHaveAttribute('aria-hidden', 'true');
    expect(await page.locator('.sig__stage [tabindex]:not([tabindex="-1"])').count()).toBe(0);
    expect(await page.locator('.sig__stage a, .sig__stage button').count()).toBe(0);
  });
});

/* --- 5. touch and the coarse pointer -------------------------------------- */

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('the projection never takes the scroll away from the page', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await ready(page);
    /* It sits behind the copy as a field, so it cannot be the target of a
       thumb that was aiming at a word. */
    const events = await page.locator('.sig__stage').evaluate((e) => getComputedStyle(e).pointerEvents);
    expect(events).toBe('none');

    const before = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  });

  test('the media stage is never pinned, and every scene sits with its copy', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    const sticky = await page.$$eval('.scene', (els) =>
      els.filter((e) => getComputedStyle(e).position === 'sticky').length
    );
    expect(sticky).toBe(0);

    for (const slug of ['spellbomb', 'phlebotomy', 'owcs']) {
      const inside = await page.evaluate(
        (s) => !!document.querySelector(`[data-wk="${s}"] [data-scene="${s}"]`),
        slug
      );
      expect(inside).toBe(true);
    }
  });

  test('interface captures stay large enough to read', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    const tooSmall = await page.$$eval('.scene__shot', (els) =>
      els.map((e) => ({ w: e.getBoundingClientRect().width, s: e.getAttribute('src') }))
         .filter((x) => x.w > 0 && x.w < 150)
         .map((x) => `${x.s} ${Math.round(x.w)}px`)
    );
    expect(tooSmall).toEqual([]);
  });
});

/* --- 6. the theatre -------------------------------------------------------- */

test.describe('the six rooms', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await ready(page);
  });

  test('the rail reports which room you are in, and how far through', async ({ page }) => {
    /* Six sections, each with its own settling window. Thirty seconds is the
       default for a test that clicks one thing, not for one that walks a whole
       document while the atmosphere plane is being software-rasterised in
       every parallel worker. */
    test.setTimeout(120_000);
    for (const [i, slug] of ['spellbomb', 'health-journal', 'phlebotomy', 'manifester', 'owcs', 'paper-animator'].entries()) {
      await page.locator(`#w-${slug}`).scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 1);
      await expect(page.locator(`[data-rail="${slug}"]`)).toHaveAttribute('aria-current', 'true', { timeout: 6000 });
      await expect(page.locator('[data-rail-n]')).toHaveText(String(i + 1).padStart(2, '0'));
      expect(await page.locator('[data-rail][aria-current="true"]').count()).toBe(1);
      const spine = await page.locator('[data-spine]').evaluate((e) => e.style.getPropertyValue('--spine'));
      expect(Number(spine)).toBeCloseTo((i + 1) / 6, 5);
    }
  });

  test('the room being read retunes the room the page is read in', async ({ page }) => {
    /* The rail announces the project's own accent through the document, which
       is the one wire between what you are reading and the atmosphere behind
       it. Assert the announcement rather than the pixels: the shader is gated,
       the wire is not. */
    const ACCENTS = ['#f0a23c', '#7fa6f0', '#17a08f', '#c99189', '#b9e24d', '#ded7c6'];
    const seen = await page.evaluate(async (ids) => {
      const out: string[] = [];
      document.addEventListener('ce:room', (e) => out.push((e as CustomEvent).detail.accent));
      for (const id of ids) {
        document.querySelector(id)!.scrollIntoView({ behavior: 'instant', block: 'center' });
        await new Promise((r) => setTimeout(r, 900));
      }
      return out;
    }, ['#w-health-journal', '#w-manifester', '#w-owcs', '#w-paper-animator']);

    /* Several rooms, several colours, and every one of them a colour the site
       actually owns. Which colour lands on which frame is the scroll's
       business, not this test's. */
    expect(new Set(seen).size).toBeGreaterThanOrEqual(2);
    for (const hex of seen) expect(ACCENTS).toContain(hex.toLowerCase());
  });

  test('no inactive room is ever hidden — these are articles, not tabs', async ({ page }) => {
    await page.locator('#w-owcs').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const hidden = await page.$$eval('.wk', (els) =>
      els.filter((e) => {
        const c = getComputedStyle(e);
        return c.display === 'none' || c.visibility === 'hidden' || e.hasAttribute('hidden');
      }).length
    );
    expect(hidden).toBe(0);
    expect(await page.locator('[role="tab"]').count()).toBe(0);
  });

  test('each room has its own motion law, made of things that can move', async ({ page }) => {
    const laws = await page.evaluate(() => ({
      order: document.querySelectorAll('[data-scene="phlebotomy"] .tube').length,
      fuse: document.querySelectorAll('[data-scene="spellbomb"] .tray__t').length,
      scan: document.querySelectorAll('[data-scene="owcs"] .rows__r').length,
      fold: document.querySelectorAll('[data-scene="manifester"] .fold__leaf').length,
      cite: document.querySelectorAll('[data-scene="paper-animator"] .cite__thread').length,
      accumulate: document.querySelectorAll('[data-scene="health-journal"] .scene__line').length,
    }));
    expect(laws.order).toBe(6);
    expect(laws.fuse).toBe(11);
    expect(laws.scan).toBe(5);
    expect(laws.fold).toBe(2);
    expect(laws.cite).toBe(1);
    expect(laws.accumulate).toBe(1);

    const seats = await page.$$eval('[data-scene="phlebotomy"] .tube', (els) =>
      els.map((e) => [
        Number(getComputedStyle(e).getPropertyValue('--i')),
        Number(getComputedStyle(e).getPropertyValue('--from')),
      ])
    );
    expect(seats.map((s) => s[0])).toEqual([0, 1, 2, 3, 4, 5]);
    expect(seats.filter(([i, from]) => i !== from).length).toBe(6);
  });

  test('no two rooms share a motion law', async ({ page }) => {
    const classes = await page.$$eval('.scene', (els) =>
      els.map((e) => Array.from(e.classList).find((c) => c.startsWith('scene--')))
    );
    expect(new Set(classes).size).toBe(6);
    expect(classes).not.toContain(undefined);
  });

  test('the Order of Draw drill is truthful about the six CLSI positions', async ({ page }) => {
    const tubes = await page.$$eval('[data-scene="phlebotomy"] .tube', (els) =>
      els.map((e) => (e.querySelector('.tube__l') as HTMLElement).textContent!.trim())
    );
    expect(tubes).toEqual([
      'Blood culture', 'Coagulation', 'Serum', 'Heparin', 'EDTA', 'Glycolytic inhibitor',
    ]);
  });

  test('every room keeps its case-study link one focusable step away', async ({ page }) => {
    for (const slug of ['spellbomb', 'health-journal', 'phlebotomy', 'manifester', 'owcs', 'paper-animator']) {
      const links = page.locator(`[data-wk="${slug}"] a`);
      expect(await links.count(), `${slug} is one target, not three`).toBe(1);
    }
  });

  test('the reconstructions are decorative; the article carries the facts', async ({ page }) => {
    for (const sel of ['.tubes', '.tray', '.rows', '.fold__line', '.cite__mark', '.scene__fuse']) {
      const el = page.locator(sel).first();
      await expect(el).toHaveAttribute('aria-hidden', 'true');
    }
    const alts = await page.$$eval('.scene__shot', (els) => els.map((e) => (e.getAttribute('alt') || '').length));
    expect(alts.length).toBeGreaterThanOrEqual(8);
    expect(Math.min(...alts)).toBeGreaterThan(60);
  });
});

/* --- 7. the hard limits ---------------------------------------------------- */

test('the arrival is finite, and the first input ends it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await page.waitForTimeout(120);
  await page.mouse.move(400, 400);
  await page.mouse.down();
  await page.mouse.up();
  await expect(page.locator('.sig.is-settled')).toHaveCount(1, { timeout: 1500 });

  /* And with nothing touched at all, it still ends on its own. */
  const p2 = await page.context().newPage();
  await p2.goto('/index.html', { waitUntil: 'load' });
  await expect(p2.locator('.sig.is-settled')).toHaveCount(1, { timeout: 5000 });
  await p2.close();
});

test('Save-Data gets the whole hero and no module at all', async ({ browser }) => {
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
  expect(await page.locator('canvas').count()).toBe(0);

  /* And the object is still standing, because nothing about it needed a
     module in the first place. */
  await expect(page.locator('.holo__slice')).toHaveCount(18);
  const box = (await page.locator('.holo').boundingBox())!;
  expect(box.width).toBeGreaterThan(280);
  await ctx.close();
});

test('with motion turned off by the site’s own control, the hero still stands', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await page.locator('.masthead__in > [data-motion-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.waitForTimeout(600);

  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.locator('.holo__slice')).toHaveCount(18);
  /* The composition is intact; only the movement is gone. */
  const running = await page.$$eval(
    '.holo__spin, .holo__scan, .holo__plate, .holo__beam',
    (els) => els.filter((e) => getComputedStyle(e).animationName !== 'none').length
  );
  expect(running).toBe(0);
});

test('a visitor who ignores the hero entirely still gets the whole page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await ready(page);
  await expect(page.locator('.wk')).toHaveCount(6);
  await expect(page.locator('.vitals__cell')).toHaveCount(8);
  await page.locator('#w-paper-animator').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="paper-animator"] .scene__shot').first()).toBeVisible();
});
