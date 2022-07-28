import { PlaywrightTestConfig } from '@playwright/test';

import * as constants from './tests/e2e/config/constants';

export default {
	globalSetup: require.resolve('./tests/e2e/config/global-setup.ts'),
	use: {
		headless: true,
		ignoreHTTPSErrors: true,
		trace: 'retain-on-failure',
		baseURL: constants.BASE_URL,
		screenshot: 'only-on-failure',
	},
	outputDir: 'tests/e2e/test-failures',
	reporter: process.env.CI ? 'github' : 'list',
	testDir: 'tests/e2e',
	workers: process.env.CI ? 2 : undefined,
	timeout: process.env.CI ? 600_000 : 300_000,
	retries: process.env.CI ? 2 : undefined,
	globalTimeout: 600_000,
} as PlaywrightTestConfig;
