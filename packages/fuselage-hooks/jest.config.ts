import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'csr',
			preset: client.preset,
			moduleNameMapper: {
				'^(\\.{1,2}/.*)\\.js$': '$1',
			},
			testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}', '!**/*.server.spec.{ts,tsx}'],
			setupFilesAfterEnv: [...client.setupFilesAfterEnv, '<rootDir>/src/jest-setup.ts'],
		},
		{
			displayName: 'ssr',
			preset: server.preset,
			moduleNameMapper: {
				'^(\\.{1,2}/.*)\\.js$': '$1',
			},
			testMatch: ['<rootDir>/src/**/*.server.spec.{ts,tsx}'],
			setupFilesAfterEnv: ['<rootDir>/src/jest-setup.ts'],
		},
	],
} satisfies Config;
