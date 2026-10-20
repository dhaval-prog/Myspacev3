// After `expo export`, writes dist/sw.js: the build id (so each deploy gets a fresh code cache) and
// the files the first screen needs (scripts and styles from index.html, the launch images, and the
// preloaded fonts), which the service worker saves on install.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const files = new Set();
for (const m of html.matchAll(/<(?:script[^>]*src|link[^>]*href|img[^>]*src)="(\/[^"]+)"/g)) {
  if (!m[1].endsWith('.json')) files.add(m[1]);
}
const build = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 12);
const sw = readFileSync('scripts/sw.js', 'utf8')
  .replace('__BUILD_ID__', build)
  .replace('__PRECACHE__', JSON.stringify([...files], null, 2));
writeFileSync('dist/sw.js', sw);
console.log(`sw.js: build ${build}, ${files.size} files precached`);
