import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	preset: client.preset,
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
} satisfies Config;
