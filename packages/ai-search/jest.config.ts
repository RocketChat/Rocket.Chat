import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	preset: server.preset,
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
} satisfies Config;
