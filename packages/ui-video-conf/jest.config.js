module.exports = {
	preset: 'ts-jest/presets/js-with-babel',
	errorOnDeprecated: true,
	testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}'],
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect', '<rootDir>/.jest/setup.ts'],
};
