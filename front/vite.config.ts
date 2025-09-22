import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    fs: {
      strict: false
    }
  },
  // ESSA PARTE IMPORTANTE:
  // Garante que todas as requisições caiam no index.html
  // útil para React Router no Vercel
  base: '/',
  preview: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }
});
