# Portfolio-Hub

The portfolio and online résumé of **Connor Eppolito** — Health Science ·
NREMT-certified EMT · product builder · esports leader.

Twelve static pages, four self-hosted typefaces, one stylesheet and one small
script. No framework, no CDN in the critical path, and no third-party runtime
dependency in the path of anything a visitor needs.

Above that sits a cinematic layer — the **CE Signal Sculpture** on the home
page, six living Selected Work scenes, cross-document view transitions across
all twelve pages, native scroll-driven motion, and one product-physics law per
case study. Every part of it is an escalation of the page underneath it, and
every part of it can fail without taking that page with it.

The design system it answers to is written down in [`DESIGN.md`](DESIGN.md).

```
index.html                  Home — one signal
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
assets/src/                 Sources for the two lazy bundles
DESIGN.md                   The ONE SIGNAL design system: tokens, motion laws, anti-patterns
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

## THE PROJECTION — the identity hero

> **Care. Code. Competition. One signal.**

The home page opens on one object and no controls: **the GitHub mark,
projected**. It is a real volume rather than a picture of one, and every layer
of it is cut from the same `<path>`:

| Layer | What it is |
| --- | --- |
| **The extrusion** | Eighteen `<use>` references to one path, stacked along Z at 2.4 px apart inside a `preserve-3d` scene, running a hue ramp from cyan at the face to violet at the back |
| **The film** | An oil-slick conic spectrum clipped to the silhouette, with a specular highlight that sits wherever the pointer is |
| **The ghosts** | Two more copies of the silhouette, cyan and magenta, in `screen` blend, pulled apart along the current tilt |
| **The scan** | A line raster and one bright bar travelling down through it |
| **The rings** | Three orbital rings, each on its own axis and its own clock, each with one bright arc |
| **The room** | A projector cone, a breathing emitter plate and a perspective floor grid |

There is **no raster image anywhere above Selected Work**. The hero is geometry
and type, over the atmosphere plane that every page carries.

### What it replaced, and why

A monogram assembled out of three planes — CARE as a clinical arc, BUILD as a
node graph, COMPETE as a bracket — with a three-position radio group under it
deciding which plane was lit. It was a diagram of an idea about somebody rather
than an object anybody wanted to look at; it needed a legend to be understood;
and its control hid two thirds of its own content behind a press, when every
one of those facts is restated open and uncontested in the credentials strip
immediately below the hero.

The projection answers all three. It is a mark everybody already recognises, it
says nothing at all so nothing can be hidden behind it, and it turns for
everybody rather than only for a mouse.

### Turning it

- **Pointer** — leads the tilt, up to 26° horizontally and 16° vertically, and
  carries the specular highlight across the film.
- **Drag** — throws it. It coasts on inertia and **stops**, inside about a
  second. Horizontal only, so a drag that turns out to be a scroll is a scroll.
- **Click** — one deliberate nudge, because a click on the object should do
  something.
- **No pointer at all** — the scroll turns it instead.
- **Idle** — a 42° sway, never a full orbit: a mark turning a full circle
  spends a third of every revolution edge-on or backwards.

It is `aria-hidden` and carries no fact. Turning it changes no state, no URL and
no history entry, and it never changes the height or the width of the document.
Nobody who ignores it loses anything.

### The arrival

All of it is CSS keyframes, so it starts at first paint, costs the main thread
nothing, and is over inside about a second and a half:

```
0–420 ms      the floor grid, the projector cone and the emitter come up
180–1280 ms   the projection resolves: it arrives edge-on, small and
              transparent, and turns into its resting three-quarter view
