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
		channel: 'chrome',
		launchOptions: {
			// force GPU hardware acceleration
			// (even in headless mode)
			args: ['--use-gl=egl'],
		},
	},
	outputDir: 'tests/e2e/.playwright',
	reporter: process.env.CI ? 'github' : 'list',
	testDir: 'tests/e2e',
	workers: 1,
	retries: process.env.CI ? 2 : undefined,
	timeout: 60 * 1000,
	globalTimeout: 40 * 60 * 1000,
	maxFailures: process.env.CI ? 5 : undefined,
} as PlaywrightTestConfig;
