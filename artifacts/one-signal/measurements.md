# What it cost — both columns, from real runs

Lighthouse: `npm run lh:mobile` / `npm run lh:desktop`, median of 3 runs per
page, Chromium. Tests: `npx playwright test` on Chromium.

The baseline column is read from `artifacts/instrument/measurements.md`, which
is the recorded state of `main` at `999adaa`.

| | Baseline `999adaa` | ONE SIGNAL | Δ |
| --- | --- | --- | --- |
| Lighthouse mobile, `index.html` | 97 · 100 · 100 · 100 | **98 · 100 · 100 · 100** | +1 |
| Lighthouse desktop, `index.html` | 100 / 100 / 100 / 100 | **100 / 100 / 100 / 100** | — |
| Mobile LCP | 2.41 s | **2.27 s** | −0.14 s |
| Mobile FCP | 1.51 s | **1.51 s** | — |
| Mobile CLS | 0.000 | **0.000** | — |
| Mobile TBT | 0 ms | **0 ms** | — |
| Desktop LCP | — | **0.50 s** | |
| Desktop TBT | — | **0 ms** | |
| `index.html` transfer | 219 KB | **202 KB** | **−17 KB** |
| Lazy bundles | 60.0 KB gzip | **16.4 KB gzip** | **−43.6 KB** |
| Playwright | 207 (206 passing) | **244 passing** | +38, and green |
| Axe, all 12 pages × 2 widths | 0 serious/critical | **0 serious/critical** | — |
| Résumé print | exactly 2 pages | **exactly 2 pages** | — |
| Horizontal overflow | none | **none at 390 / 768 / 1440 / 1920** | — |

## Against the brief's floors

| Budget | Required | Measured |
| --- | --- | --- |
| Mobile performance | ≥ 0.95 | **0.98** |
| Desktop performance | ≥ 0.98 | **1.00** |
| Accessibility | 1.00 | **1.00** |
| Best Practices | ≥ 0.95 | **1.00** |
| SEO | ≥ 0.95 | **1.00** |
| LCP | ≤ 2.5 s | **2.27 s** mobile · **0.50 s** desktop |
| CLS | ≤ 0.10 | **0.000** |
| Desktop TBT | ≤ 200 ms | **0 ms** |
| Critical transfer + eager JS/CSS | ≤ +10% of baseline | **−8%** (202 KB vs 219 KB) |
| No category more than 2 points below baseline | — | **none lost; mobile performance gained 1** |

## Why it got faster while doing more

**GSAP was removed, and nothing replaced it.** It earned its 44.8 KB gzip when
the hero was a pinned, scrubbed ScrollTrigger timeline that had to stay in step
with the scroll position across five elements. The hero is no longer a scrubbed
timeline: every motion in the redesign is a finite transition that plays once
and settles, which is what CSS keyframes express natively — off the main thread,
at no scripting cost, and with the composed final frame as the state that
renders when motion is refused.

That is the whole of the −43.6 KB on the lazy bundles. The −17 KB on the
critical transfer of `index.html` is the hero's raster: the old first viewport
preloaded a 1280 px WebP of the Order of Draw drill at `fetchpriority="high"`.
The new one is SVG geometry in the document, so the LCP element is text and the
preload is gone.

The pulse layer and the contact card put about 7 KB back onto that figure, all
of it stylesheet — `assets/site.css` is render-blocking on every page. Nothing
was added to the critical path in script: the pulse layer is a lazy bundle
behind the same gates as the shader, and it builds nothing until after `load`.
Mobile performance, LCP, FCP, TBT and CLS are all unchanged by it.

| Bundle | Raw | Gzip | Gate |
| --- | --- | --- | --- |
| `assets/vendor/pulse.js` | 3.3 KB | **1.3 KB** | motion allowed, not Save-Data |
| `assets/vendor/atmosphere.js` | 49.5 KB | **15.1 KB** | the above, plus a fine pointer, ≥1000 px, WebGL and ≥4 GB reported memory |

Neither is requested until after `load`. Neither is required for any page to be
complete.

## Known limitations

- **Firefox and WebKit were not exercised in this environment.** Playwright
  could not download either engine through the agent proxy
  (`Download failure, code=1`). Chromium was run in full. The repository's own
  CI job runs `BROWSERS=chromium,firefox,webkit` on every push, so the
  cross-browser gate is enforced there rather than here.
- Lighthouse numbers are laboratory measurements on this runner, not field data.
- The three Instagram motion references in the brief require an authenticated
  session and could not be opened. Nothing was invented about their contents.
