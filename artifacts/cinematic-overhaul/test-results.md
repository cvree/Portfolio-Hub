# Verification run

Everything below was run on this branch, at this commit, on Linux with
Chromium 141. Commands and their real output.

## `python3 tools/build_pages.py --check`

```
all pages are up to date
```

## `node tools/build_vendor.mjs --check`

```
checked assets/vendor/aperture.js  113.9 KB raw · 44.9 KB gzip
checked assets/vendor/atmosphere.js  48.9 KB raw · 15.0 KB gzip
vendor bundles are up to date
```

## `npx html-validate "*.html"`

```
(no output — 12 pages valid, exit 0)
```

## `node tools/calibrate_fallbacks.mjs`

```
Instrument Serif normal 400            at  64px  off by 0.05%
Instrument Serif italic 400            at  64px  off by 0.04%
Newsreader normal 400 500              at  18px  off by 0.12%
Newsreader normal 501 700              at  18px  off by 0.02%
Newsreader italic 400 700              at  18px  off by 0.11%
Space Grotesk normal 400               at  15px  off by 0.08%
Space Grotesk normal 500               at  15px  off by 0.00%
Space Grotesk normal 600 700           at  16px  off by 0.03%
IBM Plex Mono normal 400               at  12px  off by 0.02%

worst drift: 0.12%
(dry run — pass --write to correct assets/fonts.css)
```

## `npx playwright test` — 174 tests, Chromium

```
  174 passed (2.1m)
```

### What the suite covers

| File | Tests |
| --- | --- |
| `tests/structure.spec.ts` | one `h1` and no skipped heading levels on each of the 12 pages · `alt`, `width`, `height` and a meaningful alt string on every image · no duplicate `view-transition-name` in a document · no horizontal overflow at 390 / 768 / 1440 / 1920 px, checked per element with only genuine scroll and clip containers excused · no console errors · every internal link resolves · no request leaves the origin on any page |
| `tests/motion.spec.ts` | all 12 pages complete, navigable and screenshot-bearing with JavaScript disabled, with nothing hidden and no canvas · the hero is a composed frame with no blade covering the evidence · résumé and contact routes work without JS · reduced motion fetches neither cinematic bundle and creates no canvas, and every section is in its final state · no canvas at 390 px, under Save-Data, at 2 GB reported memory, or when memory is not reported at all · the motion control's accessible name, pressed state, effect on the renderer, and persistence across a reload |
| `tests/a11y.spec.ts` | Axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice`) on all 12 pages at 1440 px and at 390 px — 24 runs, zero serious or critical violations |
| `tests/keyboard.spec.ts` | first tab stops are the skip link, the wordmark, then the navigation · the skip link moves focus into `main` · a visible focus ring on everything reached by 14 tabs, counting a ring drawn on a project card around its title link · the mobile menu opens, closes on Escape and returns focus to its summary · the hero's case-study link is reachable and activatable by keyboard · a project card is one link, not three |
| `tests/mobile.spec.ts` | every control on all 12 pages is at least 44 px tall at 390 px, with inline links inside a sentence exempted and a project title exempted because its `::after` makes the whole card the target · a tap on the card's blurb navigates to the case study · landscape (844×390) keeps the menu reachable and the page inside its width · turning the system reduce-motion preference on mid-visit stops the renderer |
| `tests/print.spec.ts` | the résumé prints to exactly two pages on Letter and on A4 · no navigation, footer, atmosphere, progress bar, screen-only block or motion control reaches paper · every section heading, the dates and the URLs survive, and nothing is clipped |
| `tests/transitions.spec.ts` | `@view-transition` is declared · a card's name is answered by its case study's screenshot, title and accent · navigation completes well under a second and back/forward stay reliable |

### Browsers

`playwright.config.ts` defines chromium, firefox and webkit, selected with
`BROWSERS`. **Only Chromium was exercised here**: this sandbox's egress proxy
refuses Playwright's browser CDN, so `npx playwright install firefox webkit`
fails with `Download failure, code=1`. `.github/workflows/verify.yml` runs the
suite with `BROWSERS=chromium,firefox,webkit` on a GitHub runner, which can
reach the CDN. Cross-document view transitions are a progressive enhancement
and the suite asserts the un-enhanced path, so a browser without them is
covered by the same tests that cover a browser with them.

## `npx lhci autorun` — budgets

Both configurations assert: performance ≥ 90, accessibility = 100,
best practices ≥ 95, SEO ≥ 95, CLS ≤ 0.1, and (mobile) LCP ≤ 2500 ms. Three runs
per page; every assertion passes.

```
$ npx lhci autorun --config=lighthouserc.mobile.json
All results processed!

$ npx lhci autorun --config=lighthouserc.json
All results processed!
```

Medians are in `lighthouse-final.md`; the same runs against `b9994de` are in
`lighthouse-baseline.md`.

## Manual checks, done by hand rather than asserted

- Tabbed the home page, the Selected Work index and a case study end to end at
  1440 px and at 390 px. Focus order matches reading order; the ring is visible
  on every stop; nothing traps.
- Opened and closed the mobile menu at 390 px in portrait and at 844×390 in
  landscape. It opens with the script absent, closes on Escape, on an outside
  click and on navigation.
- Scrolled the Evidence Aperture with the wheel, with a trackpad and with the
  scrollbar dragged directly. The scrollbar keeps its meaning throughout; the
  sequence never resists, accelerates or holds the page.
- Switched the operating system's reduce-motion preference on mid-visit and
  confirmed the renderer stops rather than continuing behind a visitor who
  just asked it not to.
- Read every one of the twelve pages at 390 px with the shader gated off, which
  is what a phone gets.
