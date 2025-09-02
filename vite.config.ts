import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact(),
    {
      name: 'redirect-root-to-terminal',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            res.writeHead(302, { Location: '/terminal' });
            res.end();
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',  // allow external access, not just localhost
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000', // forward all /api requests to PHP dev server
    },
    open: false, // don’t auto-open a browser on a headless server
  }
});
