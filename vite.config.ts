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
        name: 'Metronome',
        short_name: 'Metronome',
        description: '正確なリズムを刻む、振り子式メトロノーム',
        lang: 'ja',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['music', 'utilities'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Only Latin glyphs are used; skip precaching the other Inter subsets.
        globIgnores: ['**/inter-{cyrillic,cyrillic-ext,greek,greek-ext,latin-ext,vietnamese}-*'],
      },
    }),
  ],
  server: { port: 5174 },
  preview: { port: 4174 },
});
