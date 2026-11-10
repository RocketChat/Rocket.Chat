import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The directory of the consuming package (i.e. where playwright is invoked from)
const packageDir = process.env.PACKAGE_DIR ?? process.cwd();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:6006';

export default defineConfig({
	testDir: path.join(__dirname, 'test'),
	fullyParallel: true,
	workers: process.env.CI ? 2 : 4,
	snapshotPathTemplate: path.join(packageDir, 'test/snapshots/{arg}-{projectName}.png'),
	outputDir: path.join(packageDir, 'test-results'),
	reporter: process.env.CI ? 'html' : 'dot',
	use: {
		baseURL: BASE_URL,
	},
	projects: [
		{
			name: 'desktop',
			use: {
				...devices['Desktop Chrome'],
				launchOptions: {
					args: [
						'--disable-lcd-text',
						'--font-render-hinting=none',
						'--disable-skia-runtime-opts',
						'--disable-font-subpixel-positioning',
						'--disable-accelerated-2d-canvas',
						'--disable-gpu',
					],
				},
			},
		},
	],
});
