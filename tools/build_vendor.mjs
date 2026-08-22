/* ===========================================================================
   Deterministic vendor build
   ---------------------------------------------------------------------------
   The deployed site is static and self-contained: no CDN, no import map, no
   network dependency of any kind at runtime. So the two cinematic modules are
   bundled here, at author time, from pinned packages in node_modules, and the
   *output* is committed. esbuild never runs on a visitor's request.

     node tools/build_vendor.mjs           # write assets/vendor/*
     node tools/build_vendor.mjs --check   # fail if the committed output drifts

   --check is what CI runs, so a bumped dependency that nobody rebuilt cannot
   reach the site.
   =========================================================================== */

import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'vendor');
const check = process.argv.includes('--check');

const TARGETS = [
  {
    entry: 'assets/src/aperture.js',
    file: 'aperture.js',
    packages: ['gsap'],
    why:
      'The Evidence Aperture is a single pinned, scrubbed timeline that has to ' +
      'stay in step with the scroll position across five separate elements, be ' +
      'torn down completely when the viewport or the motion preference stops ' +
      'qualifying, and re-measure on resize. ScrollTrigger.matchMedia does ' +
      'exactly that; a hand-rolled equivalent would be larger and worse.',
  },
  {
    entry: 'assets/src/atmosphere.js',
    file: 'atmosphere.js',
    packages: ['ogl'],
    why:
      'One full-screen triangle and one fragment shader behind the home hero. ' +
      'OGL supplies the WebGL context, program compilation and resize plumbing ' +
      'in a few kilobytes and tree-shakes down to the four classes actually ' +
      'imported. Three.js was measured against it and rejected: it is an order ' +
      'of magnitude larger for a plane that draws no geometry.',
  },
];

const LICENSES = {
  gsap: { repo: 'https://github.com/greensock/GSAP', license: "GreenSock Standard 'No Charge' License" },
  ogl: { repo: 'https://github.com/oframe/ogl', license: 'Unlicense' },
  esbuild: { repo: 'https://github.com/evanw/esbuild', license: 'MIT' },
};

mkdirSync(OUT, { recursive: true });

const rows = [];
let drift = false;

for (const t of TARGETS) {
  const res = await build({
    entryPoints: [path.join(ROOT, t.entry)],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    treeShaking: true,
    legalComments: 'none',
    sourcemap: false,
    write: false,
    absWorkingDir: ROOT,
    define: { 'process.env.NODE_ENV': '"production"' },
  });

  const code = res.outputFiles[0].text;
  const dest = path.join(OUT, t.file);

  if (check) {
    const have = existsSync(dest) ? readFileSync(dest, 'utf8') : '';
    if (have !== code) {
      console.error(`vendor drift: assets/vendor/${t.file} is not what its sources produce`);
      drift = true;
    }
  } else {
    writeFileSync(dest, code, 'utf8');
  }

  const raw = Buffer.byteLength(code);
  const gz = gzipSync(Buffer.from(code), { level: 9 }).length;
  for (const pkg of t.packages) {
    const meta = JSON.parse(readFileSync(path.join(ROOT, 'node_modules', pkg, 'package.json'), 'utf8'));
    rows.push({ pkg, version: meta.version, file: t.file, raw, gz, why: t.why, ...LICENSES[pkg] });
  }
  console.log(`${check ? 'checked' : 'wrote'} assets/vendor/${t.file}  ${(raw / 1024).toFixed(1)} KB raw · ${(gz / 1024).toFixed(1)} KB gzip`);
}

/* --- the notice ---------------------------------------------------------- */

const esb = JSON.parse(readFileSync(path.join(ROOT, 'node_modules', 'esbuild', 'package.json'), 'utf8'));
const notice = `# Third-party code in this repository

Everything in \`assets/vendor/\` is generated. It is committed rather than built
at deploy time because the deployed site is static and self-contained — there is
no CDN in the critical path, no import map, and no network dependency at
runtime. Rebuild with:

\`\`\`bash
node tools/build_vendor.mjs          # write
node tools/build_vendor.mjs --check  # CI: fail if the committed output drifted
\`\`\`

Neither bundle is in the critical path. \`site.js\` imports them dynamically,
after first paint, and only when the page asks for them and the device, the
motion preference, Save-Data and the pointer type all pass.

| Package | Version | Source | License | Bundle | Raw | Gzip |
| --- | --- | --- | --- | --- | --- | --- |
${rows.map((r) => `| \`${r.pkg}\` | ${r.version} | ${r.repo} | ${r.license} | \`assets/vendor/${r.file}\` | ${(r.raw / 1024).toFixed(1)} KB | ${(r.gz / 1024).toFixed(1)} KB |`).join('\n')}

Total lazy cinematic payload: **${(rows.reduce((a, r) => a + r.gz, 0) / 1024).toFixed(1)} KB gzip**, none of it
requested until after the useful site has rendered.

## Why each one is here

${rows.map((r) => `### \`${r.pkg}\` ${r.version} — ${r.license}\n\n${r.why}\n`).join('\n')}
### \`esbuild\` ${esb.version} — MIT

Build-time only. It tree-shakes and minifies the two modules above into the
committed bundles. Nothing from esbuild reaches a browser.

Source: ${LICENSES.esbuild.repo}

## Not used, deliberately

\`lenis\`, \`three\`, Rive, Spline, React, Vue and any client-side router are
absent by design. Native scrolling is part of this site's identity, and OGL
draws the one shader plane the hero needs without a scene graph.

## Fonts

The four typefaces in \`assets/fonts/\` — Instrument Serif, Newsreader, Space
Grotesk and IBM Plex Mono — are licensed under the SIL Open Font License 1.1 and
are self-hosted as latin subsets. No font CDN is contacted.
`;

const noticePath = path.join(OUT, 'NOTICE.md');
if (check) {
  const have = existsSync(noticePath) ? readFileSync(noticePath, 'utf8') : '';
  if (have !== notice) {
    console.error('vendor drift: assets/vendor/NOTICE.md is not what its sources produce');
    drift = true;
  }
} else {
  writeFileSync(noticePath, notice, 'utf8');
  console.log('wrote assets/vendor/NOTICE.md');
}

if (check) {
  if (drift) {
    console.error('run: node tools/build_vendor.mjs');
    process.exit(1);
  }
  console.log('vendor bundles are up to date');
}
