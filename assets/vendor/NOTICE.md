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
complete: the hero's arrival, its three domain states, the six Selected Work
scenes and every control on the site are CSS, markup and the critical
`site.js` — none of which is behind a lazy request.

| Package | Version | Source | License | Bundle | Raw | Gzip |
| --- | --- | --- | --- | --- | --- | --- |
| `—` | — | this repository | MIT (this repository) | `assets/vendor/signal.js` | 1.2 KB | 0.5 KB |
| `ogl` | 1.0.11 | https://github.com/oframe/ogl | Unlicense | `assets/vendor/atmosphere.js` | 49.5 KB | 15.1 KB |

Total lazy payload: **15.7 KB gzip**, against a
budget of 100 KB. None of it is requested until after the useful site has
rendered, and the shader additionally requires WebGL, a fine pointer, a
viewport of at least 1000 px and at least 4 GB of reported memory.

## Why each one is here

### `assets/vendor/signal.js` — no dependency

The hero's pointer layer. It has no dependency at all — it is here because it is main-thread work the critical path must not carry, not because it needed a library. Everything the hero actually does is CSS and markup that has painted before this file is requested; what is left for a script is the one thing CSS cannot do, which is read where the pointer is. It is bundled and committed through the same path as the shader so that exactly one mechanism puts JavaScript on this site.

### `ogl` 1.0.11 — Unlicense

One full-screen triangle and one fragment shader behind the hero. OGL supplies the WebGL context, program compilation and resize plumbing in a few kilobytes and tree-shakes down to the four classes actually imported. Three.js was measured against it and rejected: it is an order of magnitude larger for a plane that draws no geometry.

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
dependency a visitor could feel go wrong, and all six Selected Work rooms are
built on native sticky positioning — the browser's own scrolling is not a
detail of this design, it is the mechanism.

## Fonts

The four typefaces in `assets/fonts/` — Instrument Serif, Newsreader, Space
Grotesk and IBM Plex Mono — are licensed under the SIL Open Font License 1.1 and
are self-hosted as latin subsets. No font CDN is contacted.
