import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

const FLEET_URL = process.env.FLEET_URL || 'https://dogfood.fleetdm.com';

// Proxy /api requests to Fleet
app.use('/api', createProxyMiddleware({
  target: FLEET_URL,
  changeOrigin: true,
  secure: true,
}));

// Serve built static files
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Fleet Arcade running on port ${port}`);
});
