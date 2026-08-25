import { test, expect, Page } from '@playwright/test';

/* ONE SIGNAL.
   ---------------------------------------------------------------------------
   The hero is a three-position control over a monogram, and a control has to
   answer to all five inputs before it is allowed to exist: pointer, touch,
   keyboard, reduced motion and no JavaScript. What follows is the proof, one
   input at a time, plus the four hard limits — nothing that only an animation
   can reveal, no fact that only an interaction can reach, no control on screen
   that cannot work, and no interaction that delays a navigation. */

const DOMAINS = [
  { slug: 'care', name: 'Care', hex: '#17a08f', rgb: 'rgb(23, 160, 143)' },
  { slug: 'build', name: 'Build', hex: '#5b7cf0', rgb: 'rgb(91, 124, 240)' },
  { slug: 'compete', name: 'Compete', hex: '#d9a94a', rgb: 'rgb(217, 169, 74)' },
];

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

/* The radio itself is visually hidden, so a visitor presses its label and so
   does this suite. */
async function pick(page: Page, slug: string) {
  await page.locator(`.dom__opt:has([data-dom="${slug}"])`).click();
}

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.sig.is-settled')).toHaveCount(1, { timeout: 10000 });
}

/* --- 1. no JavaScript ------------------------------------------------------
   All three domains stand open as a proof row. Not a dead widget, not a
   disabled control, not a placeholder — the design. */

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('all three domains are open, and every proof is readable', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.locator('.proof')).toHaveCount(3);
    for (const d of DOMAINS) {
      const group = page.locator(`[data-proof="${d.slug}"]`);
      await expect(group).toBeVisible();
      await expect(group.locator('.proof__list li')).toHaveCount(3);
      for (let i = 0; i < 3; i++) await expect(group.locator('.proof__list li').nth(i)).toBeVisible();
    }
  });

  test('no control is on screen that could not work', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.locator('.dom')).toBeHidden();
    expect(await page.locator('.dom__opt:visible').count()).toBe(0);
    /* The same rule for the two switches in the masthead: a sound control with
       no script behind it, and a motion control with no motion to stop. */
    expect(await page.locator('[data-sound-toggle]:visible').count()).toBe(0);
    expect(await page.locator('[data-motion-toggle]:visible').count()).toBe(0);
  });

  test('the sculpture is assembled and the trace is a complete path', async ({ page }) => {
    await page.goto('index.html');
    /* Every plane is drawn, at a weight that reads, with no starting state
       left applied by an absent script. */
    for (const plane of ['care', 'build', 'compete']) {
      const g = page.locator(`[data-plane="${plane}"]`);
      await expect(g).toBeVisible();
      const style = await g.evaluate((e) => {
        const c = getComputedStyle(e);
        const m = new DOMMatrixReadOnly(c.transform === 'none' ? undefined : c.transform);
        return { o: Number(c.opacity), x: m.e, y: m.f, sx: m.a };
      });
      expect(style.o).toBeGreaterThan(0.45);
      /* Nothing is left translated out of place by a script that never ran.
         The active plane's 1.4% lift is a declared state, not a start state. */
      expect(Math.abs(style.x)).toBeLessThan(0.5);
      expect(Math.abs(style.y)).toBeLessThan(0.5);
      expect(style.sx).toBeGreaterThan(0.99);
    }
    const box = (await page.locator('.ce').boundingBox())!;
    expect(box.width).toBeGreaterThan(200);
    expect(box.height).toBeGreaterThan(140);
    /* And the pixels are actually there: a fully clipped object is
       indistinguishable from an assembled one in the DOM but not on screen. */
    const painted = await page.locator('.ce').screenshot();
    expect(painted.byteLength).toBeGreaterThan(4000);
  });

  test('the name and both actions are readable without any animation', async ({ page }) => {
    await page.goto('index.html');
    await expect(page.locator('h1')).toContainText('Connor');
    for (const sel of ['.sig__title', '.sig__creed', '.sig__stance', '.sig__actions', '.sig__links']) {
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

  test('no Order of Draw capture appears above Selected Works', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    const worksTop = await page.locator('[data-theatre]').evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
    const early = await page.$$eval('img', (imgs, top) =>
      imgs
        .filter((i) => i.getBoundingClientRect().top + window.scrollY < (top as number))
        .map((i) => i.getAttribute('src') || ''),
      worksTop
    );
    expect(early.filter((s) => /order-of-draw|phlebotomy/.test(s))).toEqual([]);
    /* Nothing at all is a raster above the work — the hero is geometry. */
    expect(early).toEqual([]);
  });

  test('the identity hero holds no raster image of any kind', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    expect(await page.locator('.sig img').count()).toBe(0);
    expect(await page.locator('.sig svg').count()).toBeGreaterThanOrEqual(2);
  });
});

/* --- 3. the keyboard ------------------------------------------------------
   Real radio inputs in a real fieldset, so the arrow keys, the roving focus
   and the announced state are the browser's rather than a re-implementation
   of them. These assert that the browser's behaviour actually reaches the
   page's state. */

