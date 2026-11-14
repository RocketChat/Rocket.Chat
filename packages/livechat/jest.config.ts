import client from '@rocket.chat/jest-presets/client';
import type { Config } from 'jest';

export default {
	preset: client.preset,
	testMatch: ['<rootDir>/src/**/*.spec.[jt]s?(x)'],
	transform: {
		'^.+\\.m?(t|j)sx?$': [
			'@swc/jest',
			{
				jsc: {
					target: 'es2015',
					transform: { react: { runtime: 'automatic', importSource: 'preact' } },
					parser: { syntax: 'typescript', tsx: true },
				},
			},
		],
	},
	moduleNameMapper: {
		'\\.scss$': 'identity-obj-proxy',
		'\\.svg$': '<rootDir>/src/lib/jestSvgStub.ts',
		'^react$': 'preact/compat',
		'^react/jsx-runtime$': 'preact/jsx-runtime',
		'^react-dom$': 'preact/compat',
	},
	// Without this, jsdom's `browser` condition resolves preact to its ESM build, which Jest cannot require.
	testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] },
	collectCoverage: false,
} satisfies Config;
