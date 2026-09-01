import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'client',
			preset: client.preset,
			setupFilesAfterEnv: [...client.setupFilesAfterEnv],
			testMatch: ['<rootDir>/src/**/*.client.spec.[jt]s?(x)'],
		},
		{
			displayName: 'server',
			preset: server.preset,
			testMatch: ['<rootDir>/src/**/*.server.spec.[jt]s?(x)'],
		},
	],
	coverageProvider: 'v8',
	collectCoverage: true,
} satisfies Config;
