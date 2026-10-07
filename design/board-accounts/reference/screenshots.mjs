// Captures the visual targets for the Board accounts page.
//
//   node design/board-accounts/reference/screenshots.mjs                         -> reference -> design/board-accounts/screenshots/
//   node design/board-accounts/reference/screenshots.mjs <outDir> <accountsUrl>  -> your implementation, same shots
//
// <accountsUrl> is the implemented page (e.g. http://localhost:3000/board-accounts) running on the same demo data,
// accepting the same query params as the reference (dev/test builds only) so every shot is comparable.
// Shots use prefers-reduced-motion: reduce (panels without their slide-in).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2] ?? join(here, '..', 'screenshots'));
const impl = process.argv[3];

const shots = [
  // name, query, width, height
  ['accounts-1440x900', '', 1440, 900],
  ['accounts-1440x900-menu', '?menu=aa', 1440, 900],
  ['accounts-1440x900-menu-own-account', '?menu=am', 1440, 900],
  ['accounts-1440x900-menu-last-row', '?menu=ss', 1440, 900],
  ['accounts-1440x900-filter-dispatchers', '?filter=Dispatcher', 1440, 900],
  ['accounts-1440x900-empty-managers', '?filter=Manager', 1440, 900],
  ['accounts-1440x900-search-no-match', '?q=zzz', 1440, 900],
  ['accounts-1280x800', '', 1280, 800],
  ['accounts-1024x768', '', 1024, 768],
  ['roles-1440', '?view=roles', 1440, 900],
  ['roles-1440-unsaved', '?view=roles&dirty=1', 1440, 900],
  ['edit-1440x900', '?panel=edit&id=ac', 1440, 900],
  ['edit-1440x900-role-manager', '?panel=edit&id=ac&role=Manager', 1440, 900],
  ['edit-1440x900-admin', '?panel=edit&id=cc', 1440, 900],
  ['edit-1440x900-own-account', '?panel=edit&id=am', 1440, 900],
  ['edit-1440x900-change-password', '?panel=edit&id=ac&password=1', 1440, 900],
  ['edit-1440x900-confirm-delete', '?panel=edit&id=ac&confirm=1', 1440, 900],
  ['new-1440x900', '?panel=new', 1440, 900],
  ['new-1440x900-errors', '?panel=new&tried=1', 1440, 900],
  ['new-1440x900-customize', '?panel=new&customize=1', 1440, 900],
  ['new-1440x900-created', '?panel=new&done=1&name=Ana%20Popescu&email=ana%40example.com', 1440, 900],
];

mkdirSync(outDir, { recursive: true });
const server = impl ? null : await serve();
const base = server ? `http://127.0.0.1:${server.address().port}/reference/index.html` : impl;
const browser = await chromium.launch();
for (const [name, query, width, height] of shots) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const tab = await ctx.newPage();
  const url = query ? `${base}${base.includes('?') ? '&' : '?'}${query.slice(1)}` : base;
  await tab.goto(url, { waitUntil: 'networkidle' });
  await tab.evaluate(() => document.fonts.ready);
  await tab.evaluate(() => document.activeElement && document.activeElement.blur());
  await tab.waitForTimeout(200);
  await tab.screenshot({ path: join(outDir, `${name}.png`), fullPage: true });
  await ctx.close();
  console.log(`${name}.png`);
}
await browser.close();
server?.close();
