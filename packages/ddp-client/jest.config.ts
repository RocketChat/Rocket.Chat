export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['**/**.spec.ts'],
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},
};
