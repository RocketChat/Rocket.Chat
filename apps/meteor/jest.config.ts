import client from '@rocket.chat/jest-presets/client';
import server from '@rocket.chat/jest-presets/server';
import type { Config } from 'jest';

export default {
	projects: [
		{
			displayName: 'client',
			preset: client.preset,
			setupFilesAfterEnv: [...client.setupFilesAfterEnv],

			testMatch: [
				'<rootDir>/client/**/**.spec.[jt]s?(x)',
				'<rootDir>/ee/client/**/**.spec.[jt]s?(x)',
				'<rootDir>/tests/unit/client/views/**/*.spec.{ts,tsx}',
				'<rootDir>/tests/unit/client/providers/**/*.spec.{ts,tsx}',
			],

			moduleNameMapper: {
				'^react($|/.+)': '<rootDir>/node_modules/react$1',
				'^react-dom($|/.+)': '<rootDir>/node_modules/react-dom$1',
				'^react-i18next($|/.+)': '<rootDir>/node_modules/react-i18next$1',
				'^@tanstack/(.+)': '<rootDir>/node_modules/@tanstack/$1',
				'^meteor/(.*)': '<rootDir>/tests/mocks/client/meteor.ts',
			},

			coveragePathIgnorePatterns: ['<rootDir>/tests/'],
		},
		{
			displayName: 'server',
			preset: server.preset,

			testMatch: [
				'<rootDir>/app/livechat/server/business-hour/**/*.spec.ts?(x)',
				'<rootDir>/app/livechat/server/api/**/*.spec.ts',
				'<rootDir>/ee/app/authorization/server/validateUserRoles.spec.ts',
				'<rootDir>/ee/app/license/server/**/*.spec.ts',
				'<rootDir>/ee/server/patches/**/*.spec.ts',
				'<rootDir>/app/cloud/server/functions/supportedVersionsToken/**.spec.ts',
				'<rootDir>/app/utils/lib/**.spec.ts',
				'<rootDir>/server/lib/auditServerEvents/**.spec.ts',
				'<rootDir>/app/api/server/**.spec.ts',
				'<rootDir>/app/api/server/middlewares/**.spec.ts',
			],
		},
	],
} satisfies Config;
