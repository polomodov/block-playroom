import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../../', import.meta.url);
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

// Build the response table from the checkout once. Requests only look up an
// existing URL, and never select a filesystem path.
async function collectFiles(files, directory = '') {
  const entries = await readdir(new URL(directory || '.', root), { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const relative = directory + entry.name;
      if (entry.isDirectory() && (directory || entry.name === 'assets' || entry.name === 'games')) {
        await collectFiles(files, relative + '/');
      } else if (entry.isFile()) {
        const type = types[extname(entry.name)];
        if (!type) return;
        const file = { type, body: await readFile(new URL(relative, root)) };
        files.set(scope + relative, file);
        if (entry.name === 'index.html') files.set(scope + directory, file);
      }
    }),
  );
}

export async function startGameServer({ port = 0, rejectRequest = () => false } = {}) {
  const files = new Map();
  await collectFiles(files);
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    const { pathname } = new URL(request.url, 'http://localhost');
    if (rejectRequest(pathname)) {
      response.writeHead(503).end();
      return;
    }
    const file = files.get(pathname);
    if (file) response.writeHead(200, { 'Content-Type': file.type }).end(file.body);
    else response.writeHead(404).end();
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
