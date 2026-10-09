import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	testTimeout: 60_000,
} satisfies Config;
