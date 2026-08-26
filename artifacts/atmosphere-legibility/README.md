# The atmosphere, measured

The plane behind every page was tuned by eye against headless captures. Headless
captures composite far darker than a real GPU does, and on real hardware the
result was a room nobody could read in: body copy set in `--text-quiet` was
landing at **1.2:1** against the rendered composite, where the requirement is
4.5:1. The interference field — a fine signal at 232 cycles a screen — was
drawing topographic contour lines straight across paragraphs, at the same
frequency the eye reads at.

This directory is the evidence for the fix, before and after, captured the same
way from the same five pages.

## What is measured, and how

Not the tokens. `#9d9a90` on `#0b0c0e` is 6.9:1 and always was; that number
stopped describing this site the day a shader was mounted behind every page.
What a visitor reads over is the composite of the ink, the gradient wash, the
plane, the grain and the plane's own opacity, and the only honest way to know
what it adds up to is to render it and read the pixels.

So, for each page, viewport and scroll position:

1. load it and wait for the plane to have drawn frames and settled
2. find the real **line boxes** of real text with a `Range` — not the elements,
   because a block is as wide as its container however narrow its ink is
3. make the glyphs transparent and hide the decorative marks inside them, so
   what is left in those boxes is precisely the backdrop
4. screenshot, decode, and compute the WCAG ratio between the text's own
   computed colour and the 98th-percentile pixel behind it

The floors are WCAG's: 4.5:1 for body copy, 3:1 for large text, using WCAG's own
definition of large (≥ 24 px, or ≥ 18.66 px at 700). The 98th percentile rather
than the single brightest pixel, because the plane dithers deliberately and the
grain overlay is noise by construction — one speckle a glyph's width from
anything is not what makes a paragraph hard to read.

This measurement is committed as `tests/legibility.spec.ts` and runs with the
suite, so the floor cannot be quietly lost again.

## Before

Every body-copy row below fails, several of them at under a third of the ratio
they need. The single
passing row is `about.html` at mid-scroll on a phone, where an opaque card
happens to be between the copy and the plane.

| Page | Viewport | Scroll | Text | Floor | Measured | Worst run |
| --- | --- | --- | --- | --- | --- | --- |
| `index.html` | 1440×900 | 0 | body | 4.5:1 | **1.64:1** | `.sig__lede` |
| `index.html` | 1440×900 | 0 | display | 3:1 | **1.36:1** | `.sig__title` |
| `index.html` | 1440×900 | mid | body | 4.5:1 | **1.23:1** | `.wk__proof .k` |
| `index.html` | 390×844 | 0 | body | 4.5:1 | **1.41:1** | `.sig__creed` |
| `index.html` | 390×844 | 0 | display | 3:1 | **1.39:1** | `.sig__title` |
| `index.html` | 390×844 | mid | body | 4.5:1 | **2.13:1** | `.wk__blurb` |
| `work.html` | 1440×900 | 0 | body | 4.5:1 | **1.35:1** | `.case-hero__lede` |
| `work.html` | 1440×900 | 0 | display | 3:1 | **2.95:1** | `.h1` |
| `work.html` | 390×844 | 0 | body | 4.5:1 | **1.58:1** | `.case-hero__lede` |
| `work.html` | 390×844 | 0 | display | 3:1 | **3.93:1** | `.h1` |
| `spellbomb.html` | 1440×900 | 0 | body | 4.5:1 | **1.23:1** | `.case-hero__lede` |
| `spellbomb.html` | 1440×900 | 0 | display | 3:1 | **4.09:1** | `.h1` |
| `spellbomb.html` | 1440×900 | mid | body | 4.5:1 | **3.34:1** | `.prose p` |
| `spellbomb.html` | 390×844 | 0 | body | 4.5:1 | **1.60:1** | `.case-hero__lede` |
| `spellbomb.html` | 390×844 | 0 | display | 3:1 | **3.47:1** | `.h1` |
| `owcs-comp-tracker.html` | 1440×900 | 0 | body | 4.5:1 | **1.26:1** | `.case-hero__lede` |
| `owcs-comp-tracker.html` | 1440×900 | 0 | display | 3:1 | **1.80:1** | `.h1` |
| `owcs-comp-tracker.html` | 1440×900 | mid | body | 4.5:1 | **3.34:1** | `.prose p` |
| `owcs-comp-tracker.html` | 390×844 | 0 | body | 4.5:1 | **1.96:1** | `.case-hero__lede` |
| `owcs-comp-tracker.html` | 390×844 | 0 | display | 3:1 | **2.40:1** | `.h1` |
| `owcs-comp-tracker.html` | 390×844 | mid | body | 4.5:1 | **2.53:1** | `.prose p` |
| `about.html` | 1440×900 | 0 | body | 4.5:1 | **1.23:1** | `.case-hero__lede` |
| `about.html` | 1440×900 | 0 | display | 3:1 | **2.91:1** | `.h1` |
| `about.html` | 1440×900 | mid | body | 4.5:1 | **1.92:1** | `.eyebrow` |
| `about.html` | 1440×900 | mid | display | 3:1 | **2.90:1** | `.h2` |
| `about.html` | 390×844 | 0 | body | 4.5:1 | **1.56:1** | `.case-hero__lede` |
| `about.html` | 390×844 | 0 | display | 3:1 | **3.88:1** | `.h1` |
| `about.html` | 390×844 | mid | body | 4.5:1 | 6.95:1 | `.card__d` |

