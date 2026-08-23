# Portfolio-Hub

The portfolio and online résumé of **Connor Eppolito** — Health Science ·
NREMT-certified EMT · product builder · esports leader.

Twelve static pages, four self-hosted typefaces, one stylesheet and one small
script. No framework, no CDN in the critical path, and no third-party runtime
dependency in the path of anything a visitor needs.

Above that sits a cinematic layer — the **Evidence Aperture** on the home page,
cross-document view transitions across all twelve, native scroll-driven motion,
and one product-physics law per case study. Every part of it is an escalation of
the page underneath it, and every part of it can fail without taking that page
with it.

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
assets/site.js              Progressive enhancement, ~330 lines, five jobs
assets/fonts/               Self-hosted latin subsets (SIL OFL)
assets/projects/            Real screenshots of the six products (WebP)
assets/src/                 Sources for the two lazy cinematic bundles
assets/vendor/              Those bundles, built and committed — plus NOTICE.md

pages/*.html                Page bodies + front-matter
templates/base.html         The shared <head>, masthead, navigation and footer
tools/build_pages.py        Assembles pages/ + templates/ into the root HTML
tools/build_vendor.mjs      esbuild → assets/vendor/, with a --check for CI
tools/build_images.mjs      Responsive WebP derivatives from the screenshots
tools/build_fonts.py        Instances the variable faces down to what is used
tools/calibrate_fallbacks.mjs  Keeps the metric-matched fallbacks honest
tools/asset_manifest.py     Writes the asset manifest from the built pages
tests/                      Playwright: structure, motion, a11y, print, keyboard
```

```bash
npm install          # toolchain only; nothing here is served to a browser
npm run build        # pages + vendor bundles
npm run check        # drift + HTML validation, the way CI runs it
npm test             # Playwright (chromium; BROWSERS=… for firefox/webkit)
npm run lh:mobile    # Lighthouse budgets
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

## The Evidence Aperture

The home page opens on one composed frame: a medical-teal biological signal, a
cobalt competitive bracket, a restrained solar-gold current, warm-ivory
editorial typography, and one real screenshot of a running product — the Order
of Draw drill in Phlebotomy Exam Prep. All five are drawn in HTML, CSS and
inline SVG before any script runs, so that frame is what a visitor gets with
JavaScript off, with reduced motion on, on a phone, and on a laptop that does
not qualify for the rest of it.

That frame is also **one of six**, and the visitor picks which. See *The
instrument*, below.

On a desktop with a fine pointer and no reduced-motion preference, one short
pinned sequence animates *into* that frame rather than out of nothing. Across
roughly three-quarters of a viewport of ordinary scrolling, the signal extends
and the bracket converges on the evidence, the aperture opens from a slit to the
full screenshot, and the sequence ends on the caption naming the product and the
link into its case study. Behind it, an OGL fragment shader draws a directional
key, a fine interference signal and one aperture ring, in the page's own accent.

What it never does:

- No loader, no gate, no blank canvas, and no empty hero.
- No wheel or touch interception, no scroll velocity changes, no scroll jail.
  The pin is the browser's own scroll position; there is no smooth-scroll
  library in this repository and there never will be.
- Nothing above the interactive content, nothing focusable, nothing that delays
  a link. The name, the navigation, both hero actions and the case-study link
  are readable and clickable at every scroll position, including the first.

The shader is loaded last and only when **all** of these pass:
`prefers-reduced-motion: no-preference`, a fine pointer, a viewport of at least
1000 px, `navigator.deviceMemory` reporting at least 4 GB, Save-Data off, WebGL
available, and the site's own Motion control not switched off. A capability the
browser declines to report is read as a no. It is capped at 1.5× device pixel
ratio, pauses when the hero scrolls away or the tab is hidden, and releases its
context on exit or on context loss.

## The instrument

The hero is a six-position control — one channel per shipped product — and
picking a position retunes the whole page in one connected move: the accent
(interpolated through a registered `--accent`, not switched), the waveform of
the signal, the seed of the bracket, the screenshot in the aperture, the
read-out beneath it, the caption, the case-study link, the light and
interference in the shader, and the row that lights up in Selected Work. One
input, one machine answering across every layer at once.

Each of the six waveforms means something about its product — a fuse that
spikes and drops, a slow circadian rise, a clean clinical trace, a breath, a
square-wave swap timeline, a page fold. All six are authored with the same
twenty-five points, so one is interpolated into the next rather than dissolved
through it.

**All six compositions are real markup and real CSS state.** Nothing draws a
composition into existence; the selector only moves between states the
stylesheet already holds. Which means:

- **With no JavaScript** the strip is six ordinary links to six case studies,
  standing under the composition the document declares. That is the design, not
  a fallback. There is no state in which this control is dead.
- **With JavaScript** `assets/vendor/channel.js` (2.4 KB gzip, no dependency)
  replaces the six links with a `role="radiogroup"` of six radios in the same
  boxes — a link that does not navigate would be a lie, so it stops being a
  link. Arrow keys move between positions with a roving `tabindex`; `Home` and
  `End` jump. Hovering previews on a fine pointer and never commits; commit
  takes a click, a tap, `Enter`, `Space` or an arrow key.
- **The URL never changes and history is never touched.** This is a hero, not a
  route.
- **Under reduced motion** the retune is the same state change arriving
  instantly. Nothing is withheld: the selector still selects, the evidence
  still swaps, the read-out still retunes. Only the travel is gone.
- **Under Save-Data** the module is not fetched at all and the six links stand.
  It is the one gate the instrument answers to — a control is not an effect,
  and the rest of the cinematic gates would withhold it from a phone.

The evidence in the frame carries **two or three hotspots** — real buttons with
real accessible names, positioned in normalised coordinates, each naming a part
of the interface visibly in the picture, in words taken from the alt text and
the case study. Panels open beside the frame, never over the thing they
describe. They render only once the module has wired them, because an unwired
hotspot is a dead control. Nothing that only a hotspot says is a fact the page
needs: the figcaption carries the meaning and the case study carries the rest.

The read-out and the Selected Work spec lines state the same numbers, because
there is one set of facts on this page and not two. Every one of them is
checkable against the repository it describes.

## The pulse

Connor is an NREMT-certified EMT. A heartbeat is the one signal every human
being reads without being taught, and this site had been drawing one at
fourteen per cent opacity behind everything else.

It is the protagonist now. **The trace has a rail of its own** — edge to edge,
on a faint graticule, directly above the channels it answers to — and the same
rail stands on each of the six case studies, tuned to that one product. Six
waveforms, six rhythms, and each means something about the thing it belongs to:

| | Waveform | Rate |
| --- | --- | --- |
| SpellBomb | a fuse: three ramps, each steeper than the last, each ending in a drop | 1.45 s |
| Health Journal | one slow circadian rise across the whole width | 5.2 s |
| Phlebotomy Exam Prep | a clean clinical trace: isoelectric baseline, three PQRST complexes | 2.6 s |
| Manifester | a breath — long, even, beginning and ending on the line | 6.4 s |
| OWCS Comp Tracker | a square-wave swap timeline: compositions hold, then change | 2.0 s |
| PaperAnimator | a page fold: flat stock, one hard crease, flat again | 4.6 s |

All six are authored with the same twenty-five points, so one is interpolated
into the next rather than dissolved through it.

**It does not loop.** A bright line running forever behind somebody's name is
decoration with a heartbeat painted on it. It sweeps once on arrival — the
monitor acquiring signal, about a second and a half, non-blocking, and the
first input of any kind cuts it short — and then it rests, complete and still,
until you touch the instrument. Changing channel makes it re-acquire at the new
product's rate. The pulse answers you; it does not perform at you.

`--rate` is a custom property, so it inherits: the home page's tuned channel
writes it and a case study's own accent writes it, and neither has to know the
other exists.

## The spine

The reading-progress bar was a two-pixel rectangle. It is the same signal now,
drawn as you read it: one ECG across the top of all twelve documents, dim for
its whole length and bright as far as you have got. It only ever reports — it
never steers, and it is never in the way.

A dash pattern would have been the obvious way to draw it and it is the wrong
one: with `vector-effect: non-scaling-stroke` the pattern resolves in screen
space rather than in the stretched viewBox, so the numbers never line up. A
clip does not care what the coordinate system is doing.

## The cut

Every navigation is the aperture blinking. The outgoing document closes to a
horizontal slit and the incoming one opens out of it — the same aperture the
hero is built around, at the scale of the whole viewport, on the browser's own
cross-document view transition. Two `clip-path` animations, no router, and a
browser without the feature navigates instantly and loses nothing.

## Sound

Off until somebody asks for it, on every page, beside the motion control.

Every tone is an oscillator and an envelope built in the browser when it is
first needed — nothing is downloaded, nothing is a file, and the AudioContext
is not even constructed until the first press. There are three sounds and only
three: the monitor's blip when the trace reaches the QRS, the detent of a
channel committing, and the aperture on a navigation. Anything else would be
decoration with a volume control.

A stored "on" is deliberately not honoured on load. A page that starts making
noise because of something you did on a previous visit is a page that autoplays
sound, whatever the reason — so the stored value only decides what the control
looks like the moment you reach for it. The promise on the Manifester page,
that nothing here autoplays sound, is still literally true.

## The motion control

Because the shader keeps moving for longer than five seconds, every page carries
a **Reduce motion** button — in the masthead on wide screens, in the mobile menu
below that. It is a real button with a stable accessible name and an
`aria-pressed` state, it stops the renderer and every non-essential animation on
the spot, and the choice is remembered in `localStorage`. It can only ever make
the site stiller than the operating system asked for: a stored "on" never
overrides a system `prefers-reduced-motion: reduce`.

## Cross-document view transitions

`@view-transition { navigation: auto }` is declared for all twelve pages. Five
things are named and travel between documents: the wordmark, the navigation
shell, and — per project — the screenshot, the title and the accent marker. A
project card's screenshot becomes that project's case-study hero.

Durations are 180–300 ms, opacity, transform and clipping only, no blur. No name
appears twice in one document; on the home page the aperture *is* the active
project screenshot, so the card below it deliberately does not claim the same
name a second time. When the hero is tuned off its default channel it is
borrowing a picture the work index owns, so it gives the name back rather than
claiming it twice. Browsers without the feature navigate normally and lose
nothing, reduced motion collapses every transition to an instant state change,
and back and forward are unaffected.

## How the motion works

Six layers, and each one can fail without taking the one below it with it.

1. **No JavaScript.** Every page is complete, readable, navigable and linkable.
   Nothing is hidden by CSS unless `<html>` carries the `js` class, which is set
   by an inline script in `<head>`. The mobile menu is a `<details>` element, so
   it opens and closes with the script absent.
2. **`assets/site.js`.** An IntersectionObserver reveals content, a hairline
   bar reports reading progress, and the menu gains three courtesies a native
   `<details>` does not have: Escape, outside-click, and closing on navigation.
   Anything that throws falls through to a handler that reveals everything.
3. **Each project's own behaviour.** Motion is meant to mean something, so a
   project's page moves the way the product does, and each page declares the one
   law it inherits in its front-matter:

   | Project | Law | What it does |
   | --- | --- | --- |
   | SpellBomb | `fuse` | A fuse accumulates down the spine of the page and the reveal lands once, with weight. No flashing, no shaking, nothing covering the text. |
   | Health Journal | `grow` | Days, ratings and lab values materialise into a record; the timeline physically grows between related evidence. Teal is living data, not a glow. |
   | Phlebotomy Exam Prep | `sequence` | Clinical steps settle in the correct order and a hairline connects each to the next. Calm and exact, with no blood-related spectacle. |
   | Manifester | `breathe` | One finite inhale and exhale, then stillness — a session that ends, which is what the product is. Nothing pulses forever and nothing plays sound. |
   | OWCS Comp Tracker | `sort` | Rows arrive out of order and snap into a structure you can read down. Alignment is the reward. |
   | PaperAnimator | `unfold` | A page opens into a scene: clipping, perspective and layered planes, source to product. |

   None of the six is applied to a page it does not belong to.
4. **Atmosphere.** A fixed gradient wash tinted by the page's accent, and a
   grain layer. Both are `pointer-events: none` and neither animates.
5. **Native scroll-driven CSS.** `animation-timeline: view()` and
   `scroll()`, `animation-range`, `@property`, masks and clip paths do the
   cinematic work wherever they can — the fuse burning down SpellBomb's spine,
   the growth spine on Health Journal, evidence settling into frame, the
   masthead firming up past the first screen. Every one is written so its
   *unanimated* state is the readable one, and all of it sits inside
   `@supports`, so an unsupported browser is never handed content at
   `opacity: 0`.
6. **The lazy cinematic bundles.** GSAP with ScrollTrigger for the one sequence
   that genuinely exceeds CSS, and OGL for the one shader plane. Both are
   dynamically imported after `load`, only on the page that asks for them, only
   when the gates pass, and both are destroyed completely when they stop
   applying. See `assets/vendor/NOTICE.md`.

`prefers-reduced-motion: reduce` stops all of it: the renderer is never created,
neither cinematic bundle is even fetched, scroll-linked transforms and the
progress bar are gone, view transitions collapse to instant state changes, and
every section holds its finished, art-directed state. Turning the preference on
mid-visit tears the renderer down. Scrolling is never hijacked and no page ever
plays sound.

## Typography, and why the page does not jump

`font-display: swap` paints the first frame in a system face, and if that face
is not the same width as the webfont replacing it, every line re-wraps and the
page moves under the reader. On a throttled phone that was worth 0.16 of
cumulative layout shift on the home page and 0.18 on the résumé.

Three changes fixed it, and together they took mobile CLS to 0.000:

- **Metric-matched fallbacks.** `assets/fonts.css` declares one adjusted
  fallback face per family, weight and style, built on system fonts that are
  metric-compatible across platforms. `tools/calibrate_fallbacks.mjs` measures
  each one in the DOM at the size the site actually sets it and rewrites
  `size-adjust`; all nine are currently within 0.12%.
- **A measure that does not move.** `ch` is the width of the current font's
  zero, so a container sized in it changes width the moment the webfont arrives.
  Every measure is now in `em`.
- **Smaller faces.** `tools/build_fonts.py` instances Newsreader down to the
  one optical size and the weight range the stylesheet asks for (129 KB → 39 KB;
  the italic, 62 KB → 22 KB), and Space Grotesk's three declared weights turned
  out to be the same variable font served twice under different names, now one
  22 KB file instead of three totalling 56 KB. Fonts on the home page fell from
  190 KB to 61 KB.

## Verification

`npm test` runs the Playwright suite against the committed HTML:

- exactly one `h1` per page and headings that never skip a level
- `alt`, `width` and `height` on every image, and no duplicate
  `view-transition-name` in any document
- no horizontal overflow at 390, 768, 1440 and 1920 px, checked per element and
  not merely at the document level
- every internal link resolves; no request leaves the origin
- with JavaScript disabled: all twelve pages complete, navigable and
  screenshot-bearing, with no canvas and nothing left hidden
- with reduced motion: no canvas, neither bundle fetched, every section final
- the hardware gate: no canvas at 390 px, under Save-Data, at 2 GB reported
  memory, or when the browser reports no memory at all
- the motion control's name, pressed state, effect and persistence
- sound: silent until pressed, silent again the moment it is switched off
- the instrument, against all five inputs: six working links with no script,
  a named radio group with a roving `tabindex` and arrow, `Home` and `End`
  keys, hover that previews without committing, tap that commits on a target of
  at least 44 px, the same instant state change under reduced motion and under
  the site's own Motion control, and no module fetched at all under Save-Data —
  plus the three hard limits: nothing learnable-before-usable, no fact reachable
  only through an interaction, and no interaction that delays a link
- keyboard order, focus rings on everything tabbable, the skip link, the mobile
  menu's Escape behaviour, and reaching a case study from the hero by keyboard
- the résumé printing to exactly two pages on Letter and on A4
- Axe with zero serious or critical violations on all twelve pages, twice each

`.github/workflows/verify.yml` runs all of that on Chromium, Firefox and WebKit,
plus generator and vendor drift checks, HTML validation, a CDN check and the
Lighthouse budgets. `.github/workflows/pages.yml` keeps its fast structural
checks and publishes.

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
  are 56 px. The hero's channel positions and its specimen hotspots are at
  least 44 px on any coarse pointer.
- A number that climbs on entry is drawn with `content: counter()`, which lives
  outside the text layer — so the treatment is used only where prose beside it
  states the same number, and the drawn numeral is marked decorative.
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

Nothing third-party is in the critical path, and nothing is fetched from another
origin at any point. Two audited, pinned packages are bundled into
`assets/vendor/` at author time and lazily imported after first paint — GSAP
with ScrollTrigger for the Evidence Aperture timeline, and OGL for the single
shader plane. A third bundle, `channel.js`, goes through the same path with no
dependency at all: it is there because it is main-thread work the critical path
must not carry, not because it needed a library.
`assets/vendor/NOTICE.md` records the exact version, source,
licence, generated filename, raw and gzip weight, and the reason each one
exists; `node tools/build_vendor.mjs --check` fails CI if the committed output
drifts from its sources.

Deliberately absent: Lenis, Three.js, Rive, Spline, React, Vue and any
client-side router. Native scrolling is part of this site's identity.

The four typefaces — Instrument Serif, Newsreader, Space
Grotesk and IBM Plex Mono — are licensed under the SIL Open Font License 1.1 and
are self-hosted as latin subsets in `assets/fonts/`, rather than fetched from a
font CDN, so a blocked or slow font host costs this page nothing.
