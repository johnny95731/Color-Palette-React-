import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import sass from 'sass'
import react from '@vitejs/plugin-react';
import svgLoader from 'vite-svg-loader';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgLoader(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // [
    //   { find: "@", replacement: resolve(__dirname, "./src") },
    //   { find: "types", replacement: `${resolve(__dirname, "./src/features/types")}; ${resolve(__dirname, "./src/common/types")}` },
    //   { find: "slices", replacement: resolve(__dirname, "./src/features/slices") },
    // ],
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
        implementation: sass,
      },
    },
  },
});