test.describe('the keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await ready(page);
  });

  test('the domains are a labelled group of radios', async ({ page }) => {
    /* A fieldset of radios is a group; the three inputs share a name, so the
       browser gives them the radio-group behaviour and the announced position
       within it. Nothing here re-implements either. */
    const group = page.getByRole('group', { name: /choose a domain/i });
    await expect(group).toHaveCount(1);
    await expect(page.getByRole('radio')).toHaveCount(3);
    for (const d of DOMAINS) {
      await expect(page.getByRole('radio', { name: new RegExp(d.name, 'i') })).toHaveCount(1);
    }
    await expect(page.getByRole('radio', { name: /care/i })).toBeChecked();
  });

  test('arrow keys move between domains and commit as they go', async ({ page }) => {
    await page.getByRole('radio', { name: /care/i }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.sig')).toHaveAttribute('data-domain', 'build');
    await expect(page.getByRole('radio', { name: /build/i })).toBeChecked();
    await expect(page.locator('[data-proof="build"]')).toBeVisible();
    await expect(page.locator('[data-proof="care"]')).toBeHidden();

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.sig')).toHaveAttribute('data-domain', 'compete');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.sig')).toHaveAttribute('data-domain', 'build');
  });

  test('the focused control shows a focus ring at least as clear as its hover', async ({ page }) => {
    await page.getByRole('radio', { name: /build/i }).focus();
    const outline = await page.locator('.dom__opt').nth(1).evaluate((e) => getComputedStyle(e).outlineWidth);
    expect(parseFloat(outline)).toBeGreaterThanOrEqual(2);
  });

  test('the URL and the history are never touched', async ({ page }) => {
    const before = page.url();
    const len = await page.evaluate(() => history.length);
    await page.getByRole('radio', { name: /compete/i }).focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    expect(page.url()).toBe(before);
    expect(await page.evaluate(() => history.length)).toBe(len);
  });

  test('tabbing reaches every room and Enter opens the case study', async ({ page }) => {
    const link = page.locator('.wk__t a').first();
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(/spellbomb\.html$/, { timeout: 15000 });
    await expect(page.locator('h1')).toBeVisible();
  });
});

/* --- 4. the state change --------------------------------------------------- */

test.describe('choosing a domain', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await ready(page);
  });

  for (const d of DOMAINS) {
    test(`${d.slug}: accent, plane, trace and proof all move together`, async ({ page }) => {
      await pick(page, d.slug);
      await expect(page.locator('.sig')).toHaveAttribute('data-domain', d.slug);

      /* One accent, and it is the domain's own. */
      const accent = await page.locator('.sig').evaluate((e) =>
        getComputedStyle(e).getPropertyValue('--accent').trim()
      );
      expect(accent.toLowerCase()).toBe(d.hex);
      /* The trace is retuned over about half a second, so this is what it
         settles on rather than what it is passing through. */
      await expect
        .poll(() => page.locator('[data-trace]').evaluate((e) => getComputedStyle(e).stroke), { timeout: 4000 })
        .toBe(d.rgb);

      /* The chosen plane comes forward and the other two recede — but they are
         still drawn, because the CE has to hold as one object in every state. */
      const weights = await page.evaluate(() =>
        ['care', 'build', 'compete'].map((n) =>
          Number(getComputedStyle(document.querySelector(`[data-plane="${n}"]`)!).opacity)
        )
      );
      const idx = DOMAINS.findIndex((x) => x.slug === d.slug);
      expect(weights[idx]).toBeGreaterThan(0.95);
      for (let i = 0; i < 3; i++) {
        if (i === idx) continue;
        expect(weights[i]).toBeLessThan(weights[idx]);
        expect(weights[i], 'an inactive plane is still drawn').toBeGreaterThan(0.35);
      }

      /* Exactly one proof group stands, and it is the one that was chosen. */
      await expect(page.locator('.proof[data-active]')).toHaveCount(1);
      await expect(page.locator(`[data-proof="${d.slug}"]`)).toBeVisible();
    });
  }

  test('the state is persistent and unambiguous, not a hover preview', async ({ page }) => {
    await pick(page, 'compete');
    await page.mouse.move(200, 700);
    await page.mouse.move(1200, 300);
    await page.waitForTimeout(400);
    await expect(page.locator('.sig')).toHaveAttribute('data-domain', 'compete');
    await expect(page.getByRole('radio', { name: /compete/i })).toBeChecked();
  });

  test('nothing on the hero depends on hovering', async ({ page }) => {
    const hoverOnly = await page.evaluate(() => {
      const out: string[] = [];
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of Array.from(rules)) {
          const sel = (rule as CSSStyleRule).selectorText;
          if (!sel || !/:hover/.test(sel)) continue;
          if (!/\.sig|\.ce|\.dom|\.proof/.test(sel)) continue;
          /* A hover rule is fine as long as the same selector has a focus or a
             checked twin somewhere. */
          const twin = sel.replace(/:hover/g, ':focus-visible');
          const has = Array.from(rules).some((r) => (r as CSSStyleRule).selectorText === twin);
          const stateful = /\[aria-checked|:has\(input:checked\)|\[data-domain/.test(sel);
          if (!has && !stateful) out.push(sel);
        }
      }
      return out;
    });
    /* Every remaining hover on the hero is a decorative colour shift on an
       element whose real state is carried by the radio it belongs to. */
    for (const sel of hoverOnly) expect(sel).toMatch(/\.dom__opt|\.sig__handle|\.sig__links/);
  });
});

