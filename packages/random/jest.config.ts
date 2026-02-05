import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'client',
			preset: client.preset,
			testMatch: ['<rootDir>/src/**/*.client.spec.[jt]s?(x)'],
			moduleNameMapper: {
				'^(\\.{1,2}/.*)\\.js$': '$1',
			},
		},
		{
			displayName: 'server',
			preset: server.preset,
			testMatch: ['<rootDir>/src/**/*.server.spec.[jt]s?(x)'],
			moduleNameMapper: {
				'^(\\.{1,2}/.*)\\.js$': '$1',
			},
		},
	],
} satisfies Config;
