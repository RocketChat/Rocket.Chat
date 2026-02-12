import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
	preset: server.preset,
	transform: {
		'\\.pegjs$': resolve(__dirname, './loaders/pegtransform.js'),
	},
	moduleFileExtensions: ['js', 'ts', 'pegjs'],
} satisfies Config;
