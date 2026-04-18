import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/synapse-lab/',

  plugins: [react()],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 800,
  },

  server: {
    port: 5173,
    open: false,
  },
});
