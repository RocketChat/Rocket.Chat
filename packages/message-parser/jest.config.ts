import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Config } from 'jest';

// Jest 30 loads this config via Node's native type stripping (Node 22.18+),
// which treats the file as ESM where __dirname is not defined as a global.
const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
	testEnvironment: 'node',
	errorOnDeprecated: true,
	transform: {
		'\\.pegjs$': resolve(__dirname, './loaders/pegtransform.js'),
		'^.+\\.m?(t|j)sx?$': [
			'@swc/jest',
			{
				sourceMaps: true,
				jsc: {
					target: 'es2020',
					parser: {
						syntax: 'typescript',
						decorators: false,
						dynamicImport: true,
					},
				},
			},
		],
	},
	moduleFileExtensions: ['js', 'ts', 'pegjs'],
	testPathIgnorePatterns: ['/node_modules/', '\\.bench\\.ts$'],
} satisfies Config;
