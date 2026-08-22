/* Shrink the captured evidence so the comparison can live in the repository.
   Same frames, same crops — WebP instead of 2× PNG. */
import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const dirs = process.argv.slice(2);
for (const dir of dirs) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.png')) continue;
    const src = path.join(dir, f);
    const out = src.replace(/\.png$/, '.webp');
    const meta = await sharp(src).metadata();
    // Captured at devicePixelRatio 2; one CSS pixel per image pixel is plenty
    // to compare two frames side by side, and full-page shots are capped.
    const width = Math.min(Math.round(meta.width / 2), f.includes('-full') ? 900 : 1440);
    await sharp(src).resize({ width }).webp({ quality: 76, effort: 5 }).toFile(out);
    unlinkSync(src);
    console.log(`${path.relative('.', out)}  ${(statSync(out).size / 1024).toFixed(0)} KB`);
  }
}
