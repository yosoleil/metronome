import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the app from /<repo>/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Generates the PNG icons from public/icon.svg (see pwa-assets.config.ts) and injects their <link>s.
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'メトロノーム',
        short_name: 'メトロノーム',
        description: '正確なリズムを刻む、振り子式メトロノーム',
        lang: 'ja',
        theme_color: '#fffbf0',
        background_color: '#fffbf0',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['music', 'utilities'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Precache the Latin Nunito face only. The Japanese rounded font is split into ~120
        // unicode-range files; only the few this UI uses get fetched, and they're cached at runtime.
        globIgnores: ['**/nunito-{cyrillic,cyrillic-ext,vietnamese,latin-ext}-*', '**/m-plus-rounded-1c-*'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/m-plus-rounded-1c-.*\.woff2$/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts-ja', expiration: { maxEntries: 60 } },
          },
        ],
      },
    }),
  ],
  server: { port: 5174 },
  preview: { port: 4174 },
});
