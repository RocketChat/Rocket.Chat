import type { Config } from 'jest';

export default {
	testEnvironment: 'node',
	errorOnDeprecated: true,

	transform: {
		'^.+\\.m?(t|j)sx?$': [
			'@swc/jest',
			{
				sourceMaps: true,
				jsc: {
					target: 'es2015',
					parser: {
						syntax: 'typescript',
						decorators: false,
						dynamicImport: true,
					},
				},
			},
		],
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],

	collectCoverage: true,
} satisfies Config;
