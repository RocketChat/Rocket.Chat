import type * as SWC from '@swc/core';
import type { Config } from 'jest';

export default {
	testEnvironment: 'jsdom',
	errorOnDeprecated: true,

	transform: {
		'^.+\\.m?(t|j)sx?$': [
			'@swc/jest',
			{
				sourceMaps: true,
				jsc: {
					target: 'es2015',
					transform: {
						react: {
							runtime: 'automatic',
						},
					},
					parser: {
						syntax: 'typescript',
						tsx: true,
						decorators: false,
						dynamicImport: true,
					},
				},
			} satisfies SWC.Config,
		],
	},
	transformIgnorePatterns: [
		'<rootDir>/node_modules/@babel',
		'<rootDir>/node_modules/@jest',
		'/node_modules/(?!@testing-library/|@faker-js/)',
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],

	moduleNameMapper: {
		// jest-resolve doesn't apply TypeScript's `.js` → `.ts` mapping for the explicit
		// extensions that `moduleResolution: nodenext` requires in the sources.
		'^(\\.{1,2}/.*)\\.js$': '$1',
		'\\.css$': 'identity-obj-proxy',
	},

	collectCoverage: true,
} satisfies Config;
