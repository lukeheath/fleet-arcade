import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

const FLEET_URL = process.env.FLEET_URL || 'https://dogfood.fleetdm.com';
const FLEET_API_TOKEN = process.env.FLEET_API_TOKEN;

// Proxy /api requests to Fleet, injecting auth header server-side
app.use('/api', createProxyMiddleware({
  target: FLEET_URL,
  changeOrigin: true,
  secure: true,
  on: {
    proxyReq: (proxyReq) => {
      if (FLEET_API_TOKEN) {
        proxyReq.setHeader('Authorization', `Bearer ${FLEET_API_TOKEN}`);
      }
    },
  },
}));

// Serve built static files
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback
app.get('{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Fleet Arcade running on port ${port}`);
});
