# ONE SIGNAL

The design system behind [cvree.github.io/Portfolio-Hub](https://cvree.github.io/Portfolio-Hub/).

> **Care. Code. Competition. One signal.**
>
> Connor's identity is a signal drawn across the whole site: an atmosphere
> plane that is the room every page is read in, a projected mark that is the
> one object in the first viewport, and a trace that reports how hard the
> visitor is reading it.

---

## 1. The concept

Connor Eppolito is an NREMT-certified EMT, a senior Health Science student, a
phlebotomy technician in training, the president of a collegiate esports club,
and the builder of six shipped products. Those are not four careers that happen
to belong to one person. They are one disposition — *build calm, high-signal
systems for people under pressure* — expressed in four rooms.

A heartbeat is the one signal every human being reads without being taught. So
the site does not illustrate that disposition; it draws it. A single ECG trace
runs the progress spine beside the six projects and the reading-progress line
at the top of every page, gaining amplitude with how hard you are reading. It
runs over an atmosphere plane that is the room the whole site is read in, and
in front of both stands one object: the GitHub mark, projected. There is one
signal, and everything on the site is a state of it.

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

## 2. The object: the projection

The hero is one object and no controls: the GitHub mark, projected. There is no
raster image anywhere above Projects.

It is a real volume rather than a picture of one. Six layers, all of them cut
from the same `<path>`:

| Layer | What it is |
| --- | --- |
| **The extrusion** | Eighteen `<use>` references to one path, stacked along Z at 2.4 px apart inside a `preserve-3d` scene, running a hue ramp from cyan at the face to violet at the back. Turning it reveals a solid rather than a sticker. |
| **The film** | An oil-slick conic spectrum clipped to the silhouette, with a specular highlight that sits wherever the pointer is. |
| **The ghosts** | Two more copies of the silhouette, cyan and magenta, in `screen` blend, pulled apart *along the current tilt* — so the chromatic split answers the object rather than sitting at a fixed offset pretending to. |
| **The scan** | A line raster and one bright bar travelling down through it, both clipped to the mark. |
| **The rings** | Three orbital rings, each on its own axis and its own clock, each with one bright arc so the rotation is legible rather than implied. |
| **The room** | A projector cone, a breathing emitter plate and a perspective floor grid under all of it. |

### What the previous object got wrong

What stood here before was a monogram assembled out of three planes — CARE as a
clinical arc, BUILD as a node graph, COMPETE as a bracket — with a
three-position radio group under it deciding which plane was lit.

It was a diagram of an idea about somebody rather than an object anybody wanted
to look at, and it cost more than it returned:

1. **It needed a caption to be understood.** A monogram whose meaning depends on
   a legend is a logo that failed.
2. **Its control hid two thirds of its own content.** Every fact in those three
   proof panels is restated, open and uncontested, in the credentials strip
   immediately below the hero. The tab set was a gate on information that was
   already free further down the page.
3. **It only moved if you had a mouse.** The whole interaction was pointer
   parallax and a fine-pointer-only hold.

The projection answers all three. It is a mark everybody already recognises, it
says nothing at all so nothing can be hidden behind it, and it turns for
everybody: the pointer leads the tilt, a drag throws it, a click nudges it, and
with no pointer at all the scroll turns it instead.

### Hard limits on the object

- Pointer tilt: **≤ 26° horizontally, ≤ 16° vertically.**
- Idle travel: a **42° sway**, never a full orbit. A mark turning a full circle
  spends a third of every revolution edge-on or backwards, which is a third of
  the time nobody can tell what they are looking at.
- A throw coasts and **stops**, inside about a second. A hero that never settles
  is a hero nobody can look away from.
- The native cursor is never replaced, and the object never follows it.
- It is `aria-hidden` and carries no fact, so nobody who ignores it loses
  anything. Turning it changes no state, no URL and no history entry.
- On a coarse pointer it is `pointer-events: none` and stands behind the copy:
  a draggable object in the first viewport is an object that eats the scroll.

---

## 3. Tokens

### Colour

Three surfaces, and they mean different things:

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#0b0c0e` | The site proper — cinematic, atmospheric |
| `--ink-raised` | `#121418` | A card, a row, a reconstructed layer |
| `--ink-deep` | `#07080a` | The record: the résumé, the same room one stop darker |
| `--paper` | `#f4f0e8` | The printed artefact — what the print stylesheet makes |
| `--text` | `#ece8df` | 15.9:1 on ink |
| `--text-quiet` | `#9d9a90` | 7.0:1 on ink — the floor for anything under 18 px |
| `--text-faint` | `#6f6d66` | 3.8:1. **Large text and non-text marks only.** |

Six project accents, taken from the running products:

```
spellbomb       #f0a23c     manifester      #c99189
health-journal  #7fa6f0     owcs            #b9e24d
phlebotomy      #17a08f     paper-animator  #ded7c6
```

Chrome — the navigation, the rules, the type — never changes colour. Only the
marks and the atmosphere do. Reading a project in Projects retunes the
plane behind the whole page to that project's own accent, over about a second:
the rail announces which room you are in through a `ce:room` event on the
document, and the shader answers it. Neither side imports the other, so either
can be absent without the other noticing.

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
0–420 ms      the floor grid, the projector cone and the emitter come up
180–1280 ms   the projection resolves: it arrives edge-on, small and
              transparent, and turns into its resting three-quarter view
650–1250 ms   an ink edge travels the name, line by line
1000–1400 ms  the credentials and the actions settle on a mechanical detent
by ~1500 ms   still, and waiting
```

**Nothing in that sequence gates a word.** Every keyframe either runs on
something decorative or starts from a partial opacity that is already legible.
The name is opaque in the first frame; what travels across it is a bright edge
*over* type that was readable before the edge arrived. Primary copy never
starts at `opacity: 0`.

The projection arrives the way one would — edge-on and transparent, resolving
into the object — never from nothing. A visitor who lands mid-sequence sees a
hologram coming up, not a blank rectangle waiting to be filled.

### The three rules

1. Nothing a visitor needs is drawn into existence by an animation.
2. Every enhanced starting state is applied through `html.js`, set by a
   synchronous statement in `<head>`. There is no frame in which the assembled
   object is visible before it materialises, and no frame in which a control
   that cannot work is on screen.
3. Every start state lives inside
   `@media (prefers-reduced-motion: no-preference)` and behind
   `html.js:not([data-motion="off"])`. So stillness needs almost no CSS of its
   own: when motion is refused those rules never apply, and the composed final
   frame is simply what the document is.

---

## 4b. The pulse layer — one signal, on every page

The arrival plays once and settles. What persists across the whole site is a
layer that answers the visitor, and it is built on the one signal every human
being already knows how to read.

**A heart rate answers effort, and then it settles.** So does this one. The
pulse layer writes three custom properties onto `<html>` and then gets out of
the way:

| Property | Range | What it is |
| --- | --- | --- |
| `--pulse` | 0 → 1 | **Exertion.** Scroll velocity, decaying back to nothing in about a second. |
| `--px`, `--py` | −1 → 1 | The pointer, eased. Fine pointers only. |

Three things read them:

1. **The trace across the top of every page** gains amplitude, glow and weight
   with `--pulse`. Scroll hard and the signal rises; stop and it comes back
   down to a resting rhythm. It is not decoration with a heartbeat painted on
   it — it is the one piece of state a visitor is already generating, reported
   in the one language nobody has to be taught.
2. **The hero trace** does the same, behind the name.
3. **The card on the contact page** tilts, and its foil rakes against the tilt
   the way a real specular highlight does.

The hold this module used to own — taking the sculpture in hand — belongs to
the hologram driver now. Two modules reaching for the same pointer was one
module too many, and the object that answers a hand should be the module that
listens for it.

### One beat, on a real activation

Pressing something that does something sends a single QRS down the trace at the
top of the page. Never on a scroll, never on a hover, never on load. Cause,
action, settle — 720 ms, once, and it clears itself.

### What it costs

**0.9 KB gzip, no dependency, and no layout.** One `requestAnimationFrame`
loop that stops running the moment everything is at rest, and stops entirely
when the document is hidden. Every value is clamped at the source rather than
trusted downstream. It never changes the height or the width of the document —
`tests/pulse.spec.ts` asserts exactly that.

It answers the same three gates as everything else: reduced motion, the site's
own motion control, and Save-Data. Under any of them it is never fetched and
not one property is ever written. On a phone it still loads, because the part
that matters most there is the part that needs no pointer at all.

### 4b-ii. The hologram driver

`assets/vendor/holo.js` is the same shape of thing, for the object in the hero:
**1.1 KB gzip, no dependency**, five custom properties on the host, and a frame
loop that stops itself the moment nothing is moving, the object leaves the
screen, or the tab goes behind something else.

| Property | What it is |
| --- | --- |
| `--rx`, `--ry` | The tilt the pointer leads, in degrees. |
| `--spin` | The angle a drag has thrown, in degrees, with inertia. |
| `--tilt` | The same horizontal tilt as a plain −1 → 1 ratio, which is what the chromatic split needs and degrees cannot give it. |
| `--px`, `--py` | Where the light lands on the film, 0 → 1. |
| `--grab` | 1 while the object is held, 0 otherwise. |

**Everything the object does without it:** stand at its resting three-quarter
angle, sway, orbit its rings, run its scan bar and breathe its emitter. All of
that is keyframes. What the module adds is the part a stylesheet cannot know —
where the pointer is, and whether somebody has taken hold.

A drag is claimed on the host and released on the window, so a pointer that
leaves the element still lets go. It never touches the vertical axis, so a drag
that turns out to be a scroll is a scroll. A press that never travelled is not
a throw: it gets one deliberate nudge instead, because a click on the object
should do something.

---

## 4c. The card

The contact page is a card and nothing around it — a real object with a front,
a back, four edges and a thickness, printed on the same warm ivory the résumé
is set on, because paper is what this site already means by *the artefact you
hand somebody*. Everything that used to be set in prose on that page is printed
on the object instead, so the page is one card, centred in the screen.

Both faces carry real content. The front is the identity: name, the four
credentials, the clinical mark struck in foil, **the email address**, the signal
across the foot, and the availability. The address is on the front because it is
what anybody came to this page for. The back is every route out of the page, as
four ordinary links.

| State | What the visitor gets |
| --- | --- |
| **With a script** | One card. It tilts under the pointer, the foil rakes across the stock, the shadow travels opposite the tilt, it rises where a hover exists, and touching it anywhere that is not a link turns it over. The button is still there, still says which way up it is, and is what a keyboard uses. |
| **No script** | Two panels, stacked, both complete and both readable. The turn control is not rendered at all — there is nothing on screen that cannot work. |
| **Reduced motion** | The same card, and the turn is instant. |

Three details decide whether it reads as an object or as two rectangles
pretending:

- **The edges.** Each of the four strips starts three pixels proud of centre
  and then folds backwards about its own outer edge, so it spans +3 to −3 and
  meets both faces exactly. Getting that order wrong is what puts a stripe
  between two flat planes.
- **The shadow.** It travels *opposite* the tilt and softens as the card lifts.
  This is the single detail that decides whether an object is floating or
  painted on.
- **The foil.** A specular band that moves against the tilt, never with it.

**The accessibility rule that shapes it:** a link that is invisible but still
focusable is worse than no link at all — it sends a keyboard visitor somewhere
they cannot see. So the face turned away is `inert`, and it leaves the tab
order with the pixels rather than lingering behind them. Focus follows the
card: turning it moves focus onto the first route on the face now facing you,
but only once the half-turn has actually shown it.

> **Contrast note.** Medical teal is 3.0:1 on ivory — enough for a rule or a
> mark, short of AA for small text. The card sets its small type in
> `--teal-ink` (`#0b6357`, 5.6:1). The tokens `--teal-ink`, `--cobalt-ink` and
> `--gold-ink` exist for exactly this: the same three colours, drawn deeper,
> for type set on paper.

---

## 4d. The atmosphere — one plane, every page, the whole viewport

The best-looking thing on this site used to be visible for about one screenful.
One OGL fragment plane rendered behind the hero of the home page and nowhere
else, and it was built, compiled and thrown away on the way to Projects —
for a visitor with a fine pointer, a viewport of at least 1000 px and a browser
reporting four gigabytes or more of memory. Which is to say: no phone, no
tablet, and no Safari at all, because Safari does not implement
`navigator.deviceMemory`.

It is now mounted on the fixed atmosphere plane the base template already puts
on **every** page. The room the site is read in is the same room from the first
scroll to the footer, and it answers to the document rather than to one section.

| Layer | What it is |
| --- | --- |
| **The aurora** | A domain-warped flow field, three octaves, drifting on its own clock. It never repeats inside a visit and never reads as a looping texture. |
| **The aperture** | A soft iris the pointer nudges, whose edge *tightens as the document is read*. |
| **The interference** | A fine signal, refracted where the field is strongest rather than sliding over it. |
| **The motes** | A sparse specular grid, brightest near the light, so the far edges of frame have something to do. |
| **The key** | A directional light the pointer leads and never follows. |

Three decisions make it usable rather than merely present:

- **It composites with `screen`.** The plane draws light on black, so under
  `screen` its black is exactly nothing and its light is added to the gradient
  wash underneath. The wash is never hidden, there is no frame where an
  un-drawn canvas covers it, and the arrival is the shader's own fade rather
  than a CSS transition the compositor has to be trusted with.
- **It is loud in one place only.** `uGain` is the level it reads at while
  somebody is *reading*; `uLift` is how much louder it is allowed to be over
  the top of a page that has a hero to justify it. The lift is spent by the
  time the hero has scrolled away, and a page that opens on a paragraph passes
  a lift of 1 and never has the loud version.
- **It renders at thirty frames a second.** Nothing on it moves fast. Half the
  frames are indistinguishable and cost exactly as much, and this is now the
  whole site's cost rather than one hero's.

The résumé is the one page set on the record surface, and the plane runs there
too — at half its voice, over a floor one stop darker than the rest of the
site. It used to be set on ivory, which made the one page a visitor is most
likely to read the one page that did not look like this site. Paper is still
where the résumé ends up; paper is what the print stylesheet makes, and the
plane has nothing to say there, so on paper it is not asked to.

### The legibility floor

Both of those numbers were originally set by eye, against headless captures.
Headless captures composite far darker than a real GPU does, and on real
hardware the result was a plane nobody could read over: body copy set in
`--text-quiet` measured **1.2:1** against the rendered composite, where the
requirement is 4.5. The interference field — 232 cycles a screen — was drawing
topographic contour lines across paragraphs at the same frequency the eye reads
at.

A gain turned down would have hidden that rather than fixed it, because three
independent things were wrong. Each has its own answer:

**The levelling.** Six accents taken from six running products spread over two
and a half times in relative luminance: `#ded7c6` and `#b9e24d` each carry about
2.5× the light of `#17a08f`. Scrolling into OWCS did not change the colour of the room, it
turned the room up. Every accent is now scaled to a single luminance before it
reaches a uniform. The scale is a ceiling and never a lift — the answer to one
room being too loud is never to turn a quiet one up — and what survives it is
the hue and the saturation, which is the whole of what an accent was for.

**The reading mask.** Nothing on the plane knew where the words were. `site.js`
now measures the **line boxes** of the text on screen and hands them to the
plane as a 48 × 27 coverage map, blurred until it has no edge. In the open the
interference keeps about a third of the amplitude it had; over that map it keeps
a twentieth, and the luminance ceiling below drops with it. Outside the map
nothing else changes at all.

It measures lines rather than elements because a block is as wide as its
container however narrow its ink is — measuring boxes would have read four short
chips at the top of a case study as full-bleed text. And it is a map rather than
a rectangle because a rectangle was not honest: at the top of the home page the
words are a column down the left, a projection stands in the empty half, and a
strip of figures crosses the bottom of the frame. The smallest box containing
all three is the whole viewport, and dimming it would have paid for the space
around the projection — never hard to read — out of the same purse as the
paragraph that was.

**The ceiling.** Three layers that each look reasonable can meet on one fragment
with nothing bounding the sum. The last thing the shader does is limit its own
luminance: a low limit where the map is lit, a generous one everywhere else. The
shoulder is exponential rather than a clamp, so a bright pass rolls off into the
limit instead of collapsing against it and the aurora keeps its gradients right
up to the edge of what it is allowed. This is the number the site can be tested
against; the gain is only an intention.

One place on the site the ceiling cannot help. At one column the projection in
the home hero moves *behind* the identity, and an object with its own light in
it does not answer to the plane — nor should it, because its brightness is the
point of it. That copy carries a soft radial ground of its own instead: a
gradient with no edge you can find, not a panel, and the object keeps every bit
of the light it had.

None of this is asserted against a token, because a token is no longer what a
visitor reads over. `tests/legibility.spec.ts` renders each page with the plane
live, blanks the glyphs, screenshots it, and computes the real WCAG ratio
between the text's own colour and the pixels actually behind it — on a teal
page, a gold page and a lime page, at 1440 × 900 and 390 × 844, at the top of
the document and halfway through it. The worst run on the site measures 5.26:1
against a 4.5 floor. If that number moves, the atmosphere got louder.

### The gates, and why they moved

Reduced motion and Save-Data are somebody telling you not to. No WebGL is the
browser telling you it cannot. A device that reports its memory and reports
less than four gigabytes is telling you it is small, and that answer is still
honoured.

**Silence is not any of those, and is no longer read as one.** What the old
gates were protecting most visitors from was two radial gradients' worth of GPU
work on one triangle — while costing them the entire atmosphere.

---

## 4e. What was removed

The redesign took things away, and the count is the point:

| Gone | Was | Now |
| --- | --- | --- |
| The hero's domain tab set | 3 radios + 3 proof panels, two thirds hidden at any moment | Nothing. Every fact is open in the credentials strip below. |
| The sound layer | A second masthead switch, an `AudioContext`, three synthesised tones and the whole subsystem behind them | Nothing. The site makes no sound and needs no control to say so. |
| Primary navigation | 6 items | **3** — Projects, Résumé, Contact. Home is the wordmark; Experience is a chapter of the résumé it sits beside; About is a page about the site's own taste rather than a destination anybody arrives looking for. Both are in the footer's Site column. |
| The footer's project column | 6 project links repeating Projects | One route to Projects; the complete map is the Site column. |
| Duplicate button rows | Two actions under the through-line, two under the contact call | One each. |
| The hero's social row | GitHub, LinkedIn, Email under the actions | The `@cvree` handle beside the location, and the footer. |
| The wordmark's tagline | `Health Science · EMT · Builder`, set in mono beside the name and hidden below 560 px anyway | The name and the dot. The three words it carried are the first line of the hero, the first line of the résumé and half the `<title>` of the home page; a masthead is not the fourth place to say them. |

Projects is one of those three, and it is a place rather than a document: it
points at `index.html#work`, the section of the home page where the six
products are already shown running. A second page that restated them, listed
the smaller repositories and then sent you back was one page too many; the
status key and the smaller pieces moved into that section, and the old URL is
kept alive as a redirect. Arriving there is composed — the page is set down a
screenful short of it and glides in, so the section is arrived at rather than
cut to — and any input at all ends the glide immediately.

A masthead is a place to go, not an index. The complete map of the site is at
the foot of every page, where a map belongs.

---

## 4f. The résumé: one record, one journey

The résumé is the page the site exists to hand somebody, and for a long time it
was the page that looked least like the site: warm ivory, a light colour scheme,
a shader switched off — a sheet of paper photographed and hung in a dark room.
The vibe did not survive the click.

It is now set on **the record**: the same ink, the same atmosphere plane, the
same ECG across the top, with the floor one stop darker (`--ink-deep`), the
plane at 42 % and the grain at a tenth. Nothing about the language changes. The
light is turned down, the way a room is dimmed for something that is going to be
read rather than looked at.

**The journey.** Experience and education used to be two lists, each in its own
order, and a reader had to interleave them to answer the only question either
of them is asked: what happened, and in what order. They are now one spine, read
top to bottom, newest first:

- **Study on one side of the line, work on the other**, so the kind of an entry
  is legible before a word of it is. The icon on the node says it a second time,
  the word is written in the card for anybody served by neither, and the key
  above the timeline states it once in plain language.
- **Boxes mirror; text does not.** A card left of the spine is still read from
  its left edge. Right-ragged copy with the bullets hanging off the far side is
  a picture of symmetry paid for in legibility.
- **Four entries carry a relative date** — *Certified*, *Graduated*, *Earlier*,
  *Prior* — because a month is not on the record for them. They are placed where
  they belong in the order and labelled with what is actually known. Guessing the
  position of an undated entry is editing; printing a month nobody has is a
  claim.
- **On paper the spine is deleted.** A page shows an order by being a page, so
  print gets the same entries, in the same order, as one plain list: no line, no
  nodes, no alternation, and the kind written out where the mark was.

**The software is not on it.** Six shipped products with their own case studies
were two of the résumé's five pages, and a reader who wants them is one line and
one URL away. The résumé names them once, in the summary, and points at the
site. What is left is the document a healthcare employer actually reads —
experience, education, certifications, research, skills — on two pages.

---

## 5. Projects: six living specimens

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
- The projection stands **behind the name and out past the right edge of it**
  at ~80 vw, where the section's own overflow clip cuts it — as the field the
  identity is lit by rather than as an illustration beside it. It is at 58 %
  opacity and `pointer-events: none`: still the object, still moving, and never
  competing with a word or with the scroll.
- With no pointer to turn it, the **scroll** turns it instead.
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
| `assets/vendor/pulse.js` — the pulse layer, every page, no dependency | motion allowed, not Save-Data | **0.9 KB gzip** |
| `assets/vendor/holo.js` — the hologram driver, home page, no dependency | the same two | **1.1 KB gzip** |
| `assets/vendor/atmosphere.js` — one OGL shader plane, every page | the same two, plus WebGL, and not a device that reports under 4 GB | **16.5 KB gzip** |

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
The project rooms are built on native sticky positioning. The browser's own
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

**Nothing on this site makes a sound.** There was a sound layer here — three
synthesised tones behind a masthead switch, correct in every detail, autoplaying
nothing — and it is gone. It was a control that existed to make a promise about
a feature nobody asked for, and the honest version of that promise is not
having the feature. The masthead now carries one switch, and it is the one that
stops every continuous movement on the site.

---

## 9. What every state has to hold

| State | What the visitor gets |
| --- | --- |
| **No JavaScript** | The projection standing, swaying, orbiting and scanning — all of that is keyframes. Six ordinary articles with six ordinary links. Every scene its composed final frame. No control on screen that cannot work. |
| **`prefers-reduced-motion: reduce`** | The same composition, still. Every layer of the object is on it at its resting three-quarter angle; only the movement goes. No canvas, no start states — because none of them is ever applied. |
| **The site's motion control** | Identical to the above, and remembered. It can only ever make the site *stiller* than the operating system asked for. |
| **Save-Data** | Native scrolling, no module requested at all, and the whole hero still standing. |
| **Coarse pointer** | The scroll turns the object instead of the pointer. Every target ≥ 44 px. Nothing anywhere depends on hovering, and nothing is draggable out from under the scroll. The trace still answers the scroll, which is the part of the pulse layer that matters most on a phone. |
| **Keyboard** | Nothing in the hero to operate, because there is nothing in it to reach. Every route is an ordinary link; focus indication at least as clear as hover. |

**No fact exists only in an enhanced state, because no fact is in the hero's
object at all.** The projection says nothing. Everything about Connor is in the
copy beside it and in the strip below it, open, at first paint, with nothing to
press.
