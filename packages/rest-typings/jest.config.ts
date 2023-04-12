export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
