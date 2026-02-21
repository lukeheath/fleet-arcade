import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const fleetUrl = env.FLEET_URL || 'https://localhost';
  const fleetApiToken = env.FLEET_API_TOKEN;

  return {
    server: {
      proxy: {
        '/api': {
          target: fleetUrl,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (fleetApiToken) {
                proxyReq.setHeader('Authorization', `Bearer ${fleetApiToken}`);
              }
            });
          },
        },
      },
    },
  };
});
