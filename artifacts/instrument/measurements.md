# What it cost — both columns, from real runs

Lighthouse: `npm run lh:mobile` / `npm run lh:desktop`, median of 3 runs per
page. Tests: `npm test` on Chromium. Font drift:
`node tools/calibrate_fallbacks.mjs`.

The performance budget was lifted deliberately for this pass. These numbers are
here because a measurement is worth more than a claim, not because everything
in the table held.

| | Baseline `7cab138` | The instrument `0f268ca` | The pulse |
| --- | --- | --- | --- |
| Lighthouse mobile, `index.html` | 98 · 100 · 100 · 100 | 98 · 100 · 100 · 100 | **97 · 100 · 100 · 100** |
| Lighthouse desktop, `index.html` | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | **100 / 100 / 100 / 100** |
| Mobile LCP | 2.27 s | 2.27 s | **2.41 s** |
| Mobile CLS | 0.000 | 0.000 | **0.000** |
| Mobile TBT | 0 ms | 0 ms | **0 ms** |
| Mobile FCP | 1.37 s | 1.51 s | **1.51 s** |
| `index.html` transfer | 212 KB | 212 KB | **219 KB** |
| Lazy cinematic JS | 59.9 KB gzip | 60.1 KB gzip | **60.0 KB gzip** |
| The control module | — | 2.4 KB gzip | **2.5 KB gzip** |
| Playwright | 174 passing | 207 passing | **207 passing** |
| Axe | 0 serious/critical | 0 serious/critical | **0 serious/critical** |
| Résumé print | exactly 2 pages | exactly 2 pages | **exactly 2 pages** |
| Horizontal overflow | none | none | **none at 390 / 768 / 1440 / 1920** |
| Fallback font drift | ≤ 0.12 % | ≤ 0.12 % | **≤ 0.12 %** |

## What moved, and why

**Mobile performance 98 → 97, LCP 2.27 s → 2.41 s, transfer 212 → 219 KB.**
All of it is the stylesheet: `assets/site.css` carries the pulse, the rail, the
spine, the cut, the sound control and the broken frame, and it is render
blocking on every page. Nothing was added to the critical path in script — the
sound layer lives in `site.js` and builds nothing until it is pressed, and both
cinematic bundles are unchanged behind the same gates.

Accessibility, best practices and SEO are 100 on every page measured, on both
form factors. CLS is still 0.000 and TBT is still 0 ms: none of this shifts
layout and none of it blocks the main thread.

**The other eleven pages** carry the same stylesheet, so their transfer moved by
the same ~7 KB. The six case studies additionally carry their own rail — one
`<svg>`, one path, about 400 bytes of markup each.

## Bundle weights

| Bundle | Raw | Gzip | Gate |
| --- | --- | --- | --- |
| `assets/vendor/aperture.js` | 113.6 KB | 44.8 KB | reduced motion, fine pointer, ≥1000 px, Save-Data |
| `assets/vendor/atmosphere.js` | 49.5 KB | 15.1 KB | the above, plus ≥4 GB reported memory and WebGL |
| `assets/vendor/channel.js` | 6.5 KB | 2.5 KB | Save-Data only |

No new package. The sound layer has no dependency and no assets: every tone is
an oscillator and an envelope built in the browser at the moment it is needed.
