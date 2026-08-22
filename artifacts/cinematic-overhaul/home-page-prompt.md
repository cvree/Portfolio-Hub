# PROMPT — Make `index.html` an instrument somebody operates

You are the principal creative developer, motion director, interaction designer,
accessibility engineer and performance engineer on Connor Eppolito's portfolio.

Repository: https://github.com/cvree/Portfolio-Hub — currently at `main`
(`4622db0`), which already carries the Evidence Aperture release. **Read that
release before you touch anything**: `README.md`, `assets/site.css`,
`assets/site.js`, `assets/src/`, `templates/base.html`, `tools/build_pages.py`,
`tests/`, and `artifacts/cinematic-overhaul/`. You are escalating a system that
already works, measured, on eleven other pages. You are not rebuilding it.

**Scope: `index.html` only.** The other eleven pages change only where a shared
token, a shared component or the generator forces it, and if they change they
must be re-verified. Do not return a plan, a mockup or a proposal. Inspect,
baseline, build, test, capture matched evidence, commit, push.

---

## 1 · The problem, stated precisely

The home page is currently *correct* and *quiet*. It reads like a well-typeset
paper. Name these five failures out loud before you fix them, because each one
needs a different fix:

1. **It is a stack of blocks.** Eyebrow → name → four bullets → lede → two
   buttons → screenshot → eight identical cells → six identical rows → prose →
   six identical cards → contact. Every section is the same shape as the one
   above it. Nothing has a different *kind* of presence.
2. **Nothing on it responds.** The only interactions are links and one motion
   toggle. The aperture animates *at* you and then stops. A visitor cannot
   touch a single thing and watch the page answer.
3. **The evidence sits still and unexplained.** One screenshot, one caption.
   The most interesting thing on the page — a real clinical drill running — is
   presented as an illustration rather than as something to look into.
4. **The credibility strip is a wall of grey text.** Eight cells of 0.98rem
   prose is the single most academic object on the site. It is also, factually,
   the most impressive content on the page.
5. **The six projects are a list.** Six near-identical rows. The page never
   demonstrates that these are six *different kinds of thing*.

---

## 2 · The governing idea

> **The home page is one instrument, and the visitor is operating it.**

Not a document you scroll. A console you drive. Pick a channel — one of the six
products — and the *entire page* retunes to it in one continuous, connected
move: the accent, the shader's light and interference, the waveform of the
signal, the seed of the competitive bracket, the evidence in the aperture, the
read-out numbers, the caption, the link. One input, one visible machine
responding across five layers.

That is where the pop comes from. Not from more animation. From **causality
that is visible and physical** — the Symphony of Vines lesson: every interaction
inherits the force being described.

It must still read as: *a film title sequence crossed with a precise clinical
instrument panel crossed with a premium competitive-broadcast package, authored
for one specific person who works in emergency medicine, esports and health
software.* Never as a SaaS landing page, never as a toy.

**The governing rule from the original brief still holds and outranks everything
here: make navigation ordinary, evidence undeniable, and storytelling
extraordinary.** If any idea below makes navigation less ordinary, the idea
loses.

---

## 3 · The four systems to build

### 3.1 THE CHANNEL — the hero becomes tunable (the centrepiece)

The Evidence Aperture stops being a fixed frame and becomes a **six-position
instrument**. A restrained selector — six labelled positions, one per product,
rendered as a real `<fieldset>` of radios or a `role="tablist"`, styled as a
broadcast channel strip — sits under the evidence.

Changing channel retunes, in one 500–700 ms coordinated move:

- **`--accent`** on the hero, animated through `@property` so the transition is
  a real interpolation and not a jump. Use the six existing project accents
  already defined in `assets/site.css` (`spellbomb #f0a23c`, `health-journal
  #7fa6f0`, `phlebotomy #17a08f`, `manifester #c99189`, `owcs #b9e24d`,
  `paper-animator #ded7c6`). Invent nothing.
- **The signal.** Each product gets its own waveform, and the waveform *means*
  something about that product — SpellBomb's is a fuse that spikes and drops,
  Health Journal's is a slow circadian rise, Phlebotomy's is a clean clinical
  trace, Manifester's is a breath, OWCS's is a square-wave swap timeline,
  PaperAnimator's is a page fold. Morph between them (SVG path interpolation of
  matched point counts, or a CSS `d` transition where supported, with a
  cross-fade fallback).
- **The bracket** reseeds — different branch depth and node positions per
  channel — and converges on the evidence again.
- **The evidence** swaps to that product's real screenshot from
  `assets/projects/`, moving *through* the aperture rather than cross-fading:
  blades close a little, the new capture arrives, blades open.
- **The shader** takes the new accent, and one uniform shifts with it so the
  light behaves differently per channel (tighter interference for OWCS, softer
  refraction for Manifester). Subtle. It should register as the room changing,
  not as a filter.
