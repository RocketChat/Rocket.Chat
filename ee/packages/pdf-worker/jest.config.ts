import type { Config } from 'jest';

export default {
	preset: 'ts-jest',
	errorOnDeprecated: true,
	testEnvironment: 'jsdom',
	modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/worker.spec.ts'],
	moduleNameMapper: {
		'\\.css$': 'identity-obj-proxy',
	},
	setupFilesAfterEnv: ['<rootDir>/src/jest.setup.ts'],
} satisfies Config;
