import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: "/Nine-Yards-Prototype/",
  plugins: [
    solidPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  assetsInclude: ['**/*.svg']
});
