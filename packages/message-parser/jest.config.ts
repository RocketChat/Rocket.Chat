import { resolve } from 'node:path';

import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
  preset: server.preset,
  transform: {
    '\\.pegjs$': resolve(__dirname, './loaders/pegtransform.js'),
  },
  moduleFileExtensions: ['js', 'ts', 'pegjs'],
} satisfies Config;
