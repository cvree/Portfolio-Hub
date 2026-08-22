/* Median of the runs LHCI just wrote, in a table you can put beside another. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const label = process.argv[3] || dir;
const byUrl = new Map();

for (const f of readdirSync(dir)) {
  if (!f.endsWith('.json') || f === 'manifest.json' || f === 'assertion-results.json') continue;
  const r = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
  if (!r.categories) continue;
  const url = new URL(r.finalDisplayedUrl || r.finalUrl).pathname;
  const row = {
    perf: Math.round(r.categories.performance.score * 100),
    a11y: Math.round(r.categories.accessibility.score * 100),
    bp: Math.round(r.categories['best-practices'].score * 100),
    seo: Math.round(r.categories.seo.score * 100),
    lcp: r.audits['largest-contentful-paint'].numericValue,
    cls: r.audits['cumulative-layout-shift'].numericValue,
    tbt: r.audits['total-blocking-time'].numericValue,
    fcp: r.audits['first-contentful-paint'].numericValue,
    bytes: r.audits['total-byte-weight'] ? r.audits['total-byte-weight'].numericValue : 0,
  };
  if (!byUrl.has(url)) byUrl.set(url, []);
  byUrl.get(url).push(row);
}

const med = (xs) => xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)];

console.log(`\n### ${label}\n`);
console.log('| Page | Perf | A11y | BP | SEO | LCP | CLS | TBT | FCP | Transfer |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const [url, rows] of [...byUrl].sort()) {
  const p = (k) => med(rows.map((r) => r[k]));
  console.log(
    `| \`${url}\` | ${p('perf')} | ${p('a11y')} | ${p('bp')} | ${p('seo')} | ` +
      `${(p('lcp') / 1000).toFixed(2)} s | ${p('cls').toFixed(3)} | ${Math.round(p('tbt'))} ms | ` +
      `${(p('fcp') / 1000).toFixed(2)} s | ${(p('bytes') / 1024).toFixed(0)} KB |`
  );
}
console.log(`\n_Median of ${[...byUrl.values()][0].length} runs per page. Laboratory measurements, not field data._`);
