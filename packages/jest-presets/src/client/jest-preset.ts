import type { Config } from 'jest';

export default {
	testEnvironment: 'jsdom',
	errorOnDeprecated: true,

	transform: {
		'^.+\\.(t|j)sx?$': [
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
			},
		],
	},

	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},

	collectCoverage: true,
} satisfies Config;
