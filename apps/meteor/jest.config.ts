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
				'<rootDir>/app/ui-message/client/**/**.spec.[jt]s?(x)',
				'<rootDir>/tests/unit/client/views/**/*.spec.{ts,tsx}',
				'<rootDir>/tests/unit/client/providers/**/*.spec.{ts,tsx}',
				'<rootDir>/app/ui/client/**/**.spec.[jt]s?(x)',
				'<rootDir>/app/emoji-native/**/**.spec.[jt]s?(x)',
			],

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
			testMatch: [
				'<rootDir>/server/lib/omnichannel/business-hour/**/*.spec.ts?(x)',
				'<rootDir>/ee/server/lib/authorization/validateUserRoles.spec.ts',
				'<rootDir>/ee/server/lib/license/**/*.spec.ts',
				'<rootDir>/ee/server/api/mcp/**/*.spec.ts',
				'<rootDir>/ee/server/patches/**/*.spec.ts',
				'<rootDir>/ee/server/cron/**/*.spec.ts',
				'<rootDir>/server/lib/cloud/supportedVersionsToken/**.spec.ts',
				'<rootDir>/app/utils/lib/**.spec.ts',
				'<rootDir>/server/lib/auditServerEvents/**.spec.ts',
				'<rootDir>/server/services/import/**/*.spec.ts',
				'<rootDir>/server/services/call-history/**/*.spec.ts',
				'<rootDir>/server/settings/lib/**.spec.ts',
				'<rootDir>/server/cron/**.spec.ts',
				'<rootDir>/server/api/*.spec.ts',
				'<rootDir>/server/api/lib/getUserInfo.spec.ts',
				'<rootDir>/server/api/v1/middlewares/*.spec.ts',
				'<rootDir>/server/lib/cloud/version-check/**/*.spec.ts',
				'<rootDir>/server/lib/auth-providers/apple/**.spec.ts',
				'<rootDir>/server/lib/statusVisibility/*.spec.ts',
				'<rootDir>/server/services/statusVisibility/*.spec.ts',
			],
			coveragePathIgnorePatterns: ['/node_modules/'],
		},
	],
	coverageProvider: 'v8',
	collectCoverage: true,
} satisfies Config;
