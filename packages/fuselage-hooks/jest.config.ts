import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'csr',
			preset: client.preset,
			testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}', '!**/*.server.spec.{ts,tsx}'],
			setupFilesAfterEnv: [...client.setupFilesAfterEnv, '<rootDir>/src/jest-setup.ts'],
		},
		{
			displayName: 'ssr',
			preset: server.preset,
			testMatch: ['<rootDir>/src/**/*.server.spec.{ts,tsx}'],
			setupFilesAfterEnv: ['<rootDir>/src/jest-setup.ts'],
		},
	],
} satisfies Config;
