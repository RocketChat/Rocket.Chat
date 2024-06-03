import type { Config } from 'jest';

export default {
	testEnvironment: 'node',
	errorOnDeprecated: true,

	transform: {
		'^.+\\.(t|j)sx?$': [
			'@swc/jest',
			{
				sourceMaps: true,
				jsc: {
					target: 'es2015',
				},
			},
		],
	},

	collectCoverage: true,
} satisfies Config;
