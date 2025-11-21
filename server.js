import http from 'http';
import { stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const PORT = process.env.PORT || 9868;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'access-control-allow-origin': '*', ...headers });
  if (body !== undefined) res.end(body);
  else res.end();
};

const buildUrl = (reqUrl = '') => reqUrl.split('?')[0].replace(/^\/+/, '');

const parseJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Invalid JSON in request body');
  }
};

const serveStatic = async (req, res) => {
  const cleanPath = buildUrl(req.url);
  let filePath = cleanPath ? path.join(publicDir, cleanPath) : path.join(publicDir, 'index.html');

  try {
    const stats = await stat(filePath);
    if (stats.isDirectory()) filePath = path.join(filePath, 'index.html');
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    createReadStream(filePath).pipe(res);
  } catch (err) {
    send(res, 404, 'Not found');
  }
};

const proxyRequest = async (req, res) => {
  try {
    const { endpoint, apiKey, payload, extraHeaders = {} } = await parseJsonBody(req);
    if (!endpoint) return send(res, 400, JSON.stringify({ error: 'endpoint is required' }), { 'Content-Type': 'application/json' });
    if (!apiKey) return send(res, 400, JSON.stringify({ error: 'apiKey is required' }), { 'Content-Type': 'application/json' });

    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
      ...extraHeaders
    };

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload ?? {})
    });

    const responseText = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json';
    send(res, upstream.status, responseText, { 'Content-Type': contentType });
  } catch (err) {
    send(res, 500, JSON.stringify({ error: err.message || 'Proxy error' }), { 'Content-Type': 'application/json' });
  }
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'Content-Type,x-goog-api-key,x-goog-visitor-id'
    });
    return res.end();
  }

  if (req.url.startsWith('/proxy') && req.method === 'POST') {
    return proxyRequest(req, res);
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Gemini image studio running at http://localhost:${PORT}`);
});
