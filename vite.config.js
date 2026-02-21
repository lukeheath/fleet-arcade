import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const fleetUrl = env.VITE_FLEET_URL || 'https://localhost';

  return {
    server: {
      proxy: {
        '/api': {
          target: fleetUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
