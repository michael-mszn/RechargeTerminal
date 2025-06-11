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
    proxy: {
      '/home': 'http://localhost:8000',
    },
    open: true,
  }
});