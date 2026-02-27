import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Single bundle for easy embedding
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5174,
    cors: true,
  },
});
