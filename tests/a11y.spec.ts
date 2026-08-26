import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES } from './pages';

/* Axe on every generated page, at the two widths the site is designed for.
   Automated coverage is a floor, not a ceiling — keyboard.spec.ts is the part
   that checks what a scanner cannot. */

for (const p of PAGES) {
  for (const [label, width] of [['desktop', 1440], ['mobile', 390]] as const) {
    test(`${p} (${label}): no serious or critical axe violations`, async ({ page }) => {
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
      /* And let every entrance that the walk started actually finish. */
      await page.waitForTimeout(2200);

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
