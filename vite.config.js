import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  optimizeDeps: {
    exclude: ["@leaningtech/browserpod"],
  },
  build: {
    target: "esnext",
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game/index.html'),
        learn: resolve(__dirname, 'learn/index.html')
      }
    }
  }
});
