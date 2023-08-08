export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['**/**.spec.ts'],
	transform: {
		'^.+\\.(t|j)sx?$': '@swc/jest',
	},
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},
	collectCoverage: true,
};
