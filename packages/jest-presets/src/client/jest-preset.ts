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
	transformIgnorePatterns: ['<rootDir>/node_modules/@babel', '<rootDir>/node_modules/@jest', '/node_modules/(?!@testing-library/)'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],

	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},

	collectCoverage: true,
} satisfies Config;
