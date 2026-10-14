import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'server',
			preset: server.preset,
			testMatch: ['<rootDir>/**/*.spec.ts?(x)'],
			testPathIgnorePatterns: ['/node_modules/', '/client/', '<rootDir>/tests/e2e/', '<rootDir>/tests/end-to-end/'],
			coveragePathIgnorePatterns: ['/node_modules/'],
		},
	],
	coverageProvider: 'v8',
	collectCoverage: true,
} satisfies Config;
