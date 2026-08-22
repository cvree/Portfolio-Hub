# Third-party code in this repository

Everything in `assets/vendor/` is generated. It is committed rather than built
at deploy time because the deployed site is static and self-contained — there is
no CDN in the critical path, no import map, and no network dependency at
runtime. Rebuild with:

```bash
node tools/build_vendor.mjs          # write
node tools/build_vendor.mjs --check  # CI: fail if the committed output drifted
```

Neither bundle is in the critical path. `site.js` imports them dynamically,
after first paint, and only when the page asks for them and the device, the
motion preference, Save-Data and the pointer type all pass.

| Package | Version | Source | License | Bundle | Raw | Gzip |
| --- | --- | --- | --- | --- | --- | --- |
| `gsap` | 3.15.0 | https://github.com/greensock/GSAP | GreenSock Standard 'No Charge' License | `assets/vendor/aperture.js` | 113.9 KB | 44.9 KB |
| `ogl` | 1.0.11 | https://github.com/oframe/ogl | Unlicense | `assets/vendor/atmosphere.js` | 48.9 KB | 15.0 KB |

Total lazy cinematic payload: **59.9 KB gzip**, none of it
requested until after the useful site has rendered.

## Why each one is here

### `gsap` 3.15.0 — GreenSock Standard 'No Charge' License

The Evidence Aperture is a single pinned, scrubbed timeline that has to stay in step with the scroll position across five separate elements, be torn down completely when the viewport or the motion preference stops qualifying, and re-measure on resize. ScrollTrigger.matchMedia does exactly that; a hand-rolled equivalent would be larger and worse.

### `ogl` 1.0.11 — Unlicense

One full-screen triangle and one fragment shader behind the home hero. OGL supplies the WebGL context, program compilation and resize plumbing in a few kilobytes and tree-shakes down to the four classes actually imported. Three.js was measured against it and rejected: it is an order of magnitude larger for a plane that draws no geometry.

### `esbuild` 0.28.2 — MIT

Build-time only. It tree-shakes and minifies the two modules above into the
committed bundles. Nothing from esbuild reaches a browser.

Source: https://github.com/evanw/esbuild

## Not used, deliberately

`lenis`, `three`, Rive, Spline, React, Vue and any client-side router are
absent by design. Native scrolling is part of this site's identity, and OGL
draws the one shader plane the hero needs without a scene graph.

## Fonts

The four typefaces in `assets/fonts/` — Instrument Serif, Newsreader, Space
Grotesk and IBM Plex Mono — are licensed under the SIL Open Font License 1.1 and
are self-hosted as latin subsets. No font CDN is contacted.
