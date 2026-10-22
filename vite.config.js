import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
        drop_console: true,
      },
      mangle: {
        toplevel: true,
      },
    },
  },
});