import client from '@rocket.chat/jest-presets/client';

export default {
	rootDir: '../..',
	preset: client.preset,
	setupFilesAfterEnv: [...client.setupFilesAfterEnv],
	testMatch: ['<rootDir>/client/lib/e2eeSearch/browser/*.spec.ts'],
	moduleNameMapper: {
		'^@rocket.chat/desktop-api$': '<rootDir>/../../packages/desktop-api/src/e2eeSearch.ts',
	},
	collectCoverage: false,
	cacheDirectory: '<rootDir>/tests/e2ee-search-browser/.build/jest-cache',
};
