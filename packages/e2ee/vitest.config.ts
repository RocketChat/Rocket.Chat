import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser/providers/playwright';
export default defineConfig({
	test: {
		includeTaskLocation: true,
		coverage: {
			provider: 'v8',
			include: ['src/*.ts'],
			exclude: ['src/__tests__/**'],
		},
		browser: {
			screenshotFailures: false,
			headless: true,
			enabled: true,
			provider: playwright(),
			isolate: false,
			// https://vitest.dev/guide/browser/playwright
			instances: [
				{ browser: 'chromium' },
				// { browser: 'firefox' },
				// { browser: 'webkit' }
			],
		},
	},
});