/* --- 5. touch and the coarse pointer -------------------------------------- */

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('tap commits, and every domain target clears 44 px', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    await ready(page);
    for (const d of DOMAINS) {
      const label = page.locator(`.dom__opt:has([data-dom="${d.slug}"])`);
      const box = (await label.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      await label.tap();
      await expect(page.locator('.sig')).toHaveAttribute('data-domain', d.slug);
      await expect(page.locator(`[data-proof="${d.slug}"]`)).toBeVisible();
    }
  });

  test('the media stage is never pinned, and every scene sits with its copy', async ({ page }) => {
    await page.goto('index.html', { waitUntil: 'load' });
    const sticky = await page.$$eval('.scene', (els) =>
      els.filter((e) => getComputedStyle(e).position === 'sticky').length
    );
    expect(sticky).toBe(0);

    /* Each scene is inside the article whose facts it shows. */
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
    for (const [i, slug] of ['spellbomb', 'health-journal', 'phlebotomy', 'manifester', 'owcs', 'paper-animator'].entries()) {
      await page.locator(`#w-${slug}`).scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 1);
      await expect(page.locator(`[data-rail="${slug}"]`)).toHaveAttribute('aria-current', 'true', { timeout: 6000 });
      await expect(page.locator('[data-rail-n]')).toHaveText(String(i + 1).padStart(2, '0'));
      /* Exactly one at a time. */
      expect(await page.locator('[data-rail][aria-current="true"]').count()).toBe(1);
      /* And the spine has filled to match. */
      const spine = await page.locator('[data-spine]').evaluate((e) => e.style.getPropertyValue('--spine'));
      expect(Number(spine)).toBeCloseTo((i + 1) / 6, 5);
    }
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
    /* The failure this replaces: a wrapper carrying one <img> was told to
       sort and to sequence. If a scene promises ordering, the things being
       ordered have to exist. */
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

    /* The six cards that claim to sort actually start somewhere else. */
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
    /* Every capture that is in the tree carries a real description of itself. */
    const alts = await page.$$eval('.scene__shot', (els) => els.map((e) => (e.getAttribute('alt') || '').length));
    expect(alts.length).toBeGreaterThanOrEqual(8);
    expect(Math.min(...alts)).toBeGreaterThan(60);
  });
});

/* --- 7. the hard limits ---------------------------------------------------- */

test('the arrival is finite, and the first input ends it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  /* Not settled the instant the document loads — there is a sequence. */
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

test('every fact in the proof panel is reachable without an interaction', async ({ page }) => {
  /* With no script all three groups are open. This is the assertion that the
     enhanced version never becomes the only way to reach one of them. */
  await page.goto('index.html');
  const home = page.url();
  const ctx = await page.context().browser()!.newContext({ javaScriptEnabled: false });
  const still = await ctx.newPage();
  await still.goto(home);
  const openText = (await still.locator('.proofs').innerText()).replace(/\s+/g, ' ');
  await ctx.close();

  await page.goto('index.html', { waitUntil: 'load' });
  await ready(page);
  let seen = '';
  for (const d of DOMAINS) {
    await pick(page, d.slug);
    seen += ' ' + (await page.locator('.proof[data-active]').innerText());
  }
  seen = seen.replace(/\s+/g, ' ');
  for (const sentence of openText.split('. ').filter((s) => s.trim().length > 24)) {
    expect(seen).toContain(sentence.trim().slice(0, 40));
  }
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

  /* The control still works, because withholding a control is not the same as
     withholding an effect. */
  await page.locator('.dom__opt:has([data-dom="build"])').click();
  await expect(page.locator('.sig')).toHaveAttribute('data-domain', 'build');
  await expect(page.locator('[data-proof="build"]')).toBeVisible();
  await ctx.close();
});

test('with motion turned off by the site’s own control, the hero still works', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('index.html', { waitUntil: 'load' });
  await page.locator('.masthead__in > [data-motion-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');

  await pick(page, 'compete');
  await expect(page.locator('.sig')).toHaveAttribute('data-domain', 'compete');
  await expect(page.locator('[data-proof="compete"]')).toBeVisible();

  /* Instant, not animated: no starting state is applied at all. */
  const tuning = await page.locator('.sig').evaluate((e) => e.classList.contains('is-tuning'));
  expect(tuning).toBe(false);
  expect(await page.locator('canvas').count()).toBe(0);
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
