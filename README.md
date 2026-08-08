# Portfolio-Hub

A single-scroll portfolio landing page for [cvree](https://github.com/cvree?tab=repositories) —
one HTML file, one stylesheet, one script, and no build step.

```
index.html          the whole page, semantic and complete on its own
assets/site.css     the design system: tokens, grid, type scale, motion states
assets/site.js      progressive enhancement, in four layers
assets/fonts/       self-hosted latin subsets (OFL)
assets/vendor/      Lenis, GSAP + ScrollTrigger, three.js, Vanta NET
```

Preview it with any static server:

```bash
python3 -m http.server 8000     # then open http://localhost:8000/
```

## What is on the page

Eleven sections read as one composition: a masthead, an index of all thirteen
repositories, five large project sections (OWCSComp.Tracker, Tiny Vials,
HealthJournal, Manifester, Remy Dee), a paired section for Phlebotomy Exam Prep
and TwoDo, a constellation of the smaller and private repositories, a method
section, and a closing invitation.

**Every claim on the page comes from the repository it describes** — its README,
its test counts, its stated limits. Where a repository is empty or private, the
page says so instead of inventing a description for it. Facts were read in
August 2026; if a project moves on, the copy should move with it.

## How the motion works

The page is built so that each layer can fail without taking the one below it
with it:

1. **No JavaScript.** Everything is in the HTML, fully readable and navigable.
2. **`assets/site.js` alone.** IntersectionObserver drives reveals, counters,
   the scrambled section labels, the pipeline diagram and the section marker.
   Nothing is hidden by CSS until the script has confirmed it will be shown
   again, and a failsafe reveals everything if a later error interrupts it.
3. **Lenis + GSAP** (vendored, not CDN-loaded) add smooth wheel scrolling, the
   wordmark entrance, scroll-linked parallax on the oversized numerals, and the
   masked closing lines. Touch scrolling stays native.
4. **three.js + Vanta NET** load last and only for the final section — and only
   on a fine-pointer device at least 1000px wide, with at least 4 GB of reported
   memory, without Save-Data, and never under reduced motion.

`prefers-reduced-motion: reduce` disables Lenis, the custom cursor, Vanta, every
transition and the marquee; the page becomes fully static with no content
withheld. Turning the preference on mid-visit is handled too.

## Accessibility notes

- Skip link, one `main` landmark, semantic headings in order.
- Every interactive element is a real link or button; focus rings are visible
  and drawn in the section's own accent.
- Body and annotation text is checked against WCAG AA on both the paper and ink
  surfaces; accent colours are used for large display type, borders and marks
  rather than small text.
- The pipeline diagram carries a text alternative and scrolls inside its own
  frame on narrow screens rather than shrinking its labels.
- Magnetism on buttons is capped at 7px and always moves toward the pointer.

## Deploying

`.github/workflows/pages.yml` verifies that every asset the page references
exists, then publishes the repository root to GitHub Pages on each push to
`main`.

**One-time setup:** Settings → Pages → Build and deployment → Source →
**GitHub Actions**. The workflow's own token cannot create the Pages site, so
the first run fails with *"Resource not accessible by integration"* until a
human flips that switch. Re-run the job afterwards and every push deploys on its
own.

## Third-party code

See [`assets/vendor/LICENSES.md`](assets/vendor/LICENSES.md). Libraries are
vendored rather than fetched from a CDN so the page has no third-party runtime
dependency — the same lesson the Remy Dee repository learned when a blocked font
host delayed its title screen by thirteen seconds.
