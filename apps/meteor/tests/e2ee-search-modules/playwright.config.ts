import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: '.',
	testMatch: 'clientBrowser.pw.ts',
	timeout: 60_000,
	use: { browserName: 'chromium', channel: 'chrome', headless: true },
	outputDir: '../e2ee-search-browser/.playwright/client',
	reporter: [['list']],
});
