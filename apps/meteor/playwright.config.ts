import type { PlaywrightTestConfig } from '@playwright/test';

import * as constants from './tests/e2e/config/constants';

export default {
	globalSetup: require.resolve('./tests/e2e/config/global-setup.ts'),
	use: {
		headless: true,
		ignoreHTTPSErrors: true,
		trace: 'retain-on-failure',
		baseURL: constants.BASE_URL,
		screenshot: process.env.CI ? 'off' : 'only-on-failure',
		video: process.env.CI ? 'off' : 'retain-on-failure',
		launchOptions: {
			// force GPU hardware acceleration
			// (even in headless mode)
			args: ['--use-gl=egl', '--use-fake-ui-for-media-stream'],
		},
		permissions: ['microphone'],
	},
	outputDir: 'tests/e2e/.playwright',
	reporter: [
		['list'],
		process.env.REPORTER_ROCKETCHAT_REPORT === 'true' && [
			'./reporters/rocketchat.ts',
			{
				url: process.env.REPORTER_ROCKETCHAT_URL,
				apiKey: process.env.REPORTER_ROCKETCHAT_API_KEY,
				branch: process.env.REPORTER_ROCKETCHAT_BRANCH,
				draft: process.env.REPORTER_ROCKETCHAT_DRAFT === 'true',
			},
		],
		[
			'playwright-qase-reporter',
			{
				apiToken: `${process.env.QASE_API_TOKEN}`,
				rootSuiteTitle: 'Rocket.chat automation',
				projectCode: 'RC',
				runComplete: true,
				basePath: 'https://api.qase.io/v1',
				logging: true,
				uploadAttachments: false,
				environmentId: '1',
			},
		],
	].filter(Boolean),
	testDir: 'tests/e2e',
	testIgnore: 'tests/e2e/federation/**',
	workers: 1,
	timeout: 60 * 1000,
	globalTimeout: (process.env.IS_EE === 'true' ? 50 : 40) * 60 * 1000,
	maxFailures: process.env.CI ? 5 : undefined,
} as PlaywrightTestConfig;
