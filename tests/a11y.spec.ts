import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES } from './pages';

/* Axe on every generated page, at the two widths the site is designed for.
   Automated coverage is a floor, not a ceiling — keyboard.spec.ts is the part
   that checks what a scanner cannot.

   These are the slowest tests in the suite by a distance: each one walks a
   whole document, waits out every entrance the walk started, and then runs the
   full rule set over it — with the atmosphere plane rendering behind all of
   it, which on a CI machine with no GPU is software rasterisation of a
   full-viewport shader. The default thirty seconds is not a budget these were
   ever meant to be held to. */

for (const p of PAGES) {
  for (const [label, width] of [['desktop', 1440], ['mobile', 390]] as const) {
    test(`${p} (${label}): no serious or critical axe violations`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto(p, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1600);

      /* Scan the page a visitor actually reads, not the top of it. Sections
         below the fold reveal on intersection, so the scanner has to walk the
         document first — otherwise everything past the first screen is audited
         in a state nobody sees for more than a frame. */
      await page.evaluate(async () => {
        const step = Math.round(window.innerHeight * 0.8);
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });
      /* And let every entrance that the walk started actually finish. An
         element caught mid-fade is an element axe reads at a partial opacity,
         and a contrast rule run against a partial opacity is measuring the
         animation rather than the design. */
      await page.waitForTimeout(2600);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze();

      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
      ).toEqual([]);
    });
  }
}

/* The console is a dialog that is not in the document until it is opened, so
   the pass above never sees it. This is the same scanner, run over the one
   state on this site that a page walk cannot reach. */
for (const [label, width] of [['desktop', 1440], ['mobile', 390]] as const) {
  test(`the console (${label}): no serious or critical axe violations`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('index.html', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('[data-console-open]').first().click();
    await page.waitForSelector('.cons__row');
    await page.waitForTimeout(600);

    const rest = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      rest.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
    ).toEqual([]);

    /* And with a query in it, which is a different tree: groups, marks and a
       live count. */
    await page.keyboard.type('health');
    await page.waitForTimeout(500);
    const found = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    expect(
      found.violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
    ).toEqual([]);
  });
}
