import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	testMatch: ['<rootDir>/src/**/*.spec.(ts|js|mjs)'],
} satisfies Config;
