import { PlaywrightTestConfig } from '@playwright/test';

import * as constants from './tests/e2e/config/constants';

export default {
	globalSetup: require.resolve('./tests/e2e/config/global-setup.ts'),
	use: {
		headless: false,
		ignoreHTTPSErrors: true,
		trace: 'retain-on-failure',
		baseURL: constants.BASE_URL,
		screenshot: process.env.CI ? 'off' : 'only-on-failure',
	},
	outputDir: 'tests/e2e/.playwright',
	reporter: process.env.CI ? 'github' : 'list',
	testDir: 'tests/e2e',
	workers: 2,
	timeout: process.env.CI ? 2000_000 : 600_000,
	retries: process.env.CI ? 2 : undefined,
	globalTimeout: 2000_000,
	maxFailures: process.env.CI ? 5 : undefined,
} as PlaywrightTestConfig;
