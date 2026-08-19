import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'server',
			preset: server.preset,
			testMatch: ['<rootDir>/src/**/*.spec.[jt]s?(x)'],
		},
	],
	coverageProvider: 'v8',
	collectCoverage: true,
} satisfies Config;
