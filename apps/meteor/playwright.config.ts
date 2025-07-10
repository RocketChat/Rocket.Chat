import type { PlaywrightTestConfig } from '@playwright/test';

import * as constants from './tests/e2e/config/constants';

export default {
	globalSetup: require.resolve('./tests/e2e/config/global-setup.ts'),
	use: {
		channel: 'chromium',
		headless: true,
		ignoreHTTPSErrors: true,
		trace: 'retain-on-failure',
		baseURL: constants.BASE_URL,
		screenshot: process.env.CI ? 'off' : 'only-on-failure',
		video: process.env.CI ? 'off' : 'retain-on-failure',
		launchOptions: {
			// force GPU hardware acceleration
			// (even in headless mode)
			args: ['--use-gl=egl', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
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
				run: Number(process.env.REPORTER_ROCKETCHAT_RUN),
				draft: process.env.REPORTER_ROCKETCHAT_DRAFT === 'true',
				headSha: process.env.REPORTER_ROCKETCHAT_HEAD_SHA,
			},
		],
		process.env.REPORTER_ROCKETCHAT_REPORT === 'true' && [
			'./reporters/jira.ts',
			{
				url: `https://rocketchat.atlassian.net`,
				apiKey: process.env.REPORTER_JIRA_ROCKETCHAT_API_KEY ?? process.env.JIRA_TOKEN,
				branch: process.env.REPORTER_ROCKETCHAT_BRANCH,
				run: Number(process.env.REPORTER_ROCKETCHAT_RUN),
				headSha: process.env.REPORTER_ROCKETCHAT_HEAD_SHA,
				author: process.env.REPORTER_ROCKETCHAT_AUTHOR,
				run_url: process.env.REPORTER_ROCKETCHAT_RUN_URL,
				pr: Number(process.env.REPORTER_ROCKETCHAT_PR),
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
	].filter(Boolean) as unknown as PlaywrightTestConfig['reporter'],
	testDir: 'tests/e2e',
	testIgnore: 'tests/e2e/federation/**',
	workers: 1,
	timeout: 60 * 1000,
	globalTimeout: (process.env.IS_EE === 'true' ? 50 : 40) * 60 * 1000,
	maxFailures: process.env.CI ? 5 : undefined,
	// Retry on CI only.
	retries: parseInt(String(process.env.PLAYWRIGHT_RETRIES)) || 0,
} as PlaywrightTestConfig;