650–1250 ms   an ink edge travels the name, line by line
1000–1400 ms  the credentials and the actions settle on a mechanical detent
by ~1500 ms   still, and waiting
```

`site.js` has exactly one job in that sequence: **ending it**. The first
pointer, touch, key, wheel or scroll event adds `.is-settled`, which drops every
animation and leaves the composed final frame — the frame the page was designed
around anyway.

Nothing in the sequence gates a word. Every keyframe either runs on something
decorative or starts from a partial opacity that is already legible. The name is
opaque in the first frame; what travels across it is a bright edge *over* type
that was readable before the edge arrived.

What it never does:

- No loader, no gate, no blank canvas, no empty hero.
- No wheel or touch interception, no scroll velocity changes, no scroll jail.
  There is no smooth-scroll library in this repository and there never will be.
- Nothing above the interactive content, nothing focusable, nothing that delays
  a link.

**With no script the object still stands, sways, orbits and scans** — every one
of those is a keyframe. `assets/vendor/holo.js` (1.1 KB gzip, no dependency)
adds only what a stylesheet cannot know: where the pointer is, and whether
somebody has taken hold.

## The atmosphere

One OGL fragment plane, on the fixed atmosphere layer **every page already
carries**, for the whole scroll.

It used to render behind the hero of the home page and nowhere else — built,
compiled and thrown away after one screenful, and only for a visitor with a fine
pointer, a viewport of at least 1000 px and a browser reporting four gigabytes
or more of memory. Which meant no phone, no tablet, and no Safari at all,
because Safari does not implement `navigator.deviceMemory`.

| Layer | What it is |
| --- | --- |
| **The aurora** | A domain-warped flow field, three octaves, drifting on its own clock |
| **The aperture** | A soft iris the pointer nudges, whose edge tightens as the document is read |
| **The interference** | A fine signal, refracted where the field is strongest rather than sliding over it |
| **The motes** | A sparse specular grid, brightest near the light |
| **The key** | A directional light the pointer leads and never follows |

Three decisions make it usable rather than merely present:

- **It composites with `screen`.** The plane draws light on black, so its black
  is exactly nothing and its light is added to the gradient wash underneath.
  The wash is never hidden, and there is no frame where an un-drawn canvas
  covers it.
- **It is loud in one place only.** One gain for reading, one lift for a page
  that has a hero to justify it, spent by the time the hero has scrolled away.
  A page that opens on a paragraph never gets the loud version.
- **It renders at thirty frames a second**, because nothing on it moves fast
  and this is now the whole site's cost rather than one hero's.

Reading a project in Selected Work retunes it to that project's own accent over
about a second: the rail announces the room through a `ce:room` event on the
document and the shader answers. Neither imports the other.

**The gates.** Reduced motion and Save-Data are somebody telling you not to. No
WebGL is the browser telling you it cannot. A device that reports its memory and
reports less than 4 GB is telling you it is small. Silence — a browser that
declines to report at all — is none of those, and is no longer read as one. The
plane is capped at device pixel ratio 1 below 900 px and 1.5 above it, stops
when the tab is hidden, and releases its context on exit or on context loss. The
résumé is set on paper and does not get it: a plane that draws light on black
has nothing to say there.

## Selected Work — six living specimens

Six rooms, six motion laws, one spine.

The layout is a grid and nothing more. Each article is its own two-column room:
the reading column on the left, the scene on the right, and the scene is
`position: sticky` **inside its own article**. The stage holds while you read
its project and hands off physically to the next one when you leave. That
hand-off is the browser's own scrolling — no pin, no wheel listener, no snap, no
forced horizontal travel. At one column the grid collapses and every scene sits
with its own copy, which is the mobile design rather than a fallback for it.

| # | Project | Law | What actually moves |
| --- | --- | --- | --- |
| 01 | SpellBomb | **fuse** | a fuse burns once toward the bomb with a spark riding it; eleven real tray slots take the seven letters the capture holds |
| 02 | Health Journal | **accumulate** | the stage opens from a wide slice to the full tall record; one real chart line draws; the solar arc the product computes runs once |
| 03 | Phlebotomy Exam Prep | **order** | six real tube cards, in the six CLSI positions with their real additives, arrive in the wrong seats and lock into the right ones |
| 04 | Manifester | **fold** | builder and player fold together; the orb takes exactly one breath; one real line of interface text arrives |
| 05 | OWCS Comp Tracker | **scan** | one scan line crosses the detected timeline; five detected rows snap into the reviewed one, the row under the confidence gate still marked |
| 06 | PaperAnimator | **cite** | a highlight is drawn, a curved tether runs from it to the scene it produced, and the page performs one shallow fold |

No transition is fade-only or scale-only, and no two rooms share a law.

**The rule that made the difference.** If a scene promises ordering, sequencing,
cards, rows or nodes, the things being ordered have to exist as real, separately
addressable elements. The previous design applied `data-motion="sort"` and
`data-motion="sequence"` to wrappers containing exactly one `<img>`: code that
staggers children was animating one raster layer. Here `--from` is the seat a
card starts in and `--i` is the seat it belongs in, and the card physically
crosses the distance between them. `tests/hero.spec.ts` asserts it — six cards,
six wrong seats, six correct destinations.

The reconstructions are `aria-hidden`: the article beside them already states
every fact they show. Every capture that *is* in the accessibility tree carries
a real description of what is in it, and no capture appears twice.

**The Order of Draw appears here and nowhere earlier.** It is the payoff of
project 03, not the site's opening image.

The rail is six ordinary same-page anchors before anything enhances them.
JavaScript only reports which room you are in — `aria-current` on the matching
link, the room's accent on the rail, and how far through the six you have read
as a stroke length on the spine. It never converts the articles into tabs, never
hides an inactive one, and never competes with the scroll position for
authority.

## The pulse layer

The arrival plays once and settles. What persists across the whole site is a
layer that answers the visitor, and it is built on the one signal every human
being already knows how to read: **a heart rate answers effort, and then it
settles.**

`assets/vendor/pulse.js` — 0.9 KB gzip, no dependency — writes three custom
properties onto `<html>` and then gets out of the way:

| Property | Range | What it is |
| --- | --- | --- |
| `--pulse` | 0 → 1 | **Exertion.** Scroll velocity, decaying back to nothing in about a second. |
| `--px`, `--py` | −1 → 1 | The pointer, eased. Fine pointers only. |

Scroll hard and the trace across the top of every page gains amplitude, glow
and weight; stop and it comes back down to a resting rhythm. It is not
decoration with a heartbeat painted on it — it is the one piece of state a
visitor is already generating, reported in the one language nobody has to be
taught.

**The hold moved.** Taking an object in hand used to live here; it belongs to
`assets/vendor/holo.js` and the projection it actually turns. Two modules
reaching for the same pointer was one module too many.

**One beat, on a real activation.** Pressing something that does something
sends a single QRS down the trace. Never on a scroll, never on a hover, never
on load.

It costs no layout and no reflow: one `requestAnimationFrame` loop that stops
the moment everything is at rest, and stops entirely when the document is
hidden. It answers the same gates as everything else — reduced motion, the
site's own Motion control, Save-Data — and under any of them it is never
fetched and not one property is ever written. On a phone it still loads,
because the part that matters most there needs no pointer at all.

## The card

The contact page is a card: a real object with a front, a back, four edges and
a thickness, printed on the same warm ivory the résumé is set on.

Both faces carry real content — the front is the identity, the back is every
route out of the page as four ordinary links. With a script it is one card that
tilts under the pointer, catches the light on its foil, and turns over in
900 ms. With no script it is two stacked panels, both complete, and the turn
control is not rendered at all.

The rule that shapes it: **a link that is invisible but still focusable is
worse than no link at all.** The face turned away is `inert`, so it leaves the
tab order with the pixels rather than lingering behind them, and focus follows
the card once the half-turn has actually shown the face it is moving into.

## The pulse

Connor is an NREMT-certified EMT. A heartbeat is the one signal every human
being reads without being taught, and this site had been drawing one at
fourteen per cent opacity behind everything else.

It is the protagonist now. On each of the six case studies a rail stands tuned
to that one product, and the same trace runs across the top of all twelve
documents as the reading-progress line. Six waveforms, six rhythms, and each
means something about the thing it belongs to:

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
until you touch something. The pulse answers you; it does not perform at you.

`--rate` is a custom property, so it inherits: a case study's own accent writes
it, and nothing else has to know.

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

Every navigation is the trace flattening and opening again. The outgoing
document closes to a horizontal line and the incoming one opens out of it — the
same signal the hero is built around, at the scale of the whole viewport, on the
browser's own cross-document view transition. Two `clip-path` animations, no
router, and a browser without the feature navigates instantly and loses nothing.

## No sound

There was a sound layer here — three synthesised tones behind a second masthead
switch, an `AudioContext` that was not constructed until the first press, and a
stored preference deliberately not honoured on load. Every detail of it was
right, and it is gone.

It was a control that existed to make a promise about a feature nobody asked
for, and the honest version of that promise is not having the feature. **This
site makes no sound**, needs no control to say so, and the masthead is one
switch lighter for it.

## The motion control

Because the atmosphere plane keeps moving for longer than five seconds, every
page carries a **Reduce motion** button — in the masthead on wide screens, in
the mobile menu below that. It is the only switch in the masthead. It is a real button with a stable accessible name and an
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
appears twice in one document: the identity hero holds no raster at all, so each
of the six Selected Work scenes claims its project's names exactly once, and the
transition carries the active title, accent and capture into the case-study hero
it opens. Browsers without the feature navigate normally and lose
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
4. **Atmosphere.** A fixed plane on every page: a gradient wash tinted by the
   page's accent, a grain layer, and — where the gates pass — one OGL shader
   canvas rendering over the wash in `screen` blend. All three are
   `pointer-events: none`, and the first two do not animate at all.
5. **Native scroll-driven CSS.** `animation-timeline: view()` and
   `scroll()`, `animation-range`, `@property`, masks and clip paths do the
   cinematic work wherever they can — the fuse burning down SpellBomb's spine,
   the growth spine on Health Journal, evidence settling into frame, the
   masthead firming up past the first screen. Every one is written so its
   *unanimated* state is the readable one, and all of it sits inside
   `@supports`, so an unsupported browser is never handed content at
   `opacity: 0`.
6. **The lazy bundles.** `pulse.js` (0.9 KB gzip) and `holo.js` (1.1 KB), both
   with no dependency at all, and OGL for the one shader plane (16.5 KB). All
   three are dynamically imported after `load`, only where they apply, only when
   the gates pass, and all three are destroyed completely when they stop
   applying.

   GSAP was removed by this redesign. It earned its 44.8 KB gzip when the hero
   was a pinned, scrubbed ScrollTrigger timeline; the hero is no longer a
   scrubbed timeline, and every motion in the current design is a finite
   transition that plays once and settles — which is exactly what CSS keyframes
   express, off the main thread and with the composed final frame as the state
   that renders when motion is refused. See `assets/vendor/NOTICE.md`.

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
- the gates: a canvas on a phone, on every page and not only the one with the
  hero, and none at all under Save-Data, at 2 GB reported memory, or with WebGL
  refused — with the page complete in every one of those cases
- the motion control's name, pressed state, effect and persistence
- the identity hero against all five inputs: eighteen depth slices, a film, two
  ghosts, a scan bar and three rings all standing with no script at all; a
  pointer that leads the tilt; a drag that throws the object and inertia that
  brings it to rest; nothing changed by any of that — no URL, no history entry,
  no document width or height; and no module fetched under Save-Data, with the
  whole object still standing — plus the hard limits: no raster above Selected
  Work, every credential in the first viewport at 1440 and at 390, an arrival
  that ends on the first input, and no interaction that delays a link
- the simplification, asserted so it cannot quietly come back: no radio group,
  no `role="tab"` and nothing `display: none` in the hero waiting for a press;
  every fact the old domain panels held present in the open page text; four
  primary destinations and exactly one button in the masthead; and no sound
  control on any page
- the six rooms: one distinct motion law each made of elements that can
  genuinely move, six tube cards that start in the wrong seats and end in the
  right ones, a rail that reports position without turning articles into tabs,
  no capture under 150 px wide on a phone, and one focusable target per room
- the pulse layer on all twelve pages: exertion that rises from a real scroll,
  never exceeds its ceiling and returns to exactly zero on its own; one beat per
  activation and none from scrolling or hovering; not one property written under
  reduced motion, the Motion control or Save-Data; and no change to the height
  or the width of the document from any of it
- the card: two complete panels with no script and nothing left inert by a
  script that never ran, four routes that are ordinary links, a face turned
  away that is out of the tab order, focus that follows the turn, and every
  target over 44 px
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
  are 56 px. The hero has nothing to tap: on a coarse pointer the projection is
  `pointer-events: none` and stands behind the copy, so it can never be the
  target of a thumb that was aiming at a word.
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
origin at any point. **One** audited, pinned package is bundled into
`assets/vendor/` at author time and lazily imported after first paint: OGL, for
the single shader plane. Two more bundles, `pulse.js` and `holo.js`, go through
the same path with no dependency at all — they are there because they are
main-thread work the critical path must not carry, not because either needed a
library.

GSAP and Lenis are absent by design, and `assets/vendor/NOTICE.md` records why
each was removed or declined rather than simply listing what is present.
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