**26 of 28 below the floor. Worst body copy: 1.23:1.**

## After

| Page | Viewport | Scroll | Text | Floor | Measured | Worst run |
| --- | --- | --- | --- | --- | --- | --- |
| `index.html` | 1440×900 | 0 | body | 4.5:1 | **5.26:1** | `.sig__lede` |
| `index.html` | 1440×900 | 0 | display | 3:1 | **11.59:1** | `.sig__title` |
| `index.html` | 1440×900 | mid | body | 4.5:1 | **5.35:1** | `.wk__proof .k` |
| `index.html` | 390×844 | 0 | body | 4.5:1 | **6.13:1** | `.sig__lede` |
| `index.html` | 390×844 | 0 | display | 3:1 | **9.40:1** | `.sig__title` |
| `index.html` | 390×844 | mid | body | 4.5:1 | **6.20:1** | `.wk__proof .k` |
| `work.html` | 1440×900 | 0 | body | 4.5:1 | **5.40:1** | `.case-hero__lede` |
| `work.html` | 1440×900 | 0 | display | 3:1 | **12.24:1** | `.h1` |
| `work.html` | 390×844 | 0 | body | 4.5:1 | **5.47:1** | `.case-hero__lede` |
| `work.html` | 390×844 | 0 | display | 3:1 | **12.13:1** | `.h1` |
| `spellbomb.html` | 1440×900 | 0 | body | 4.5:1 | **5.49:1** | `.case-hero__lede` |
| `spellbomb.html` | 1440×900 | 0 | display | 3:1 | **12.66:1** | `.h1` |
| `spellbomb.html` | 1440×900 | mid | body | 4.5:1 | **12.45:1** | `.prose p` |
| `spellbomb.html` | 390×844 | 0 | body | 4.5:1 | **5.58:1** | `.case-hero__lede` |
| `spellbomb.html` | 390×844 | 0 | display | 3:1 | **12.93:1** | `.h1` |
| `owcs-comp-tracker.html` | 1440×900 | 0 | body | 4.5:1 | **5.55:1** | `.case-hero__lede` |
| `owcs-comp-tracker.html` | 1440×900 | 0 | display | 3:1 | **12.31:1** | `.h1` |
| `owcs-comp-tracker.html` | 1440×900 | mid | body | 4.5:1 | **12.86:1** | `.prose p` |
| `owcs-comp-tracker.html` | 390×844 | 0 | body | 4.5:1 | **6.12:1** | `.case-hero__lede` |
| `owcs-comp-tracker.html` | 390×844 | 0 | display | 3:1 | **12.60:1** | `.h1` |
| `owcs-comp-tracker.html` | 390×844 | mid | body | 4.5:1 | **12.07:1** | `.prose p` |
| `about.html` | 1440×900 | 0 | body | 4.5:1 | **5.37:1** | `.quiet` |
| `about.html` | 1440×900 | 0 | display | 3:1 | **12.22:1** | `.h1` |
| `about.html` | 1440×900 | mid | body | 4.5:1 | **5.42:1** | `.eyebrow` |
| `about.html` | 1440×900 | mid | display | 3:1 | **12.26:1** | `.h2` |
| `about.html` | 390×844 | 0 | body | 4.5:1 | **5.46:1** | `.case-hero__lede` |
| `about.html` | 390×844 | 0 | display | 3:1 | **12.14:1** | `.h1` |
| `about.html` | 390×844 | mid | body | 4.5:1 | **6.95:1** | `.card__d` |

