# The instrument — evidence

Baseline SHA: `7cab138` (`main` + the brief). Everything here was captured from
the committed HTML by the same scripts, at the same viewports and the same
scroll positions, before and after.

```
node tools/shots.mjs    artifacts/instrument/<set>   # the matched set
node tools/channels.mjs artifacts/instrument/channels # one shot per channel
node tools/pack_evidence.mjs artifacts/instrument/*   # 2× PNG -> WebP
```

## Contents

| Folder | What is in it |
| --- | --- |
| `baseline/` | `7cab138`, before any change |
| `final/` | the pushed branch |
| `channels/` | all six compositions, desktop and mobile |
| `rails/` | the six pulses, one per product, side by side |

Matched pairs to compare, in `baseline/` and `final/`:
`home-desktop`, `home-mobile`, `home-desktop-full`, `home-mobile-full`,
`home-desktop-reduced`, `home-mobile-reduced`, `home-desktop-nojs`,
`home-mobile-nojs`, plus `case-*`, `work-desktop`, `resume-desktop` and
`resume.pdf` to show the other eleven pages did not move.
`final/home-landscape` is the 844×390 pass, which has no baseline because the
composition did not previously exist.

## The pulse

`rails/` holds one capture of each product's waveform, at the same width and
the same moment: SpellBomb's fuse climbing and dropping, Health Journal's slow
circadian rise, the clinical trace's three PQRST complexes, Manifester's
breath, OWCS's square-wave swap timeline, PaperAnimator's single crease. Six
rhythms, six accents, one instrument.

## The three states, and why each looks deliberate

**No JavaScript** (`home-desktop-nojs`, `home-mobile-nojs`). The pulse is on
its rail and complete — the trace is markup and the graticule is CSS, so the
monitor is drawn whether or not anything runs. The channel strip
is six ordinary links to six case studies, one of them marked as the position
the page is composed on; the read-out under it states that product's real
numbers; the aperture holds the full screenshot with no blades over it and no
hotspots on it. Nothing is dimmed, collapsed or waiting. It is the same
composition the scripted page lands on, minus the things a script would have
had to run for — which is why it reads as a finished frame rather than a broken
widget.

**Reduced motion** (`home-desktop-reduced`, `home-mobile-reduced`). Identical
composition to the scripted page, including the wired strip, the hotspots and
the read-out: the selector still selects and the whole page still retunes, it
just arrives instantly. No shader, no blades, no counting, and the pulse holds
one complete, finished trace with nothing moving on it — brighter than the
animated version, because a still monitor has to carry its presence in one
frame. Nothing is withheld; only the travel is gone.

**Landscape** (`home-landscape`, 844×390). Two columns come back, the name is
set to the height rather than the width, and the instrument is still on the
first screen. A phone held sideways gets a composition, not a squashed column.
