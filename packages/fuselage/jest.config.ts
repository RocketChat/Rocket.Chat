import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	preset: client.preset,
	testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}'],
	setupFilesAfterEnv: [...client.setupFilesAfterEnv, '<rootDir>/jest-setup.ts'],
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},
} satisfies Config;
