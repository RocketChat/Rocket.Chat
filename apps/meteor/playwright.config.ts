import { defineConfig, devices } from '@playwright/test';

import * as constants from './tests/e2e/config/constants';

export default defineConfig({
	testDir: 'tests/e2e',
	testIgnore: ['tests/e2e/federation/**'],
	testMatch: ['tests/e2e/**/*.spec.ts'],
	outputDir: 'tests/e2e/.playwright',
	use: {
		baseURL: constants.BASE_URL,
	},
	workers: 1,
	timeout: 60 * 1000,
	globalTimeout: (process.env.IS_EE === 'true' ? 50 : 40) * 60 * 1000,
	maxFailures: process.env.CI ? 5 : undefined,
	// Retry on CI only.
	retries: parseInt(String(process.env.PLAYWRIGHT_RETRIES)) || 0,
	projects: [
		{
			name: 'setup:data',
			testMatch: /data.setup.ts/,
		},
		{
			name: 'setup:app',
			testMatch: /app.setup.ts/,
			dependencies: ['setup:data'],
		},
		{
			name: 'setup:oauth',
			testMatch: /oauth.setup.ts/,
			dependencies: ['setup:data'],
		},
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				headless: true,
			},
			dependencies: ['setup:app', 'setup:oauth'],
		},
	],
});
