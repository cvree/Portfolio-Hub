# Portfolio-Hub

The portfolio and online résumé of **Connor Eppolito** — Health Science ·
NREMT-certified EMT · product builder · esports leader.

Twelve static pages, four self-hosted typefaces, one stylesheet and one small
script. No framework, no bundler, no CDN in the critical path, and no
third-party runtime dependency of any kind.

```
index.html                  Home — the ten seconds
work.html                   Selected Work — the index
spellbomb.html              ┐
health-journal.html         │
phlebotomy-exam-prep.html   │ six case studies, one per flagship product
manifester.html             │
owcs-comp-tracker.html      │
paper-animator.html         ┘
experience.html             Roles, education, certifications, research
about.html                  How I work, and what I want a screen to feel like
resume.html                 The document — typeset for screen and for paper
contact.html                Email, LinkedIn, GitHub, and the practical details

assets/site.css             The design system: tokens, layout, type, motion, print
assets/site.js              Progressive enhancement, ~150 lines, three jobs
assets/fonts/               Self-hosted latin subsets (SIL OFL)
assets/projects/            Real screenshots of the six products (WebP)

pages/*.html                Page bodies + front-matter
templates/base.html         The shared <head>, masthead, navigation and footer
tools/build_pages.py        Assembles pages/ + templates/ into the root HTML
```

Preview it with any static server:

```bash
python3 -m http.server 8000     # then open http://localhost:8000/
```

## Editing it

The twelve HTML files in the repository root are **generated**, and they are what
GitHub Pages serves — so a visitor never waits on a build and the site works
opened straight off a disk. To change something:

```bash
# edit pages/<page>.html   (the body)      or
# edit templates/base.html (the chrome)    then:
python3 tools/build_pages.py
```

`python3 tools/build_pages.py --check` fails if the committed HTML is not what
the sources would produce; CI runs it on every push and pull request. That is
the whole reason the generator exists — twelve copies of a navigation bar drift
apart, and one copy does not.

Each page fragment opens with a small front-matter block:

```html
<!--meta
path: work.html
title: Selected Work — Connor Eppolito
nav: work                 which navigation item is current
surface: ink | paper      near-black, or the warm ivory document surface
accent: spellbomb         the per-page accent colour
desc: ...                 meta description and Open Graph description
-->
```

## What is on the site

