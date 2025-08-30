import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		browser: {
			fileParallelism: false,
			enabled: true,
			provider: 'playwright',
			// https://vitest.dev/guide/browser/playwright
			instances: [
				{ browser: 'chromium', headless: true },
				{ browser: 'firefox', headless: true },
				{ browser: 'webkit', headless: true },
			],
		},
	},
});
