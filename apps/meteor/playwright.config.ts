import { PlaywrightTestConfig } from '@playwright/test';

import { verifyTestBaseUrl } from './tests/e2e/utils/configs/verifyTestBaseUrl';

const { isLocal, baseURL } = verifyTestBaseUrl();

const localInserts = isLocal
	? {
			globalSetup: require.resolve('./tests/e2e/utils/configs/setup.ts'),
			globalTeardown: require.resolve('./tests/e2e/utils/configs/teardown.ts'),
	  }
	: { testIgnore: '00-wizard.spec.ts' };

const config: PlaywrightTestConfig = {
	...localInserts,
	use: {
		headless: true,
		viewport: { width: 1368, height: 768 },
		ignoreHTTPSErrors: true,
		video: 'retain-on-failure',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
		baseURL,
	},
	outputDir: 'tests/e2e/test-failures',
	reporter: process.env.CI ? 'github' : 'list',
	testDir: 'tests/e2e',
	retries: 3,
	workers: 1,
	timeout: 42 * 1000,
};

export default config;
