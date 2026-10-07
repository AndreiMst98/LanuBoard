// Tiny static server for design/login/ so the references run over http:// (the logo light sweep uses
// a CSS mask-image, which browsers block on file:// pages).   node design/login/reference/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    if (path.startsWith('..')) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(join(root, path || 'reference/desktop.html'));
      res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await serve(Number(process.argv[2] ?? 4173));
  const { port } = server.address();
  console.log(`desktop: http://127.0.0.1:${port}/reference/desktop.html`);
  console.log(`mobile:  http://127.0.0.1:${port}/reference/mobile.html`);
}
