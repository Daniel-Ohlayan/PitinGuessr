import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути: собранный сайт работает в любой папке и на любом хостинге
  // (GitHub Pages, Netlify, Vercel, обычный хостинг).
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
});
