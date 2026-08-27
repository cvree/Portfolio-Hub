import { test, expect } from '@playwright/test';

/* The résumé has to leave a browser's Print dialog as a two-page document.
   That is the assertion; everything else about the print stylesheet exists to
   make it true without dropping a single claim. */

function pageCount(pdf: Buffer) {
  const m = pdf.toString('latin1').match(/\/Count\s+(\d+)/);
  return m ? Number(m[1]) : -1;
}

test.describe('the printed résumé', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'page.pdf() is Chromium-only');

  for (const format of ['Letter', 'A4'] as const) {
    test(`prints to exactly two pages on ${format}`, async ({ page }) => {
      await page.goto('resume.html', { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const pdf = await page.pdf({ format, printBackground: false });
      expect(pageCount(pdf)).toBe(2);
    });
  }

  test('the cinematic layer and the navigation never reach paper', async ({ page }) => {
    await page.goto('resume.html', { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    /* The journey's spine, its nodes and its key are how a screen shows an
       order; a page shows the same order by being a page. None of them print. */
    for (const sel of ['.masthead', '.foot', '.atmos', '.grain', '.progress', '.no-print', '[data-motion-toggle]',
                       '.jour__node', '.jour-key']) {
      const n = await page.locator(`${sel}:visible`).count();
      expect(n, sel).toBe(0);
    }
  });

  test('the document itself survives, with its dates and its URLs', async ({ page }) => {
    await page.goto('resume.html', { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('h1')).toBeVisible();
    for (const text of ['Professional summary', 'Experience & education', 'Certifications', 'Research', 'Skills']) {
      await expect(page.getByRole('heading', { name: text })).toBeVisible();
    }
    await expect(page.getByText('Expected Dec 2026')).toBeVisible();
    /* Every entry of the journey reaches paper, in the order it is read in. */
    await expect(page.locator('.jour__row')).toHaveCount(8);
    const order = await page.$$eval('.jour__row .cv__role', (els) => els.map((e) => e.textContent?.trim()));
    expect(order[0]).toBe('Bachelor of Science, Health Science');
    expect(order[order.length - 1]).toBe('Computer Engineering coursework');
    /* The software is the site's subject, not the résumé's. */
    await expect(page.getByRole('heading', { name: 'Technical projects' })).toHaveCount(0);
    await expect(page.getByText('linkedin.com/in/connor-eppolito')).toBeVisible();
    /* Nothing collapsed, nothing clipped. */
    const clipped = await page.$$eval('main *', (els) =>
      els.filter((e) => {
        const c = getComputedStyle(e);
        return c.maxHeight !== 'none' && parseFloat(c.maxHeight) === 0;
      }).length
    );
    expect(clipped).toBe(0);
  });
});
