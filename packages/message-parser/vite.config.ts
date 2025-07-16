import { resolve } from 'path';

import peggy from '@rocket.chat/peggy-loader';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [peggy(), dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RocketChatMessageParser',
      fileName: (format) => {
        if (format === 'umd') {
          return 'messageParser.umd.js';
        }
        if (format === 'es') {
          return 'messageParser.mjs';
        }
        return 'messageParser.cjs';
      },
      formats: ['umd', 'es', 'cjs'],
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
  },
});
