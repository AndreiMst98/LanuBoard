// Freezes every CSS animation at fixed times and captures a frame, so motion can be compared exactly.
//
//   node design/login/reference/motion-frames.mjs                      -> references -> design/login/screenshots/motion/
//   node design/login/reference/motion-frames.mjs <outDir> <loginUrl>  -> your implementation
//
// Time t is measured from the moment the animations start (page load on desktop, the moment the
// root gets .lb-anim on mobile). All CSS animations on the page are paused and seeked to t ms.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2] ?? join(here, '..', 'screenshots', 'motion'));
const impl = process.argv[3];

const sets = [
  // page, viewport, times (ms)
  ['desktop', 'desktop.html', 1440, 900, [150, 450, 900, 1300, 3000, 4300, 6100, 8100]],
  ['mobile', 'mobile.html', 390, 844, [50, 500, 1000, 1350, 1900, 2350, 2700]],
];

mkdirSync(outDir, { recursive: true });
const server = impl ? null : await serve();
const base = server ? `http://127.0.0.1:${server.address().port}/reference/` : null;
const browser = await chromium.launch();
for (const [name, page, width, height, times] of sets) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const tab = await ctx.newPage();
  await tab.goto(impl ?? base + page, { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready);
  for (const t of times) {
    await tab.evaluate((ms) => {
      for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
    }, t);
    await tab.waitForTimeout(50);
    const file = `${name}-t${String(t).padStart(4, '0')}ms.png`;
    await tab.screenshot({ path: join(outDir, file) });
    console.log(file);
  }
  await ctx.close();
}
await browser.close();
server?.close();
