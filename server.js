import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

const FLEET_URL = process.env.FLEET_URL || 'https://dogfood.fleetdm.com';
const FLEET_API_TOKEN = process.env.FLEET_API_TOKEN;

// Proxy /api requests to Fleet, injecting auth header server-side
app.use('/api', async (req, res) => {
  const url = `${FLEET_URL}/api${req.url}`;
  const resp = await fetch(url, {
    method: req.method,
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
