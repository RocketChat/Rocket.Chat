import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

// jest-resolve doesn't apply TypeScript's `.js` → `.ts` mapping for the explicit
// extensions that `moduleResolution: nodenext` requires in the sources.
const moduleNameMapper = {
	'^(\\.{1,2}/.*)\\.js$': '$1',
};

export default {
	projects: [
		{
			displayName: 'client',
			preset: client.preset,
			testMatch: ['<rootDir>/src/**/*.client.spec.[jt]s?(x)'],
			moduleNameMapper,
		},
		{
			displayName: 'server',
			preset: server.preset,
			testMatch: ['<rootDir>/src/**/*.server.spec.[jt]s?(x)'],
			moduleNameMapper,
		},
	],
} satisfies Config;
