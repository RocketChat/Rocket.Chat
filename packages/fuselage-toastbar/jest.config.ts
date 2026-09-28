import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	preset: client.preset,
	setupFilesAfterEnv: [...client.setupFilesAfterEnv, '<rootDir>/jest-setup.ts'],
} satisfies Config;
