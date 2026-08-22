# The cinematic overhaul — evidence

Matched captures, measurements and test results for the change that turned this
portfolio into the Evidence Aperture release.

- **Baseline commit:** `b9994de4f55cc08676f5116f331b5fe09ce2c15c`
- **Captured with:** Playwright 1.62.1 driving Chromium 141, `tools/shots.mjs`
- **Measured with:** Lighthouse CI 0.15.1, three runs per page, median reported

Every image in `baseline/` and `final/` was taken by the same script at the same
viewport, scroll position and device pixel ratio, then re-encoded to WebP at one
CSS pixel per image pixel by `tools/pack_evidence.mjs`. Nothing is cropped,
retouched or composed.

## Before and after

| Frame | Baseline | Final |
| --- | --- | --- |
| Home, desktop 1440×900 | `baseline/home-desktop.webp` | `final/home-desktop.webp` |
| Home, desktop, full page | `baseline/home-desktop-full.webp` | `final/home-desktop-full.webp` |
| Home, mobile 390×844 | `baseline/home-mobile.webp` | `final/home-mobile.webp` |
| Home, mobile, full page | `baseline/home-mobile-full.webp` | `final/home-mobile-full.webp` |
| Phlebotomy Exam Prep, desktop | `baseline/case-desktop.webp` | `final/case-desktop.webp` |
| Phlebotomy Exam Prep, mobile | `baseline/case-mobile.webp` | `final/case-mobile.webp` |
| Selected Work, desktop | `baseline/work-desktop.webp` | `final/work-desktop.webp` |
| Résumé, desktop | `baseline/resume-desktop.webp` | `final/resume-desktop.webp` |

## The three guaranteed states

| State | Baseline | Final |
| --- | --- | --- |
| Reduced motion, home desktop | `baseline/home-desktop-reduced.webp` | `final/home-desktop-reduced.webp` |
| Reduced motion, home mobile | `baseline/home-mobile-reduced.webp` | `final/home-mobile-reduced.webp` |
| JavaScript disabled, home desktop | `baseline/home-desktop-nojs.webp` | `final/home-desktop-nojs.webp` |
| JavaScript disabled, home mobile | `baseline/home-mobile-nojs.webp` | `final/home-mobile-nojs.webp` |
| JavaScript disabled, case study | `baseline/case-desktop-nojs.webp` | `final/case-desktop-nojs.webp` |

## The résumé, printed

`baseline/resume.pdf` and `final/resume.pdf`, rendered from the same page
through Chromium's print pipeline at US Letter.

| | Baseline | Final |
| --- | --- | --- |
| Letter | **5 pages** | **2 pages** |
| A4 | **4 pages** | **2 pages** |

The baseline README claimed a two-page résumé; it did not produce one. The print
stylesheet now sets the document at 8.8 pt with the technical-projects section in
two columns, and `tests/print.spec.ts` asserts the page count on both paper
sizes so the claim cannot drift again. No content was dropped for paper: every
section, entry, bullet, date and URL that is on screen is on the page.

## Measurements

- `lighthouse-baseline.md` — the site at `b9994de`
- `lighthouse-final.md` — the site at this commit

Both are medians of three runs per page, collected by Lighthouse CI against a
gzip-serving static host, on the same machine, minutes apart. They are
**laboratory measurements under simulated throttling**, not field data. INP is a
field metric and is not reported here; total blocking time is, and is 0 ms on
every page in both runs.

## Other records

- `asset-manifest.md` — every screenshot, where it appears, its intrinsic size,
  its responsive derivatives, its alt text, its loading strategy and the
  view-transition name it carries
- `bundle-sizes.md` — what the browser downloads, before and after
- `test-results.md` — the full verification run
- `../../assets/vendor/NOTICE.md` — every added package, version, licence and
  weight, and why it is there
