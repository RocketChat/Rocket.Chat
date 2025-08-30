import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			include: ['src/*.ts'],
			exclude: ['src/__tests__/**'],
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
