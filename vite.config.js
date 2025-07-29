import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/src'), // 👈 fix this
    },
  },
  base: '/',
  build: {
    outDir: 'dist',
  },
});



