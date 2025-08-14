import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		browser: {
			fileParallelism: false,
			enabled: true,
			provider: 'playwright',
			headless: true,
			// https://vitest.dev/guide/browser/playwright
			instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
		},
	},
});