- **The read-out** under the aperture shows that product's real facts — the
  ones already written in `pages/index.html` and the case studies. Runtime,
  status, stack, version. Numbers you can check. Nothing invented.
- **The link** re-points to that case study, and its label names the product.

Rules:
- Channel 1 is loaded and composed on arrival. No blank state, ever.
- Hovering a channel *previews* on fine pointers; committing requires click,
  tap, `Enter`/`Space`, or arrow keys within the group.
- Arrow keys move between channels with roving `tabindex`. `Home`/`End` jump.
- The URL does not change and history is not touched. This is a hero, not a
  router.
- With JavaScript off, the fieldset renders as six ordinary links to the six
  case studies, and channel 1's composition is the static frame. **That is the
  no-JS design, and it must look deliberate — not like a broken widget.**
- Reduced motion: the retune becomes an instant state change. The selector
  still works. Nothing is withheld.

### 3.2 THE SPECIMEN — the screenshot becomes something you look into

The real capture in the aperture gains **two to four hotspots**, positioned in
normalised coordinates so they survive every responsive width. Each names a real
part of the real interface, in text drawn from the alt text and the case study
already written — e.g. on the Order of Draw drill: *"six CLSI positions, drawn
in their real cap colours"*, *"the mnemonic, and the warning to read the label
not the cap"*.

- A hotspot is a real `<button>` with an accessible name; its panel is
  `aria-expanded`-controlled and appears beside the frame, never over the thing
  it describes.
- On coarse pointers they are tap targets ≥ 44 px, opened on tap.
- Reduced motion: no travel, just appearance.
- No JS: hotspots are not rendered at all, and the figcaption already carries
  the meaning. **Nothing that only exists in a hotspot may be information a
  visitor needs.**
- Do not invent a single fact. If it isn't in the screenshot, it isn't a
  hotspot.

### 3.3 THE VITALS — the credibility strip becomes a panel, not a paragraph

Kill the wall of eight grey cells. Rebuild it as an **instrument read-out** with
real hierarchy and real weight:

- The number or the certification is the loudest thing in each cell — set in
  Instrument Serif at display size, in the accent. The label is IBM Plex Mono,
  small. The sentence is the third thing, not the first.
- Two or three cells are physically larger than the others: the NREMT
  certification, the club presidency, the 3.813 GPA / research. An eight-up
  uniform grid is the academic reflex; break it.
- Counting numbers animate once on entry (`105`, `3.813`, `513`, `257`), via
  `@property` on a registered custom property with `counter-reset`, never with
  a JS tick loop. They must render at their final value with no JS and under
  reduced motion.
- Give the panel one hairline connective structure — the sequence law from
  `phlebotomy-exam-prep.html` — so it reads as one machine, not eight tiles.
- **Every word of the existing copy stays true.** You may re-typeset it, split
  it, promote a number out of it. You may not add a claim.

### 3.4 THE RIG — the six projects stop being a list

The Selected Work index on the home page becomes six objects that are visibly
*different kinds of thing*, each carrying its own motion law (they are already
defined in `assets/site.css`: `fuse`, `grow`, `sequence`, `breathe`, `sort`,
`unfold`).

- Each row's screenshot inherits its product's physics on entry — the fuse row
  burns, the record row grows, the sequence row settles in order.
- The row that matches the currently tuned channel is visibly *live*: its accent
  marker is lit and its status chip is active. Tuning the hero highlights it.
  Hovering or focusing a row previews it in the hero. **One page, one state.**
- Vary the rows' rhythm — full-bleed, offset, tall, wide — so scrolling the
  index feels like moving through six different rooms, not down six identical
  drawers. Do not turn it into a bento grid. Do not add a seventh visual style
  for its own sake.
- The whole row stays one link. No nested competing targets.

---

## 4 · The interaction contract

Every interactive thing you add must have, and you must prove it has, all five:

| | Requirement |
|---|---|
| **Pointer** | Hover previews; it never commits |
| **Touch** | A ≥ 44 px target; tap commits; no hover-only information anywhere |
| **Keyboard** | Reachable in reading order, operable with `Enter`/`Space`/arrows, visible focus ring, no trap |
| **Reduced motion** | The same state change, arriving instantly, with the composition intact |
| **No JavaScript** | Either a working native equivalent, or absent entirely — never a dead control |

And three hard limits:

- **Nothing may be learnable-before-usable.** A recruiter who ignores every
  interactive element must still get the whole page, both actions, and the
  résumé, by scrolling and clicking links.
- **No interaction may be the only route to any fact.**
- **No interaction may delay navigation.** Ever.

---

## 5 · What must not regress — measured, not asserted

