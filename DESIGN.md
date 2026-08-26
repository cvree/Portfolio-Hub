# ONE SIGNAL

The design system behind [cvree.github.io/Portfolio-Hub](https://cvree.github.io/Portfolio-Hub/).

> **Care. Code. Competition. One signal.**
>
> Connor's identity is encoded as a living signal: one decisive QRS assembles
> CARE, BUILD and COMPETE into a bespoke CE monogram, and that same signal
> conducts the visitor through six genuinely different pieces of product
> evidence.

---

## 1. The concept

Connor Eppolito is an NREMT-certified EMT, a senior Health Science student, a
phlebotomy technician in training, the president of a collegiate esports club,
and the builder of six shipped products. Those are not four careers that happen
to belong to one person. They are one disposition — *build calm, high-signal
systems for people under pressure* — expressed in four rooms.

A heartbeat is the one signal every human being reads without being taught. So
the site does not illustrate that disposition; it draws it. A single ECG trace
crosses the first viewport, assembles the monogram on its QRS, becomes the
progress spine beside the six projects, and finishes as the reading-progress
line at the top of every page. There is one signal, and everything on the site
is a state of it.

### What the previous design got wrong

The site this replaces was engineered extremely well and art-directed around
the wrong object. Its hero was a cropped screenshot of the Order of Draw drill
inside an "Evidence Aperture" — camera blades, registration corners, a
tournament bracket and a medical rail, three metaphors competing and none
winning. The signature object was a raster of a product the visitor had no
context for yet, and it appeared again, weaker, in project 03.

Three specific failures drove this redesign:

1. **The hero object was a bitmap.** Cropped at both breakpoints, so the
   evidence it was showing was partly hidden at every size.
2. **Motion promised what it could not deliver.** `data-motion="sort"` and
   `data-motion="sequence"` were applied to wrappers containing exactly one
   `<img>`. Code that staggers children was animating one raster layer. The
   product-specific physics existed in the naming, not in what a visitor felt.
3. **Six structurally identical rows** taught the entire interaction grammar
   after the first one.

Everything true about the old site — the evidence-first writing, the complete
no-JS path, the reduced-motion contract, the self-hosted fonts, the zero-CDN
critical path, the honest status labels — survives unchanged.

---

## 2. The object: the CE Signal Sculpture

The hero is a monogram assembled from three planes of aligned SVG geometry.
There is no raster image anywhere above Selected Works.

| Plane | Colour | Geometry | What it *is* |
| --- | --- | --- | --- |
| **CARE** | medical teal `#17a08f` | An open arc — the **C** — drawn as a monitor lead, with electrode points at both terminals | The clinical work. The C is open to the right, and the page's trace runs straight through its mouth. |
| **BUILD** | controlled cobalt `#5b7cf0` | A trunk and three branches — the **E** — with nodes at every junction and three short stubs | The product work, as the module graph it actually is. |
| **COMPETE** | warm solar gold `#d9a94a` | Four entrants, two semifinals, one final — converging on the tip of the E's middle branch | The competitive work. The champion's seat *is* part of the letterform. |

Aligned, they read as **CE** immediately. Separated — by a few pixels of
pointer parallax, or by choosing a domain — they show what the identity is made
of.

The C does not carry a picture of a heartbeat. It reads the one the page is
already drawing. That is the whole idea in one detail: the signal belongs to
the page, and the clinical plane is what is open to it.

### Hard limits on the object

- Plane separation under the pointer: **≤ 14 px** at full deflection.
- Whole-object tilt: **≤ 3°**.
- The native cursor is never replaced, and the object never follows it.
- On touch, the explicit CARE / BUILD / COMPETE controls are the interaction.
  Nothing on this site requires a hover.

---

## 3. Tokens

### Colour

Two surfaces, and they mean different things:

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#0b0c0e` | The site proper — cinematic, atmospheric |
| `--ink-raised` | `#121418` | A card, a row, a reconstructed layer |
| `--paper` | `#f4f0e8` | The printed artefact: the résumé |
| `--text` | `#ece8df` | 15.9:1 on ink |
| `--text-quiet` | `#9d9a90` | 7.0:1 on ink — the floor for anything under 18 px |
| `--text-faint` | `#6f6d66` | 3.8:1. **Large text and non-text marks only.** |

Three domain colours, and six project accents taken from the running products:

```
--care    #17a08f     spellbomb       #f0a23c
--build   #5b7cf0     health-journal  #7fa6f0
--compete #d9a94a     phlebotomy      #17a08f
                      manifester      #c99189
                      owcs            #b9e24d
                      paper-animator  #ded7c6
```

Chrome — the navigation, the rules, the type — never changes colour. Only the
marks do.

> **Contrast rule.** `--text-faint` is 3.8:1 and fails AA below 18 px. Anything
> small takes `--text-quiet`. A decorative layer that carries text is never
> parked at a partial opacity: it is either absent or legible, because a
> permanently half-opaque label is a contrast failure that no scanner will
> forgive and no reader will thank you for.

### Type

| Token | Face | Role |
| --- | --- | --- |
| `--display` | Instrument Serif | The name, project titles, the numbers that matter |
| `--read` | Newsreader | Body copy — this is a document before it is a screen |
| `--ui` | Space Grotesk | Controls, labels, decisive one-line statements |
| `--mono` | IBM Plex Mono | Indices, metadata, anything that reports rather than argues |

All four are self-hosted latin subsets. No font CDN is contacted, ever.

### Rhythm

`--shell: 1320px` · `--gutter: clamp(1.25rem, 4.4vw, 3.5rem)` ·
`--measure: 39.6em` (em rather than `ch`, so a webfont swap cannot re-wrap the
page) · `--radius: 3px`.

---

## 4. Motion law

Every important motion follows **anticipation → action → settle**.

| Class | Duration |
| --- | --- |
| Micro feedback | 120–220 ms |
| Standard state change | 320–520 ms |
| Hero arrival, complete | ~1.5 s, finite, once |
| Major scene transformation | 550–900 ms plus a restrained settle |

Magnetic travel ≤ 4 px. Pointer tilt ≤ 3°. **One dominant event at a time.**

### The arrival

All of it is CSS keyframes. It starts at first paint, it costs the main thread
nothing, and the first input of any kind ends it.

```
0–240 ms      the calibration line and the resting trace become visible
120–700 ms    a bright sample head crosses the viewport
~420 ms       the QRS strikes; one refraction ring passes the object
420–1100 ms   the three planes come out of a controlled exploded state into
              exact alignment, and the CE resolves
650–1250 ms   an ink edge travels the name, line by line
1000–1500 ms  the credentials and the actions settle on a mechanical detent
by ~1600 ms   still, and waiting
```

**Nothing in that sequence gates a word.** Every keyframe either runs on
something decorative or starts from a partial opacity that is already legible.
The name is opaque in the first frame; what travels across it is a bright edge
*over* type that was readable before the edge arrived. Primary copy never
starts at `opacity: 0`.

The planes arrive from an *exploded* state, never from nothing — a visitor who
lands mid-sequence sees a monogram coming together, not a blank rectangle
waiting to be filled.

### The three rules

1. Nothing a visitor needs is drawn into existence by an animation.
2. Every enhanced starting state is applied through `html.js`, set by a
   synchronous statement in `<head>`. There is no frame in which the assembled
   sculpture is visible before it explodes, and no frame in which a control
   that cannot work is on screen.
3. Every start state lives inside
   `@media (prefers-reduced-motion: no-preference)` and behind
   `html.js:not([data-motion="off"])`. So stillness needs almost no CSS of its
   own: when motion is refused those rules never apply, and the composed final
   frame is simply what the document is.

---

## 5. Selected Work: six living specimens

Six rooms, six motion laws, one spine.

The layout is a grid and nothing more. Each article is its own two-column room:
the reading column on the left, the scene on the right, and the scene is
`position: sticky` **inside its own article**. The stage holds while you read
its project and hands off physically to the next one when you leave.

That hand-off is the browser's own scrolling. There is no pin, no wheel
listener, no snap, no forced horizontal travel and no scroll jail. At one
column the grid collapses and every scene sits with its own copy — which is the
mobile design, not a fallback for it.

| # | Project | Law | What actually moves |
| --- | --- | --- | --- |
| 01 | SpellBomb | **fuse** | A fuse burns once toward the bomb with a spark riding it; eleven real tray slots take the seven letters the capture holds, snapping in with one firm handoff each. |
| 02 | Health Journal | **accumulate** | The stage opens from a wide slice to the full tall record; one real chart line draws; the solar arc the product computes runs once behind it. |
| 03 | Phlebotomy Exam Prep | **order** | Six real tube cards, in the six CLSI positions with their real additives, arrive in the wrong seats, travel to the right ones and lock. The graded capture resolves only once the sequence is correct. |
| 04 | Manifester | **fold** | Builder and player fold toward one another; the orb takes exactly one breath; one real line of interface text arrives; the scene goes still. |
| 05 | OWCS Comp Tracker | **scan** | One scan line crosses the detected timeline; five detected rows arrive out of order and snap into the reviewed one, with the row under the confidence gate still marked. |
| 06 | PaperAnimator | **cite** | A highlight is drawn on the page, a curved tether runs from it to the scene it produced, and the page performs one shallow fold. |

No transition is fade-only or scale-only. No two rooms share a law.

**The rule that made the difference:** if a scene promises ordering,
sequencing, cards, rows or nodes, the things being ordered have to exist as
real, separately addressable elements. `--from` is the seat a card starts in
and `--i` is the seat it belongs in; the card physically crosses the distance
between them. `tests/hero.spec.ts` asserts this — six cards, six wrong seats,
six correct destinations.

Reconstructions are `aria-hidden`. The article beside them already states every
fact they show, and walking a screen reader through a decorative rebuild of a
screenshot is not access, it is noise. Every capture that *is* in the tree
carries a real description of what is actually in it, and no capture appears
twice.

**The Order of Draw appears here and nowhere earlier.** It is the payoff of
project 03, not the site's opening image.

---

## 6. Responsive

The phone gets its own composition, not a narrower copy of the desktop one.

- Identity-first opening; natural overflow on short screens, no `100vh` trap.
- At **390 × 844**, before the first scroll: the name, `@cvree`, the location,
  the availability, all four credentials, and **both** primary actions.
- The assembled sculpture stands **behind and slightly right of the name** at
  ~62 vw, as a field rather than as an illustration.
- CARE / BUILD / COMPETE become a three-position segmented touch control; every
  target clears 44 px.
- The project rail stops being a spine and becomes a swipeable chapter index.
  It is **not** sticky: on a phone a sticky index is a permanent tax on the
  shortest dimension the visitor has.
- Below 560 px, side-by-side comparisons stack rather than becoming two
  illegible halves. **An interface capture shrunk until its text is texture is
  not evidence of anything** — `tests/hero.spec.ts` fails any capture under
  150 px wide.

Verified at 1440×900, 1920×1080, 390×844 and 844×390 (landscape phone). Zero
horizontal overflow at every one.

---

## 7. Dependencies, and two deliberate removals

Every dependency must earn its bytes, have a documented role and a fallback,
and make the result more *ownable* rather than advertise that a library was
used.

| Shipped | Gate | Cost |
| --- | --- | --- |
| `assets/vendor/signal.js` — pointer parallax, no dependency | fine pointer, ≥1000 px, not Save-Data, motion allowed | **0.5 KB gzip** |
| `assets/vendor/atmosphere.js` — one OGL shader plane | the above, plus WebGL and ≥4 GB reported memory | **15.1 KB gzip** |

Neither is in the critical path. Neither is ever required for a page to be
complete.

### GSAP was removed

GSAP earned its 44.8 KB gzip when the hero was a pinned, scrubbed ScrollTrigger
timeline that had to stay in step with the scroll position across five
elements. **The hero is no longer a scrubbed timeline.** Every motion in this
design is a finite transition that plays once and settles — which is precisely
what CSS keyframes express: off the main thread, at no scripting cost, and with
the composed final frame as the state that renders when motion is refused.

Keeping an animation engine to re-implement that would have been two engines
doing one job, and 44.8 KB of it. The lazy payload fell from **62.4 KB gzip to
15.6 KB**.

### Lenis was declined

With no shared GSAP ticker left to synchronise against, Lenis would have been
this site's only runtime dependency a visitor could feel go wrong — and all six
Selected Work rooms are built on native sticky positioning. The browser's own
scrolling is not a detail of this design, it is the mechanism.

### Studied, not installed

React Bits, Skiper UI and 21st.dev were read for interaction vocabulary —
depth-on-selection, staggered ordering, spotlight response — and the useful
principles rebuilt as original semantic HTML/CSS in this stack. No React was
added to obtain an effect. Remix was not adopted: the deterministic generator,
the physical routes and the complete no-JS delivery are worth more here than a
framework. Manus is a process benchmark, not a runtime integration.

*(The three Instagram motion references in the brief require an authenticated
session and could not be opened from this environment. Nothing was invented
about their contents.)*

---

## 8. Anti-patterns

Not on this site, deliberately:

gradient orbs · particle soup · starfields · code rain · purple/cyan cyberpunk
· glow on every surface · glassmorphism as a system · a bento grid as page
structure · stock 3D models · recognisable component demos · full-screen
preloaders · "enter experience" gates · custom cursors · cursor-following blobs
· endlessly moving body copy · autoplay audio or video · forced horizontal
scroll · scroll snapping · scroll-jail storytelling · fake HUD metrics ·
fictional telemetry · invented testimonials, users, detections, clinical values
or project numbers · emoji as interface iconography · two animation engines
doing one job.

**Nothing on this site makes a sound until somebody presses the control that
says it will.** Every tone is an oscillator and an envelope built in the
browser at the moment it is needed; the `AudioContext` is not even constructed
until the first press. A stored "on" is deliberately not honoured on load — a
page that starts making noise because of something you did on a previous visit
is a page that autoplays sound, whatever the reason.

---

## 9. What every state has to hold

| State | What the visitor gets |
| --- | --- |
| **No JavaScript** | All three domains open as a proof row. The sculpture assembled. The trace a complete static path. Six ordinary articles with six ordinary links. Every scene its composed final frame. No control on screen that cannot work. |
| **`prefers-reduced-motion: reduce`** | The same, with the domain controls live and every change instant. No canvas, no sweep, no start states — because none of them is ever applied. |
| **The site's motion control** | Identical to the above, and remembered. It can only ever make the site *stiller* than the operating system asked for. |
| **Save-Data** | Native scrolling, no module requested at all, and the control still works — withholding a control is not the same as withholding an effect. |
| **Coarse pointer** | State selection instead of hover depth. Every target ≥ 44 px. Nothing anywhere depends on hovering. |
| **Keyboard** | Real radio inputs in a real fieldset, so arrow keys, roving focus and announced position come from the browser rather than from a re-implementation. Focus indication at least as clear as hover. |

**No fact exists only in an inactive enhanced state.** With no script every
proof group is open; with a script the controls choose which one stands. The
information does not change — only how much of it is on screen at once.
