/* ===========================================================================
   Deterministic vendor build
   ---------------------------------------------------------------------------
   The deployed site is static and self-contained: no CDN, no import map, no
   network dependency of any kind at runtime. So the three lazy modules are
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
    entry: 'assets/src/pulse.js',
    file: 'pulse.js',
    packages: [],
    why:
      'The pulse layer, on every page. It has no dependency at all — it is ' +
      'here because it is main-thread work the critical path must not carry, ' +
      'not because it needed a library. Everything the site says is CSS and ' +
      'markup that has painted before this file is requested; what is left for ' +
      'a script is the handful of things CSS cannot know — where the pointer ' +
      'is, how hard somebody is scrolling, and when they have taken hold of ' +
      'the sculpture. It writes four custom properties onto <html> and gets ' +
      'out of the way. It is bundled and committed through the same path as ' +
      'the shader so that exactly one mechanism puts JavaScript on this site.',
  },
  {
    entry: 'assets/src/atmosphere.js',
    file: 'atmosphere.js',
    packages: ['ogl'],
    why:
      'One full-screen triangle and one fragment shader behind the hero. OGL ' +
      'supplies the WebGL context, program compilation and resize plumbing in ' +
      'a few kilobytes and tree-shakes down to the four classes actually ' +
      'imported. Three.js was measured against it and rejected: it is an order ' +
      'of magnitude larger for a plane that draws no geometry.',
  },
];

const LICENSES = {
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
  if (!t.packages.length) {
    rows.push({
      pkg: '—',
      version: '—',
      repo: 'this repository',
      license: 'MIT (this repository)',
      file: t.file,
      raw,
      gz,
      why: t.why,
    });
  }
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

No bundle here is in the critical path. \`site.js\` imports them dynamically,
after first paint, and only when the device, the motion preference, Save-Data
and the pointer type all pass. Neither is ever required for a page to be
complete: the hero's arrival, its three domain states, the six Selected Work
scenes and every control on the site are CSS, markup and the critical
\`site.js\` — none of which is behind a lazy request.

| Package | Version | Source | License | Bundle | Raw | Gzip |
| --- | --- | --- | --- | --- | --- | --- |
${rows.map((r) => `| \`${r.pkg}\` | ${r.version} | ${r.repo} | ${r.license} | \`assets/vendor/${r.file}\` | ${(r.raw / 1024).toFixed(1)} KB | ${(r.gz / 1024).toFixed(1)} KB |`).join('\n')}

Total lazy payload: **${(rows.reduce((a, r) => a + r.gz, 0) / 1024).toFixed(1)} KB gzip**, against a
budget of 100 KB. None of it is requested until after the useful site has
rendered, and the shader additionally requires WebGL, a fine pointer, a
viewport of at least 1000 px and at least 4 GB of reported memory.

## Why each one is here

${rows.map((r) => `### ${r.pkg === '—' ? `\`assets/vendor/${r.file}\` — no dependency` : `\`${r.pkg}\` ${r.version} — ${r.license}`}\n\n${r.why}\n`).join('\n')}
### \`esbuild\` ${esb.version} — MIT

Build-time only. It tree-shakes and minifies the modules above into the
committed bundles. Nothing from esbuild reaches a browser.

Source: ${LICENSES.esbuild.repo}

## Not used, deliberately

\`gsap\`, \`lenis\`, \`three\`, Rive, Spline, React, Vue and any client-side
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

\`lenis\` was considered and declined for the same reason. With no shared GSAP
ticker left to synchronise against it would have been this site's only runtime
dependency a visitor could feel go wrong, and all six Selected Work rooms are
built on native sticky positioning — the browser's own scrolling is not a
detail of this design, it is the mechanism.

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
