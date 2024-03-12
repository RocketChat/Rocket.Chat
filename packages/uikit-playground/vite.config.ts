import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  logLevel: 'info',
  esbuild: {},
  plugins: [react()],
  optimizeDeps: {
    include: ['@rocket.chat/ui-contexts', '@rocket.chat/message-parser'],
  },
  build: {
    commonjsOptions: {
      include: [/ui-contexts/, /message-parser/, /node_modules/],
    },
  },
}));
