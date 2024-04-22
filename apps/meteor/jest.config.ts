import type { Config } from 'jest';

const config: Config = {
	projects: [
		{
			displayName: 'client',
			testEnvironment: 'jsdom',
			testMatch: [
				'<rootDir>/client/**/**.spec.[jt]s?(x)',
				'<rootDir>/tests/unit/client/views/**/*.spec.{ts,tsx}',
				'<rootDir>/tests/unit/client/providers/**/*.spec.{ts,tsx}',
			],
			errorOnDeprecated: true,

			modulePathIgnorePatterns: ['<rootDir>/dist/'],

			transform: {
				'^.+\\.(t|j)sx?$': '@swc/jest',
			},

			moduleNameMapper: {
				'\\.css$': 'identity-obj-proxy',
				'^react($|/.+)': '<rootDir>/node_modules/react$1',
				'^@tanstack/(.+)': '<rootDir>/node_modules/@tanstack/$1',
			},
		},
		{
			displayName: 'server',
			testEnvironment: 'node',

			testMatch: [
				'<rootDir>/app/livechat/server/business-hour/**/*.spec.ts?(x)',
				'<rootDir>/app/livechat/server/api/**/*.spec.ts',
				'<rootDir>/ee/app/authorization/server/validateUserRoles.spec.ts',
			],
			transformIgnorePatterns: ['!/node_modules/jose'],
			errorOnDeprecated: true,

			modulePathIgnorePatterns: ['<rootDir>/dist/'],

			transform: {
				'^.+\\.(t|j)sx?$': '@swc/jest',
			},

			moduleNameMapper: {
				'\\.css$': 'identity-obj-proxy',
				'^react($|/.+)': '<rootDir>/node_modules/react$1',
				'^@tanstack/(.+)': '<rootDir>/node_modules/@tanstack/$1',
			},
		},
	],
	collectCoverage: true,
};

export default config;
