import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

// Jest 30 loads this config via Node's native type stripping (Node 22.18+),
// which treats the file as ESM where __dirname is not defined as a global.
const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
	preset: server.preset,
	transform: {
		'\\.pegjs$': resolve(__dirname, './loaders/pegtransform.js'),
	},
	moduleFileExtensions: ['js', 'ts', 'pegjs'],
	testPathIgnorePatterns: ['/node_modules/', '\\.bench\\.ts$'],
} satisfies Config;
