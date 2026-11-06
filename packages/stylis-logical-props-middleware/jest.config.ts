import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	coverageProvider: 'v8',
	collectCoverage: true,
} satisfies Config;
