import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [
    preact(),
    {
      name: 'redirect-root-to-home',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            res.writeHead(302, { Location: '/home' });
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
    port: 5173,       // can change if needed
    proxy: {
      '/home': 'http://127.0.0.1:8000', // PHP backend still runs locally on the server
    },
    open: false, // don’t auto-open a browser on a headless server
  }
});
