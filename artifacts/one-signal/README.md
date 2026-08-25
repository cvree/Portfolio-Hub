# ONE SIGNAL — evidence

Baseline SHA: `999adaa` (`main`, the site this redesign replaces). Everything
here was captured from the committed HTML by the same scripts, at the same
viewports and the same scroll positions, before and after.

```bash
python3 -m http.server 8123 --bind 127.0.0.1        # the after tree
node tools/shots.mjs   artifacts/one-signal/after
node tools/domains.mjs artifacts/one-signal/states
node tools/pack_evidence.mjs artifacts/one-signal/* # 2x PNG -> WebP
```

## Contents

| Folder | What is in it |
| --- | --- |
| `before/` | `999adaa` — the Evidence Aperture, before any change |
| `after/` | this branch |
| `states/` | the three hero domains and all six rooms, desktop and mobile |

Each set covers 1440×900, 1920×1080, 390×844 and 844×390 (landscape phone), and
the fold plus the full page for every one of them — with normal motion,
`prefers-reduced-motion: reduce`, no JavaScript and Save-Data.

## The blank-artifact problem, and the fix

The previous artifact workflow stepped a viewport per animation frame and waited
900 ms at the end. That outruns the observer that reveals each section *and* the
scene each section then plays, so full-page frames could land in the repository
with grey rectangles in them where the evidence was supposed to be.

`tools/shots.mjs` now stops at each screen, waits 650 ms for the entrance to
finish, and then asserts before capturing:

```js
const unrevealed = await page.$$eval(
  'main [data-rise], main [data-motion], main [data-scene]',
  (els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99).length
);
if (unrevealed) console.warn(`!! ${s.name}: ${unrevealed} section(s) still unrevealed`);
```

No frame in this set was captured with that warning outstanding.

## What to look at first

| Frame | Why |
| --- | --- |
| `before/home-desktop` → `after/home-desktop` | a cropped Order of Draw screenshot becomes a bespoke CE monogram struck together by the page's own QRS |
| `before/home-mobile` → `after/home-mobile` | the phone stops being a compressed desktop and gets an identity-first composition, with the sculpture as a field behind the name |
| `after/home-desktop-nojs` | all three proof groups open, the sculpture assembled, no control on screen that cannot work |
| `after/home-desktop-reduced` | the composed final frame, with nothing stripped out to get there |
| `states/room-phlebotomy-desktop` | six real CLSI tube cards resolved into the graded capture — the Order of Draw, in the one place it belongs |
| `states/hero-arrival-mid` | ~520 ms in: the sample head mid-flight, the planes still coming together, every word already readable |
