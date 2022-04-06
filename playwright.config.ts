import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	outputDir: 'tests/e2e/test-failures',
	reporter: [['list']],
	workers: 1,
	globalSetup: './tests/e2e/globalSetup',
	use: {
		baseURL: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
		headless: true,
		viewport: { width: 1368, height: 768 },
		ignoreHTTPSErrors: false,
		video: 'retain-on-failure',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
	},
	testDir: 'tests/e2e',
};
export default config;
