# Portfolio-Hub

A single-scroll portfolio landing page for [cvree](https://github.com/cvree?tab=repositories) —
one HTML file, one stylesheet, one script, and no build step.

```
index.html          the whole page, semantic and complete on its own
assets/site.css     the design system: tokens, grid, type scale, motion states
assets/site.js      progressive enhancement, in four layers
assets/projects/    real screenshots of the four flagship projects (WebP + PNG)
assets/fonts/       self-hosted latin subsets (OFL)
assets/vendor/      Lenis, GSAP + ScrollTrigger, three.js, Vanta NET
```

Preview it with any static server:

```bash
python3 -m http.server 8000     # then open http://localhost:8000/
```

## What is on the page

The page is organised around **hierarchy, not inventory**. A masthead
introduces the kinds of products rather than a repository count, then:

1. **Featured Work** — an index that visibly separates four flagship projects
   from everything else.
2. Four large case studies, in this order: **SpellBomb**, **Health Journal**,
   **OWCS Comp Tracker**, **Manifester**. Each opens with a real screenshot of
   the running application, captioned with exactly what moment it shows.
3. **More Projects** — Tiny Vials, Remy Dee, Phlebotomy Exam Prep and TwoDo, as
   medium editorial cards.
4. **Experiments** — four repositories that are a name and a date, plus this
   one as a closing note.
5. A method section and a closing invitation.

Two of the secondary projects still carry a small instrument rather than a
screenshot: an insertion-angle gauge that settles from too-steep into Tiny
Vials' graded window, and a term builder that demonstrates Remy Dee's premise in
one button — two parts you know, one term you do not.

**Every claim on the page comes from the repository it describes** — its README,
its test counts, its stated limits. Where a repository is private or empty, the
page says so instead of inventing a description or a dead link. Facts were read
in August 2026; if a project moves on, the copy should move with it.

## The screenshots

`assets/projects/` holds one hero image per flagship project plus one supporting
still, served as WebP with the lossless PNG kept beside each hero. None of them
is a mockup, a logo, a landing page or an empty state — every one was captured
from the application actually running:

| Project | Hero | How it was captured |
| --- | --- | --- |
| SpellBomb | `hero-spellbomb-game.webp` | A real six-player match against a running `server.js`: six independent browser contexts join one room over Socket.IO and play, driven by Playwright. |
| Health Journal | `hero-health-journal-dashboard.webp` | The production build with the app's own "Load example data" set (~34 days) plus a real check-in completed for the day, at the phone width the app is designed for. |
| OWCS Comp Tracker | `hero-owcs-review.webp` | The Review screen served from the repository, on the committed Al Qadsiah vs Twisted Minds Nepal dataset. |
| Manifester | `hero-manifester-player.webp` | The expanded player, eight passes into a live ten-minute session built in the app's own editor. |

Wide 16:10 captures scroll inside their own frame below 700px rather than
shrinking their UI text to nothing — the same treatment the pipeline diagram
already used. The tall Health Journal captures are left at their natural width,
because a single narrow column is what that app's layout actually is.

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

The custom cursor replaces the system pointer rather than doubling it: the
script adds `has-cursor` to `<html>` only once the ring is actually running, so
a no-JS visit, a touch device or reduced motion always keeps the real cursor.

`prefers-reduced-motion: reduce` disables Lenis, the custom cursor, Vanta, every
transition and the marquee; the page becomes fully static with no content
withheld. Turning the preference on mid-visit is handled too.

## Accessibility notes

- Skip link, one `main` landmark, semantic headings in order.
- Every interactive element is a real link or button; focus rings are visible
  and drawn in the section's own accent.
- Every screenshot carries descriptive `alt` text naming what is on screen, and
  declares its intrinsic `width`/`height` so nothing shifts as it loads. Only
  the first flagship hero loads eagerly; the rest are lazy.
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
