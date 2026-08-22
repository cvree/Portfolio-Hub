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
