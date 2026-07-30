import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	moduleFileExtensions: ['js', 'ts'],
	testPathIgnorePatterns: ['/node_modules/', '\\.bench\\.ts$'],
} satisfies Config;
