import peggy from '@rocket.chat/peggy-loader';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    peggy({ output: 'source-and-map' }),
    dts({ include: ['src/**/*'] }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
  },
});
