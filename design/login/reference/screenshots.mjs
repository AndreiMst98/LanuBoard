// Captures the visual targets for the LanuBoard login.
//
//   node design/login/reference/screenshots.mjs                      -> references -> design/login/screenshots/
//   node design/login/reference/screenshots.mjs <outDir> <loginUrl>  -> your implementation, same shots
//
// <loginUrl> is the implemented /login page (e.g. http://localhost:3000/login). It must accept the same
// ?lang= and ?state= query params as the references (dev/test builds only), so every shot is comparable.
// Shots are taken with prefers-reduced-motion: reduce, i.e. the final, settled frame of every animation.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2] ?? join(here, '..', 'screenshots'));
const impl = process.argv[3];

const shots = [
  // name, url, width, height
  ['desktop-1440x900-ro', 'desktop.html', 1440, 900, ''],
  ['desktop-1440x900-de', 'desktop.html', 1440, 900, '?lang=de'],
  ['desktop-1440x900-en', 'desktop.html', 1440, 900, '?lang=en'],
  ['desktop-1440x900-error-ro', 'desktop.html', 1440, 900, '?state=error'],
  ['desktop-1440x900-error-de', 'desktop.html', 1440, 900, '?state=error&lang=de'],
  ['desktop-1440x900-network-en', 'desktop.html', 1440, 900, '?state=network&lang=en'],
  ['desktop-1440x900-loading-ro', 'desktop.html', 1440, 900, '?state=loading'],
  ['desktop-1440x900-success-ro', 'desktop.html', 1440, 900, '?state=success'],
  ['desktop-1280x800-ro', 'desktop.html', 1280, 800, ''],
  ['desktop-1024x768-ro', 'desktop.html', 1024, 768, ''],
  ['mobile-390x844-ro', 'mobile.html', 390, 844, ''],
  ['mobile-390x844-de', 'mobile.html', 390, 844, '?lang=de'],
  ['mobile-390x844-en', 'mobile.html', 390, 844, '?lang=en'],
  ['mobile-390x844-error-de', 'mobile.html', 390, 844, '?state=error&lang=de'],
  ['mobile-390x844-success-ro', 'mobile.html', 390, 844, '?state=success'],
  ['mobile-375x667-ro', 'mobile.html', 375, 667, ''],
  ['mobile-768x1024-ro', 'mobile.html', 768, 1024, ''],
];

mkdirSync(outDir, { recursive: true });
const server = impl ? null : await serve();
const base = server ? `http://127.0.0.1:${server.address().port}/reference/` : null;
const browser = await chromium.launch();
for (const [name, page, width, height, query] of shots) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const tab = await ctx.newPage();
  const url = impl ? `${impl}${impl.includes('?') ? '&' : '?'}${query.replace(/^\?/, '')}` : base + page + query;
  await tab.goto(url, { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.waitForTimeout(300);
  await tab.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
  await ctx.close();
  console.log(`${name}.png`);
}
await browser.close();
server?.close();
