import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import sass from 'sass'
import react from '@vitejs/plugin-react';
import svgLoader from 'vite-svg-loader';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: '',
    sourcemap: false,
    minify: true,
  },
  plugins: [
    tsconfigPaths(),
    react(),
    svgLoader(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.scss',
      '.svg',
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // implementation: sass,
      },
    },
  },
});