**The ten seconds.** The home page has to say four things before anybody
scrolls: Health Science student, NREMT-certified EMT, product builder, esports
leader. It does that with the positioning line, an eight-cell credibility strip
(EMT field experience, phlebotomy training in progress, the CSUCI Esports Club
presidency, competitive play, the health science degree, the mathematics and
science associate, the Alzheimer's research, and health informatics), and two
unmissable actions: **View projects** and **View / download résumé**.

**Six case studies, not repository cards.** Each one opens on the most
compelling real interaction from that product's latest working iteration, then
answers the same nine questions: what it is · why it was built · the most
interesting interaction · the problem being solved · current capabilities ·
design and technical decisions · what changed across iterations · what comes
next · where to find it.

**A résumé that is a document.** `resume.html` is typeset twice — once for the
screen on a warm ivory surface, and once in `@media print`, where the
navigation, the atmosphere, the footer and the page's own instructions are
removed and the type is re-set in points. Browser → Print → *Save as PDF*
produces a clean two-page résumé with no separate PDF to keep in sync.

## The screenshots

`assets/projects/` holds captures of the six products **actually running**.
None of them is a mockup, a logo, a landing page or an empty state.

| Project | Hero capture | How it was taken |
| --- | --- | --- |
| SpellBomb | `hero-spellbomb-game.webp` | A real six-player match against a running `server.js` — six independent browser contexts joined one room over Socket.IO and played it, driven by Playwright. |
| Health Journal | `hero-health-journal-dashboard.webp` | The production build with the app's own "Load example data" set (~34 days) plus a real check-in completed for the day, at the phone width the app is designed for. |
| Phlebotomy Exam Prep | `hero-phlebotomy-order-of-draw.webp` | The Order of Draw drill in the production static export, shuffled and waiting; the supporting shots are a graded attempt and a real progress screen after a ten-question session. |
| Manifester | `hero-manifester-player.webp` | The expanded player, eight passes into a live ten-minute session built in the app's own editor. |
| OWCS Comp Tracker | `hero-owcs-review.webp` | The Review screen served from the repository, on the committed Al Qadsiah vs Twisted Minds (Nepal) production dataset. |
| PaperAnimator | `hero-paperanimator-thread.webp` | Two scenes marked on the app's own generated sample paper, with the source thread drawn back to the exact words. |

Wide 16:10 captures scroll inside their own frame below 700 px rather than
shrinking their interface text to nothing. The tall Health Journal captures are
left at their natural width, because a single narrow column is what that app's
layout actually is.

**Every claim on the site comes from the record it describes** — each
repository's README, changelog, test suite, deployment configuration and running
build. Where a repository is private, the site says so instead of publishing a
link that will not open. Where a project documents a limitation, the case study
carries it. Facts were read in **August 2026**; if a project moves on, the copy
should move with it.

Live-project links point at each repository's own GitHub Pages deployment,
taken from that repository's Pages configuration. SpellBomb is the exception: it
is a private repository with no public deployment today, and its case study says
exactly that rather than linking anywhere.

## How the motion works

Four layers, and each one can fail without taking the one below it with it.

1. **No JavaScript.** Every page is complete, readable, navigable and linkable.
   Nothing is hidden by CSS unless `<html>` carries the `js` class, which is set
   by an inline script in `<head>`. The mobile menu is a `<details>` element, so
   it opens and closes with the script absent.
2. **`assets/site.js`.** An IntersectionObserver reveals content, a hairline
   bar reports reading progress, and the menu gains three courtesies a native
   `<details>` does not have: Escape, outside-click, and closing on navigation.
   Anything that throws falls through to a handler that reveals everything.
3. **Each project's own behaviour.** Motion is meant to mean something, so a
   project's page moves the way the product does — SpellBomb burns a fuse,
   Health Journal grows from its baseline, Manifester breathes, OWCS reorders,
   PaperAnimator unfolds, Phlebotomy Exam Prep settles into sequence. All of it
   is CSS transitions driven by one class.
4. **Atmosphere.** A fixed gradient wash tinted by the page's accent, and a
   grain layer. Both are `pointer-events: none` and neither animates, so there
   is nothing there to disable.

`prefers-reduced-motion: reduce` stops all of it: transitions, animations,
smooth scrolling and the progress bar, with no content withheld. Turning the
preference on mid-visit is handled too. Scrolling is never hijacked and no page
ever plays sound.

## Accessibility notes

- Skip link, one `main` landmark, one `h1` per page, headings in order.
- Every interactive element is a real link or button. Focus rings are visible
  and drawn in the page's own accent; the first six tab stops are the skip link,
  the wordmark and the primary navigation.
- Every screenshot carries descriptive `alt` text naming what is on screen, and
  declares its intrinsic `width`/`height`, so nothing shifts as it loads. Only
  the first hero on a page loads eagerly.
- Body text is checked against WCAG AA on both the near-black and ivory
  surfaces. Accent colours are used for display type, borders and marks rather
  than for small text.
- Tap targets are at least 48 px tall on mobile, and the navigation panel's rows
  are 56 px.
- Wide diagrams and screenshots scroll inside their own frame on narrow screens
  rather than shrinking their labels.

## Deploying

`.github/workflows/pages.yml` verifies that the committed HTML matches its
sources, that every referenced asset exists, that every page has a title, a
description and exactly one `h1`, and that every image declares `alt`, `width`
and `height` — then publishes the repository root to GitHub Pages on each push
to `main`.

**One-time setup:** Settings → Pages → Build and deployment → Source →
**GitHub Actions**. The workflow's own token usually cannot create the Pages
site, so the first run fails with *"Resource not accessible by integration"*
until a human flips that switch. Re-run the job afterwards and every push
deploys on its own.

## Third-party code

None at runtime. The four typefaces — Instrument Serif, Newsreader, Space
Grotesk and IBM Plex Mono — are licensed under the SIL Open Font License 1.1 and
are self-hosted as latin subsets in `assets/fonts/`, rather than fetched from a
font CDN, so a blocked or slow font host costs this page nothing.
