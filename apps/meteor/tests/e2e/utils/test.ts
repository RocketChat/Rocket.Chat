import * as fs from 'fs';
import * as path from 'path';

import { v4 as uuid } from 'uuid';
import type { Locator, APIResponse } from '@playwright/test';
import { test as baseTest } from '@playwright/test';

import { BASE_API_URL, BASE_URL, API_PREFIX, ADMIN_CREDENTIALS } from '../config/constants';

const PATH_NYC_OUTPUT = path.join(process.cwd(), '.nyc_output');

export type AnyObj = { [key: string]: any };

export type BaseTest = {
	api: {
		login(credentials: { username: string; password: string }): Promise<void>;
		get(uri: string, params?: AnyObj, prefix?: string): Promise<APIResponse>;
		post(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
		put(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
		delete(uri: string, params?: AnyObj, prefix?: string): Promise<APIResponse>;
	};
};

const apiCredentials = {
	authToken: '',
	userId: '',
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
		const login = async (credentials: { username: string; password: string }) => {
			const resp = await request.post(`${BASE_API_URL}/login`, { data: credentials });
			const json = await resp.json();

			apiCredentials.authToken = json.data.authToken;
			apiCredentials.userId = json.data.userId;
		};

		if (!apiCredentials.authToken || !apiCredentials.userId) {
			await login(ADMIN_CREDENTIALS);
		}

		const headers = {
			'X-Auth-Token': apiCredentials.authToken,
			'X-User-Id': apiCredentials.userId,
		};

		await use({
			login,
			get(uri: string, params?: AnyObj, prefix = API_PREFIX) {
				return request.get(BASE_URL + prefix + uri, { headers, params });
			},
			post(uri: string, data: AnyObj, prefix = API_PREFIX) {
				return request.post(BASE_URL + prefix + uri, { headers, data });
			},
			put(uri: string, data: AnyObj, prefix = API_PREFIX) {
				return request.put(BASE_URL + prefix + uri, { headers, data });
			},
			delete(uri: string, params?: AnyObj, prefix = API_PREFIX) {
				return request.delete(BASE_URL + prefix + uri, { headers, params });
			},
		});
	},
});

export const { expect } = test;

expect.extend({
	async toBeInvalid(received: Locator) {
		try {
			await expect(received).toHaveAttribute('aria-invalid', 'true');

			return {
				message: () => `expected ${received} to be invalid`,
				pass: true,
			};
		} catch (error) {
			return {
				message: () => `expected ${received} to be invalid`,
				pass: false,
			};
		}
	},
	async toBeBusy(received: Locator) {
		try {
			await expect(received).toHaveAttribute('aria-busy', 'true');

			return {
				message: () => `expected ${received} to be busy`,
				pass: true,
			};
		} catch (error) {
			return {
				message: () => `expected ${received} to be busy`,
				pass: false,
			};
		}
	},
	async hasAttribute(received: Locator, attribute: string) {
		const pass = await received.evaluate((node, attribute) => node.hasAttribute(attribute), attribute);

		return {
			message: () => `expected ${received} to have attribute \`${attribute}\``,
			pass,
		};
	},
});
