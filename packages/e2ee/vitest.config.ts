import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			exclude: ['**/__tests__/**'],
		},
		browser: {
			screenshotFailures: false,
			headless: true,
			enabled: true,
			provider: 'playwright',
			// https://vitest.dev/guide/browser/playwright
			instances: [{ browser: 'chromium' }],
		},
	},
});
