export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['**/**.spec.ts'],
	collectCoverage: true,
};