The current `main` holds these numbers. Re-measure every one of them at the end
and put both columns in your final response. A regression in any row is a
failure of the whole task, not a trade-off.

| | Current on `main` |
|---|---|
| Lighthouse mobile, `index.html` | performance **98**, a11y **100**, BP **100**, SEO **100** |
| Lighthouse desktop, `index.html` | **100 / 100 / 100 / 100** |
| Mobile LCP · CLS · TBT | **2.27 s** · **0.000** · **0 ms** |
| `index.html` transfer | **212 KB** |
| Lazy cinematic JS | **59.5 KB gzip** (budget 100 KB) |
| Playwright | **174 passing** |
| Axe | **0 serious or critical**, 12 pages × 2 widths |
| Résumé print | **exactly 2 pages**, Letter and A4 |
| Horizontal overflow | **none** at 390 / 768 / 1440 / 1920 |
| Fallback font drift | **≤ 0.12 %** (`tools/calibrate_fallbacks.mjs`) |

And these architectural facts, which are the site's identity:

- Twelve static pages at the root, generated by `tools/build_pages.py` from
  `pages/*.html` + `templates/base.html`. **Edit the sources, then regenerate.
  Never patch generated HTML.** CI fails on drift.
- One stylesheet (`assets/site.css`), one critical script (`assets/site.js`).
- No CDN, no remote runtime dependency, nothing outside the origin.
- Four self-hosted typefaces in their existing roles. The palette is the
  existing palette.
- Real screenshots only, from `assets/projects/`. Originals preserved.
- GSAP and OGL stay lazy, gated, and destroyed on exit. No new runtime
  dependency without measuring its gzip cost and justifying it in
  `assets/vendor/NOTICE.md`. **Lenis, Three.js, Rive, Spline, React, Vue and
  client-side routers remain forbidden.**
- Exactly one `h1`. Alt text, `width` and `height` on every image.
- The site must remain complete and navigable with JavaScript disabled.

If new interaction genuinely needs main-thread work, it goes in the lazy bundle
behind the same gates as the aperture — not in `assets/site.js`.

---

## 6 · Forbidden

Purple-gradient SaaS. Glowing blobs. Glassmorphism. Bento grids. Particles
without meaning. Fake devices, browser chrome, phone bezels, floating mockups.
Invented metrics, testimonials, awards, logos or users. AI-generated imagery or
copy. A loader. An "enter experience" gate. Scroll-jacking, scroll velocity
changes, wheel or touch interception, ScrollSmoother. Hidden navigation.
Autoplaying audio. A game a recruiter has to learn. Anything that undermines
healthcare professionalism — no blood spectacle, no clinical kitsch.

Cursor-following blobs are forbidden. Light passing through a precision
instrument is the effect. Know the difference.

---

## 7 · Order of work

1. Baseline: record the SHA, run `npm run check` and `npm test`, capture
   `tools/shots.mjs` and both Lighthouse configs. Do not start until you have
   numbers to beat.
2. Re-typeset THE VITALS. Pure CSS, no new JS. Ship the biggest visual change
   for the smallest risk first.
3. THE RIG — per-project physics and rhythm on the work index.
4. THE CHANNEL, static first: build all six compositions as real markup and
   real CSS state, driven by nothing. Verify the no-JS design of all six.
5. THE CHANNEL, wired: the selector, the retune, the accent interpolation.
6. THE CHANNEL, shader-aware: uniforms follow the channel.
7. THE SPECIMEN hotspots.
8. Mobile art direction pass at 390 and 844×390. Composed, not shrunk.
9. No-JS and reduced-motion pass — screenshot every state, look at it.
10. Re-run everything in §5. Fix what moved.
11. Regenerate, commit, push.

---

## 8 · What you owe at the end

- The pushed branch and final SHA.
- Before/after home screenshots at **1440×900** and **390×844**, plus full-page
  captures, from the same script at the same scroll positions.
- Screenshots of the home page with **JavaScript disabled** and under
  **reduced motion**, desktop and mobile — and a sentence on each saying why it
  looks deliberate.
- One screenshot per channel, so all six compositions are on the record.
- The §5 table with both columns filled in from real runs.
- Full `npm test` output and the test count.
- Any new package: exact version, licence, gzip weight, and why nothing already
  present could do it.
- Honest caveats. If something is over budget, say the number. Never replace a
  measurement with a claim.

---

## 9 · Done means

A hiring manager opens the page and stops — because it does not look like a
portfolio template. They touch one thing and the whole page answers, and they
understand instantly that they are looking at a machine somebody built on
purpose. They learn in ten seconds that Connor is a health science senior, an
NREMT-certified EMT, a phlebotomy technician in training, a club president and
someone who ships real software. They believe it, because every screenshot is a
real product running. They remember the channel strip a week later. And they
reach the résumé without thinking about it once.
