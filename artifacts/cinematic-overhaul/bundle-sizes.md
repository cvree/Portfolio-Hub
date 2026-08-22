# Bundle sizes

What a browser actually downloads, at `b9994de` and at this commit.

## On disk

| Asset | Baseline | Final | Δ |
| --- | --- | --- | --- |
| `index.html` | 27.9 KB | 40.5 KB | +12.6 KB |
| `assets/site.css` | 37.7 KB | 67.5 KB | +29.9 KB |
| `assets/fonts.css` (now inlined into each page) | 3.6 KB | 7.1 KB | +3.5 KB |
| `assets/site.js` — the only script in the critical path | 5.2 KB | 11.1 KB | +5.9 KB |
| All font faces | 303.8 KB | 139.1 KB | **−164.6 KB** |
| Lazy cinematic bundles | — | 162.8 KB | +162.8 KB (never in the critical path) |

## Over the wire, gzipped

| Asset | Gzip | In the critical path? |
| --- | --- | --- |
| `assets/site.css` | 16.4 KB | yes — one blocking stylesheet |
| `assets/site.js` | 3.7 KB | yes — deferred, ~4.2 KB transferred |
| `assets/vendor/aperture.js` (GSAP + ScrollTrigger) | 44.7 KB | no |
| `assets/vendor/atmosphere.js` (OGL) | 14.8 KB | no |

Combined lazy cinematic JavaScript: **59.5 KB gzip**, against a budget of
100 KB. It is dynamically imported after `load`, only on the page that declares
an aperture, and only when the viewport, pointer, reported memory, Save-Data and
motion-preference gates all pass — so a phone, a reduced-motion visitor and a
Save-Data visitor download none of it.

## What a page actually transfers

Measured by Lighthouse (mobile, median of three), total bytes over the wire:

| Page | Baseline | Final | Δ |
| --- | --- | --- | --- |
| `index.html` | 391 KB | 212 KB | **−179 KB** |
| `work.html` | 306 KB | 140 KB | **−166 KB** |
| `phlebotomy-exam-prep.html` | 438 KB | 175 KB | **−263 KB** |
| `resume.html` | 304 KB | 148 KB | **−156 KB** |

The stylesheet grew by 30 KB of source and about 6 KB gzipped, and the site
still transfers roughly 40% less than it did, because the fonts and the
screenshots both got smaller:

- **Fonts, 304 KB → 139 KB.** Newsreader was a two-axis variable font; the
  optical-size axis is now pinned at the one reading size the site sets and the
  weight axis clipped to 400–700 (129 KB → 39 KB, and the italic 62 KB → 22 KB).
  `SpaceGrotesk-400.woff2` and `SpaceGrotesk-700.woff2` turned out to be the
  same variable font served twice under different names alongside a static
  500 — three requests totalling 56 KB, now one 22 KB file.
- **Screenshots.** `tools/build_images.mjs` writes 720 px and 1280 px
  renditions beside every original; the originals are untouched and are still
  what a wide display gets. A 390 px phone was being handed 2400 px captures.
