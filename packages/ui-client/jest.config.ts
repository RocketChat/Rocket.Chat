import type { Config } from 'jest';

export default {
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['<rootDir>/src/**/**.spec.[jt]s?(x)'],
	transform: {
		'^.+\\.(t|j)sx?$': [
			'@swc/jest',
			{
				jsc: {
					transform: {
						react: {
							runtime: 'automatic',
						},
					},
				},
			},
		],
	},
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
		'^react($|/.+)': '<rootDir>/../../node_modules/react$1',
		'^react-dom/client$': '<rootDir>/../../node_modules/react-dom$1',
		'^react-dom($|/.+)': '<rootDir>/../../node_modules/react-dom$1',
	},
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.{ts,tsx}'],
	setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
} satisfies Config;
