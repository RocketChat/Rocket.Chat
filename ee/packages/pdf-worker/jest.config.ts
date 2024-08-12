import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'client',
			preset: client.preset,
			setupFilesAfterEnv: [...client.setupFilesAfterEnv],
			modulePathIgnorePatterns: ['<rootDir>/src/worker.spec.ts'],
		},
		{
			displayName: 'worker',
			preset: client.preset,
			setupFilesAfterEnv: [...client.setupFilesAfterEnv],
			moduleNameMapper: {
				'^fontkit($|/.+)': '<rootDir>/../../../node_modules/fontkit$1', // needed to a weird bug related to module resolution in SWC
			},
			modulePathIgnorePatterns: ['<rootDir>/src/strategies/', '<rootDir>/src/templates/'],
		},
	],
} satisfies Config;
