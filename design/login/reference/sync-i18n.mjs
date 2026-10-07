// Copies ../i18n/{ro,de,en}.json into the reference pages (they must open from file:// without a server).
// Run after editing any string:  node design/login/reference/sync-i18n.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const text = Object.fromEntries(
  ['ro', 'de', 'en'].map((l) => [l, JSON.parse(readFileSync(join(here, '..', 'i18n', `${l}.json`), 'utf8'))])
);
for (const page of ['desktop.html', 'mobile.html']) {
  const file = join(here, page);
  const html = readFileSync(file, 'utf8');
  const next = html.replace(/\/\*I18N:START\*\/[\s\S]*?\/\*I18N:END\*\//, `/*I18N:START*/${JSON.stringify(text)}/*I18N:END*/`);
  if (next === html && !html.includes('/*I18N:START*/')) throw new Error(`no I18N markers in ${page}`);
  writeFileSync(file, next);
  console.log(`synced ${page}`);
}
