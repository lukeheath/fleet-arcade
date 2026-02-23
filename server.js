import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

const FLEET_URL = process.env.FLEET_URL || 'https://dogfood.fleetdm.com';
const FLEET_API_TOKEN = process.env.FLEET_API_TOKEN;

// Allowlisted Fleet API routes — only proxy what the app needs
const ALLOWED_ROUTES = [
  /^\/api\/v1\/fleet\/hosts\?/, // list hosts (with query params)
  /^\/api\/v1\/fleet\/hosts\/\d+$/, // single host by ID
];

async function proxyToFleet(fleetPath, res) {
  const resp = await fetch(`${FLEET_URL}${fleetPath}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${FLEET_API_TOKEN}`,
      'Accept': 'application/json',
    },
  });
  res.status(resp.status);
  resp.headers.forEach((v, k) => {
    if (!['transfer-encoding', 'content-encoding', 'content-length'].includes(k)) {
      res.setHeader(k, v);
    }
  });
  const body = await resp.arrayBuffer();
  res.send(Buffer.from(body));
}

app.use('/api', (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const fullPath = `/api${req.url}`;
  if (!ALLOWED_ROUTES.some((r) => r.test(fullPath))) {
    return res.status(403).json({ error: 'Endpoint not allowed' });
  }

  proxyToFleet(fullPath, res);
});

// Serve built static files
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback
app.get('{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Fleet Arcade running on port ${port}`);
});
