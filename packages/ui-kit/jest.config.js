module.exports = /** @satisfies {import('jest').Config} */ ({
	preset: 'ts-jest',
	testEnvironment: 'node',
	errorOnDeprecated: true,
	testMatch: ['<rootDir>/src/**/*.spec.[jt]s?(x)'],
	setupFilesAfterEnv: ['<rootDir>/src/jest-setup.ts'],
	collectCoverage: true,
});
