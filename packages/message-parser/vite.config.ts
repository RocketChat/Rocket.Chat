import { resolve } from 'path';

import peggy from '@rocket.chat/peggy-loader';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [peggy(), dts({ include: ['src/**/*'] })],
  build: {
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
        resolve(__dirname, 'src/utils.ts'),
      ],
      name: 'RocketChatMessageParser',
      fileName: (format, entry) => {
        if (format === 'es') {
          return `${entry}.mjs`;
        }
        return `${entry}.cjs`;
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
  },
});
