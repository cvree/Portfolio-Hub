# Third-party code in this repository

Everything in `assets/vendor/` is generated. It is committed rather than built
at deploy time because the deployed site is static and self-contained — there is
no CDN in the critical path, no import map, and no network dependency at
runtime. Rebuild with:

```bash
node tools/build_vendor.mjs          # write
node tools/build_vendor.mjs --check  # CI: fail if the committed output drifted
```

No bundle here is in the critical path. `site.js` imports them dynamically,
after first paint, and only when the device, the motion preference, Save-Data
and the pointer type all pass. Neither is ever required for a page to be
complete: the hero's arrival, the projected mark it is built around, the six
Projects scenes and every control on the site are CSS, markup and the
critical `site.js` — none of which is behind a lazy request.

| Package | Version | Source | License | Bundle | Raw | Gzip |
| --- | --- | --- | --- | --- | --- | --- |
| `—` | — | this repository | MIT (this repository) | `assets/vendor/pulse.js` | 2.0 KB | 0.9 KB |
| `—` | — | this repository | MIT (this repository) | `assets/vendor/console.js` | 8.8 KB | 3.6 KB |
| `—` | — | this repository | MIT (this repository) | `assets/vendor/holo.js` | 2.8 KB | 1.1 KB |
| `ogl` | 1.0.11 | https://github.com/oframe/ogl | Unlicense | `assets/vendor/atmosphere.js` | 62.2 KB | 19.5 KB |

Total lazy payload: **25.2 KB gzip**, against a
budget of 100 KB. None of it is requested until after the useful site has
rendered, and the shader additionally requires WebGL and a device that does not
report under 4 GB of memory — a browser that declines to report at all is not
read as a small device.

## Why each one is here

### `assets/vendor/pulse.js` — no dependency

The pulse layer, on every page. It has no dependency at all — it is here because it is main-thread work the critical path must not carry, not because it needed a library. Everything the site says is CSS and markup that has painted before this file is requested; what is left for a script is the handful of things CSS cannot know — where the pointer is, how hard somebody is scrolling, and when they have taken hold of the sculpture. It writes four custom properties onto <html> and gets out of the way. It is bundled and committed through the same path as the shader so that exactly one mechanism puts JavaScript on this site.

### `assets/vendor/console.js` — no dependency

The console — the field that opens on ⌘K and searches every page, product and section on this site. It has no dependency: the index it reads is written by tools/build_pages.py out of the pages themselves, and the combobox, the scoring and the key handling are this file. It is here rather than in the critical path because nothing on this site waits on it — it is imported the first time somebody reaches for it, and every place it can travel to is an ordinary URL that works with this bundle absent.

### `assets/vendor/holo.js` — no dependency

The driver behind the projected mark in the hero. It has no dependency either: the hologram is eighteen CSS depth slices of one path, and it stands, drifts and reads with this file absent. What the module adds is the part a stylesheet cannot know — where the pointer is and whether somebody has taken hold of the object — which it writes onto the host as five custom properties before getting out of the way.

### `ogl` 1.0.11 — Unlicense

One full-screen triangle and one fragment shader, on the fixed atmosphere plane every page already carries. OGL supplies the WebGL context, program compilation and resize plumbing in a few kilobytes and tree-shakes down to the four classes actually imported. Three.js was measured against it and rejected: it is an order of magnitude larger for a plane that draws no geometry.

### `esbuild` 0.28.2 — MIT

Build-time only. It tree-shakes and minifies the modules above into the
committed bundles. Nothing from esbuild reaches a browser.

Source: https://github.com/evanw/esbuild

## Not used, deliberately

`gsap`, `lenis`, `three`, Rive, Spline, React, Vue and any client-side
router are absent by design.

GSAP was in this repository until the redesign and was removed by it. It earned
its 44.8 KB gzip when the hero was a pinned, scrubbed ScrollTrigger timeline
that had to stay in step with the scroll position across five elements. The
hero is no longer a scrubbed timeline: every motion in the current design is a
finite transition that plays once and settles, which is precisely what CSS
keyframes express — off the main thread, at no scripting cost, and with the
composed final frame as the state that renders when motion is refused. Keeping
an animation engine to re-implement that would have been two engines doing one
job, and 44.8 KB of it.

`lenis` was considered and declined for the same reason. With no shared GSAP
ticker left to synchronise against it would have been this site's only runtime
dependency a visitor could feel go wrong, and all six Projects rooms are
built on native sticky positioning — the browser's own scrolling is not a
detail of this design, it is the mechanism.

## Fonts

The four typefaces in `assets/fonts/` — Instrument Serif, Newsreader, Space
Grotesk and IBM Plex Mono — are licensed under the SIL Open Font License 1.1 and
are self-hosted as latin subsets. No font CDN is contacted.
