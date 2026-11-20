import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const scope = '/block-playroom/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
};

export async function startGameServer({ port = 0, rejectRequest = () => false } = {}) {
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    const { pathname } = new URL(request.url, 'http://localhost');
    if (rejectRequest(pathname)) {
      response.writeHead(503).end();
      return;
    }
    if (!pathname.startsWith(scope)) {
      response.writeHead(404).end();
      return;
    }
    const relative = pathname.slice(scope.length) + (pathname.endsWith('/') ? 'index.html' : '');
    const file = resolve(root, relative);
    const type = types[extname(file)];
    if (
      !file.startsWith(resolve(root) + sep) ||
      !type ||
      (relative.includes('/') && !/^(assets|games)\//.test(relative))
    ) {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': type }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((ready, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', ready);
  });
  return {
    url: 'http://127.0.0.1:' + server.address().port + scope,
    close: () =>
      new Promise((done) => {
        server.close(done);
        server.closeAllConnections();
      }),
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await startGameServer({ port: Number(process.argv[2]) });
}
