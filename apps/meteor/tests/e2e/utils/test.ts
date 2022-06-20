import * as fs from 'fs';
import * as path from 'path';

import { v4 as uuid } from 'uuid';
import { test as baseTest } from '@playwright/test';

const PATH_NYC_OUTPUT = path.join(process.cwd(), '.nyc_output');

export const test = baseTest.extend({
	context: async ({ context }, use) => {
		if (!process.env.E2E_COVERAGE) {
			await use(context);
			await context.close();

			return;
		}

		await context.addInitScript(() =>
			window.addEventListener('beforeunload', () => (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__))),
		);

		await fs.promises.mkdir(PATH_NYC_OUTPUT, { recursive: true });

		await context.exposeFunction('collectIstanbulCoverage', (coverageJSON: string) => {
			if (coverageJSON) {
				fs.writeFileSync(path.join(PATH_NYC_OUTPUT, `playwright_coverage_${uuid()}.json`), coverageJSON);
			}
		});

		await use(context);

		await Promise.all(
			context.pages().map(async (page) => {
				await page.evaluate(() => (window as any).collectIstanbulCoverage(JSON.stringify((window as any).__coverage__)));
				await page.close();
			}),
		);
	},
});

export const { expect } = test;
