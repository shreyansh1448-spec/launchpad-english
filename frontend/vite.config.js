import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxies to `wrangler pages dev` (run separately: `npm run pages:dev`
    // in another terminal), which serves the Pages Functions API on :8788.
    proxy: {
      '/api': 'http://localhost:8788',
    },
  },
});
