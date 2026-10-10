import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'client',
			preset: client.preset,
			setupFilesAfterEnv: [...client.setupFilesAfterEnv],

			testMatch: ['<rootDir>/**/client/**/*.spec.[jt]s?(x)'],

			moduleNameMapper: {
				'^react($|/.+)': '<rootDir>/node_modules/react$1',
				'^react-virtuoso($|/.+)': '<rootDir>/node_modules/react-virtuoso$1',
				'^react-dom($|/.+)': '<rootDir>/node_modules/react-dom$1',
				'^react-i18next($|/.+)': '<rootDir>/node_modules/react-i18next$1',
				'^@rocket.chat/(.+)': '<rootDir>/node_modules/@rocket.chat/$1',
				'^@tanstack/(.+)': '<rootDir>/node_modules/@tanstack/$1',
				'^meteor/(.*)': '<rootDir>/tests/mocks/client/meteor.ts',
			},

			coveragePathIgnorePatterns: ['<rootDir>/tests/', '/node_modules/'],
		},
		{
			displayName: 'server',
			preset: server.preset,
			testMatch: ['<rootDir>/**/*.spec.ts?(x)'],
			testPathIgnorePatterns: ['/node_modules/', '/client/', '<rootDir>/tests/e2e/', '<rootDir>/tests/end-to-end/'],
			coveragePathIgnorePatterns: ['/node_modules/'],
		},
	],
	coverageProvider: 'v8',
	collectCoverage: true,
} satisfies Config;
