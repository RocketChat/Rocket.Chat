import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	outputDir: 'tests/e2e/test-failures',
	reporter: [['list']],
	workers: 1,
	globalSetup: require.resolve('./tests/e2e/utils/configs/setup.ts'),
	globalTeardown: require.resolve('./tests/e2e/utils/configs/teardown.ts'),
	use: {
		baseURL: process.env.ENTERPRISE ? 'http://localhost:4000' : 'http://localhost:3000',
		headless: true,
		viewport: { width: 1368, height: 768 },
		ignoreHTTPSErrors: true,
		video: 'retain-on-failure',
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
	},
	testDir: 'tests/e2e',
	retries: 3,
};
export default config;
