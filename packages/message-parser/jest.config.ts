import { resolve } from 'node:path';

import type { Config } from 'jest';

export default {
	preset: resolve(__dirname, '../../packages/jest-presets/dist/server'),
	transform: {
		'\\.pegjs$': resolve(__dirname, './loaders/pegtransform.js'),
	},
	moduleFileExtensions: ['js', 'ts', 'pegjs'],
	testPathIgnorePatterns: ['/node_modules/', '\\.bench\\.ts$'],
} satisfies Config;
