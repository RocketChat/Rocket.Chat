import * as fs from 'fs';
import * as path from 'path';

import { v4 as uuid } from 'uuid';
import type { APIResponse } from '@playwright/test';
import { test as baseTest } from '@playwright/test';

import { BASE_API_URL, BASE_URL, API_PREFIX, ADMIN_CREDENTIALS } from '../config/constants';

const PATH_NYC_OUTPUT = path.join(process.cwd(), '.nyc_output');

export type AnyObj = { [key: string]: any };

export type BaseTest = {
	api: {
		get(uri: string, prefix?: string): Promise<APIResponse>;
		post(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
		put(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
		delete(uri: string, prefix?: string): Promise<APIResponse>;
	};
};

export const test = baseTest.extend<BaseTest>({
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

	api: async ({ request }, use) => {
		const resp = await request.post(`${BASE_API_URL}/login`, { data: ADMIN_CREDENTIALS });
		const json = await resp.json();

		const headers = {
			'X-Auth-Token': json.data.authToken,
			'X-User-Id': json.data.userId,
		};

		await use({
			get(uri: string, prefix = API_PREFIX) {
				return request.get(BASE_URL + prefix + uri, { headers });
			},
			post(uri: string, data: AnyObj, prefix = API_PREFIX) {
				return request.post(BASE_URL + prefix + uri, { headers, data });
			},
			put(uri: string, data: AnyObj, prefix = API_PREFIX) {
				return request.put(BASE_URL + prefix + uri, { headers, data });
			},
			delete(uri: string, prefix = API_PREFIX) {
				return request.delete(BASE_URL + prefix + uri, { headers });
			},
		});
	},
});

export const { expect } = test;
