import type { PlaywrightTestConfig } from '@playwright/test';

// Runs the E2EE search index specs against the browser backend in real browsers. They need no Rocket.Chat server.
// Chrome is the installed Google Chrome. WebKit is Playwright's WebKit build, the stand-in for Safari.
export default {
	testDir: '.',
	testMatch: '*.pw.ts',
	timeout: 60_000,
	use: { headless: true },
	projects: [
		{ name: 'chrome', use: { browserName: 'chromium', channel: 'chrome' } },
		{ name: 'firefox', use: { browserName: 'firefox' } },
		{ name: 'webkit', use: { browserName: 'webkit' } },
	],
	outputDir: '.playwright',
	reporter: [['list']],
} satisfies PlaywrightTestConfig;