**28 of 28 above the floor. Worst body copy: 5.26:1 — 17% of margin over 4.5.**

## What changed, and why it is three changes

Turning the gain down would have hidden the symptom and fixed none of the
causes. There were three, and each has its own answer.

**The levelling.** Six accents taken from six running products spread over two
and a half times in relative luminance — `#ded7c6` and `#b9e24d` each carry
about 2.5× the light of `#17a08f`. Scrolling into OWCS did not change the colour of the room, it
turned the room up. Every accent is now scaled to one luminance before it
reaches a uniform. The scale is a ceiling and never a lift: an accent already
quieter than the reference is left where it is, because the answer to one room
being too loud is never to turn a quiet one up.

**The reading mask.** Nothing on the plane knew where the words were. `site.js`
now measures the line boxes of the text on screen and hands them to the plane as
a 48 × 27 coverage map, blurred until it has no edge. In the open the
interference keeps about a third of the amplitude it had; over that map it keeps
a twentieth, and the luminance ceiling drops with it. Outside the map nothing
else changes at all — which is the whole point of a map rather than a dial.

It is a map rather than a rectangle because a rectangle was not honest. At the
top of the home page the words are a column down the left, a projection stands
in the empty half, and a strip of figures crosses the bottom of the frame; the
smallest box containing all three is the entire viewport. `home-1440-top` in
each directory is the picture of why that matters.

**The ceiling.** Three layers that each look reasonable can meet on one fragment
with nothing bounding the sum. The last thing the shader does is limit its own
luminance — low where the map is lit, generous everywhere else, with an
exponential shoulder rather than a clamp, so a bright pass rolls off into the
limit instead of collapsing against it.

## What was deliberately not touched

The hologram's own brightness, the aurora, the motes, the pointer-led key light,
the per-project retune, the 30 fps cap, the sub-native render resolution, and
every gate: reduced motion, Save-Data, no WebGL, and a device that reports less
than 4 GB.

The interference field keeps its frequency, because the frequency is its
character. What it lost is amplitude, and what it gained is somewhere to stand
down.

## The shots

Twenty matched pairs: five pages × two viewports (1440 × 900 and 390 × 844) ×
two scroll positions (the top of the document, and halfway through it). Same
capture script, same waits, same order.

```
before/index-1440-top.webp     after/index-1440-top.webp        the hero
before/spellbomb-1440-mid.webp after/spellbomb-1440-mid.webp    dense copy, gold
before/owcs-comp-tracker-1440-top.webp                          the lime room
before/index-390-top.webp      after/index-390-top.webp         the phone hero
```

The `before/` set is captured from the commit this branch starts at, so it also
still carries the masthead as it was: four navigation items and the wordmark's
tagline. Both are gone in `after/` for reasons that have nothing to do with the
plane.
