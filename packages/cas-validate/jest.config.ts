import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'server',
			preset: server.preset,
			moduleNameMapper: {
				'^(\\.{1,2}/.*)\\.js$': '$1',
			},
			testMatch: ['<rootDir>/src/**/*.spec.[jt]s?(x)'],
		},
	],
} satisfies Config;
