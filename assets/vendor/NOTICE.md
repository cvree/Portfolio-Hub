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
after first paint. The two cinematic ones load only when the page asks for them
and the device, the motion preference, Save-Data and the pointer type all pass.
`channel.js` is a control rather than an effect, so its only gate is
Save-Data — it runs on a phone, on a keyboard and under reduced motion, because
withholding a control is not the same as withholding an effect.

| Package | Version | Source | License | Bundle | Raw | Gzip |
| --- | --- | --- | --- | --- | --- | --- |
| `—` | — | this repository | MIT (this repository) | `assets/vendor/channel.js` | 6.6 KB | 2.5 KB |
| `gsap` | 3.15.0 | https://github.com/greensock/GSAP | GreenSock Standard 'No Charge' License | `assets/vendor/aperture.js` | 113.6 KB | 44.8 KB |
| `ogl` | 1.0.11 | https://github.com/oframe/ogl | Unlicense | `assets/vendor/atmosphere.js` | 49.5 KB | 15.1 KB |

Total lazy cinematic payload: **60.0 KB gzip**
(`aperture.js` + `atmosphere.js`, against a budget of 100 KB). The control
module is counted separately, at **2.5 KB gzip**, because it is not a
cinematic effect and does not answer to the cinematic gates. None of it is
requested until after the useful site has rendered.

## Why each one is here

### `assets/vendor/channel.js` — no dependency

The home page's channel selector. It has no dependency at all — it is here because it is main-thread work that the critical path must not carry, not because it needed a library. It is bundled and committed through the same path as the other two so that exactly one mechanism puts JavaScript on this site.

### `gsap` 3.15.0 — GreenSock Standard 'No Charge' License

The Evidence Aperture is a single pinned, scrubbed timeline that has to stay in step with the scroll position across five separate elements, be torn down completely when the viewport or the motion preference stops qualifying, and re-measure on resize. ScrollTrigger.matchMedia does exactly that; a hand-rolled equivalent would be larger and worse.

### `ogl` 1.0.11 — Unlicense

One full-screen triangle and one fragment shader behind the home hero. OGL supplies the WebGL context, program compilation and resize plumbing in a few kilobytes and tree-shakes down to the four classes actually imported. Three.js was measured against it and rejected: it is an order of magnitude larger for a plane that draws no geometry.

### `esbuild` 0.28.2 — MIT

Build-time only. It tree-shakes and minifies the modules above into the
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
