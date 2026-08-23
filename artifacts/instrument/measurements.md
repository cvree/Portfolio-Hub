# What must not regress — both columns, from real runs

Lighthouse: `npm run lh:mobile` / `npm run lh:desktop`, median of 3 runs per
page, laboratory measurements on the committed HTML. Tests: `npm test` on
Chromium. Font drift: `node tools/calibrate_fallbacks.mjs`.

| | Baseline `7cab138` | Final |
| --- | --- | --- |
| Lighthouse mobile, `index.html` | perf **98** · a11y **100** · BP **100** · SEO **100** | perf **98** · a11y **100** · BP **100** · SEO **100** |
| Lighthouse desktop, `index.html` | **100 / 100 / 100 / 100** | **100 / 100 / 100 / 100** |
| Mobile LCP · CLS · TBT | **2.27 s** · **0.000** · **0 ms** | **2.27 s** · **0.000** · **0 ms** |
| `index.html` transfer | **212 KB** | **212 KB** |
| Lazy cinematic JS | **59.9 KB gzip** (budget 100 KB) | **60.1 KB gzip** (budget 100 KB) |
| Playwright | **174 passing** | **207 passing** |
| Axe | **0 serious or critical**, 12 pages × 2 widths | **0 serious or critical**, 12 pages × 2 widths |
| Résumé print | **exactly 2 pages**, Letter and A4 | **exactly 2 pages**, Letter and A4 |
| Horizontal overflow | **none** at 390 / 768 / 1440 / 1920 | **none** at 390 / 768 / 1440 / 1920 |
| Fallback font drift | **≤ 0.12 %** | **≤ 0.12 %** |

## What moved, and by how much

Two numbers changed, both because the shared stylesheet and the home page's
markup grew to hold the six compositions. Neither is in the table above.

| | Baseline | Final | Δ |
| --- | --- | --- | --- |
| Mobile FCP, `index.html` | 1.37 s | 1.51 s | **+0.14 s** |
| `assets/site.css` | 17.1 KB gzip | 23.2 KB gzip | **+6.1 KB** |
| `index.html` | 10.3 KB gzip | 14.2 KB gzip | **+3.9 KB** |
| Mobile transfer, `work.html` | 140 KB | 147 KB | **+7 KB** |
| Mobile transfer, `phlebotomy-exam-prep.html` | 175 KB | 182 KB | **+7 KB** |
| Mobile transfer, `resume.html` | 149 KB | 156 KB | **+7 KB** |
| Mobile perf, `work.html` | 100 | 99 | **−1** |

The other eleven pages carry the +6.1 KB of stylesheet and nothing else: their
own HTML is byte-identical to the baseline. `work.html` losing a point of
mobile performance is that stylesheet arriving on the critical path; every
Lighthouse assertion still passes on every page, and a11y, best practices and
SEO are 100 across the board.

`index.html`'s own transfer came back to its baseline because the first work
row's screenshot was switched from `loading="eager"` to `loading="lazy"`. The
hero is taller than it was and that row is now well below the fold, so the
eager fetch was buying nothing and was competing for bandwidth with the LCP
image.

## Bundle weights

| Bundle | Raw | Gzip | Gate |
| --- | --- | --- | --- |
| `assets/vendor/aperture.js` | 113.9 KB | 44.9 KB | reduced motion, fine pointer, ≥1000 px, Save-Data |
| `assets/vendor/atmosphere.js` | 49.5 KB | 15.1 KB | the above, plus ≥4 GB reported memory and WebGL |
| `assets/vendor/channel.js` | 6.1 KB | 2.4 KB | Save-Data only |

No new package. `channel.js` has no dependency at all — it is bundled through
the same path as the other two so that exactly one mechanism puts JavaScript on
this site.
