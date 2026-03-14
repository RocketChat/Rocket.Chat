import { resolve } from 'node:path';

import type { Config } from 'jest';

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
