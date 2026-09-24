import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const background = '#5fd3b0';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // The icon is full-bleed mint, so pad the maskable / Apple variants onto the same mint background.
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background } },
  },
  images: ['public/icon.svg'],
});
