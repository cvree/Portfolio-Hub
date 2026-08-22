/* ===========================================================================
   Responsive derivatives for the screenshots that are actually laid out small
   ---------------------------------------------------------------------------
   The originals in assets/projects/ are the record and are never touched. This
   writes narrower WebP siblings beside them, so a 390 px phone is not handed a
   2400 px capture. Only widths *below* the original are written, and a
   derivative is kept only if it is genuinely smaller than the source.

     node tools/build_images.mjs
   =========================================================================== */

import sharp from 'sharp';
import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'assets', 'projects');
const WIDTHS = [720, 1280];

const originals = [];
for (const project of readdirSync(DIR)) {
  const pdir = path.join(DIR, project);
  if (!statSync(pdir).isDirectory()) continue;
  for (const f of readdirSync(pdir)) {
    if (!f.endsWith('.webp')) continue;
    if (/-(\d+)\.webp$/.test(f)) continue; // already a derivative
    originals.push(path.join(pdir, f));
  }
}

let saved = 0;
for (const src of originals.sort()) {
  const meta = await sharp(src).metadata();
  const srcBytes = statSync(src).size;
  for (const w of WIDTHS) {
    if (meta.width <= w) continue;
    const out = src.replace(/\.webp$/, `-${w}.webp`);
    await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toFile(out);
    const bytes = statSync(out).size;
    if (bytes >= srcBytes) {
      unlinkSync(out);
      console.log(`skip  ${path.relative(ROOT, out)} (no saving)`);
      continue;
    }
    saved += srcBytes - bytes;
    console.log(
      `write ${path.relative(ROOT, out).padEnd(64)} ${String(w).padStart(4)}w  ` +
        `${(bytes / 1024).toFixed(1)} KB  (source ${(srcBytes / 1024).toFixed(1)} KB)`
    );
  }
}
console.log(`\n${originals.length} originals preserved; derivatives written.`);
