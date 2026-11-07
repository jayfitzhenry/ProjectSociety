// Local dev server for browser tests: the repo's static files plus the real API handlers running on
// the in-memory fake repo (api/test/fake-repo.js), with a fake sign-in. Never deployed.
//
//   node server.mjs [port]            then open http://localhost:8787/login?as=alice
//
// /login?as=<name> signs you in as that user (a cookie); /.auth/me reports it like Static Web Apps.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const load = (p) => import(pathToFileURL(path.join(ROOT, p)).href);

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
};

/** Match a Functions route template like campaigns/{cid}/stories against a path. */
function match(tpl, p) {
  const a = tpl.split('/');
  const b = p.split('/');
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i += 1) {
    const m = a[i].match(/^\{(\w+)\}$/);
    if (m) params[m[1]] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

const who = (req) => (req.headers.cookie || '').match(/(?:^|; )as=(\w+)/)?.[1];

export async function startServer(port = 8787) {
  const { useFake } = await load('api/test/fake-repo.js');
  const { principal } = await load('api/test/helpers.js');
  const { ROUTES } = await load('api/src/routes.js');
  useFake();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/login') {
      res.writeHead(302, { 'set-cookie': `as=${url.searchParams.get('as') || ''}; path=/`, location: '/' });
      return res.end();
    }
    if (url.pathname === '/.auth/me') {
      const u = who(req);
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({
        clientPrincipal: u ? { identityProvider: 'github', userId: u, userDetails: u, userRoles: ['authenticated'] } : null,
      }));
    }
    if (url.pathname.startsWith('/api/')) {
      const p = url.pathname.slice(5);
      for (const r of ROUTES) {
        const params = match(r.route, p);
        if (!params || !r.map[req.method]) continue;
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const body = Buffer.concat(chunks).toString();
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(',') : v);
        const u = who(req);
        if (u) headers.set('x-ms-client-principal', principal(u));
        const request = { method: req.method, params, query: url.searchParams, headers, text: async () => body };
        const out = await r.map[req.method](request, { error: console.error, log: () => {} });
        res.writeHead(out.status ?? 200, { 'content-type': 'application/json', ...(out.headers || {}) });
        return res.end(out.jsonBody === undefined ? '' : JSON.stringify(out.jsonBody));
      }
      res.writeHead(404, { 'content-type': 'application/json' });
      return res.end('{}');
    }
    const f = path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    return fs.createReadStream(f).pipe(res);
  });
  await new Promise((resolve) => server.listen(port, resolve));
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 8787);
  await startServer(port);
  console.log(`Project Society dev server: http://localhost:${port}/login?as=alice`);
}
