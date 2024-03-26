import * as fs from 'fs';
import * as path from 'path';

import AxeBuilder from '@axe-core/playwright';
import type { Locator, APIResponse, APIRequestContext } from '@playwright/test';
import { test as baseTest, request as baseRequest } from '@playwright/test';
import { v4 as uuid } from 'uuid';

import { BASE_API_URL, API_PREFIX, ADMIN_CREDENTIALS } from '../config/constants';
import { Users } from '../fixtures/userStates';

const PATH_NYC_OUTPUT = path.join(process.cwd(), '.nyc_output');

export type AnyObj = { [key: string]: any };

export type BaseTest = {
api: {
	recreateContext(): Promise<void>;
	login(credentials: { username: string; password: string }): Promise<APIRequestContext>;
	get(uri: string, params?: AnyObj, prefix?: string): Promise<APIResponse>;
	post(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
	put(uri: string, data: AnyObj, prefix?: string): Promise<APIResponse>;
	delete(uri: string, params?: AnyObj, prefix?: string): Promise<APIResponse>;
};
	makeAxeBuilder: () => AxeBuilder;
};
declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Window {
		collectIstanbulCoverage: (coverageJSON: string) => void;
		__coverage__: Record<string, unknown>;
	}
}

let apiContext: APIRequestContext;

export const test = baseTest.extend<BaseTest>({
	context: async ({ context }, use) => {
		if (!process.env.E2E_COVERAGE) {
			await use(context);
			await context.close();

			return;
		}

		await context.addInitScript(() =>
			window.addEventListener('beforeunload', () => window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))),
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
				await page.evaluate(() => window.collectIstanbulCoverage(JSON.stringify(window.__coverage__)));
				await page.close();
			}),
		);
	},

	api: async ({ request }, use) => {
		const login = async (credentials: { username: string; password: string }): Promise<APIRequestContext> => {
			if (credentials.username === Users.admin.data.username) {
				return baseRequest.newContext({
					baseURL: BASE_API_URL,
					extraHTTPHeaders: {
						'X-Auth-Token': Users.admin.data.loginToken,
						'X-User-Id': Users.admin.data.username,
					},
				});
			}

			const resp = await request.post(`${BASE_API_URL}/login`, { data: credentials });
			const json = await resp.json();

			return baseRequest.newContext({
				baseURL: BASE_API_URL,
				extraHTTPHeaders: {
					'X-Auth-Token': json.data.authToken,
					'X-User-Id': json.data.userId,
				},
			});
		};

		const recreateContext = async () => {
			apiContext = await login(ADMIN_CREDENTIALS);
		};

		if (!apiContext) {
			await recreateContext();
		}

		await use({
			recreateContext,
			login,
			get(uri: string, params?: AnyObj, prefix = API_PREFIX) {
				return apiContext.get(prefix + uri, { params });
			},
			post(uri: string, data: AnyObj, prefix = API_PREFIX) {
				return apiContext.post(prefix + uri, { data });
			},
			put(uri: string, data: AnyObj, prefix = API_PREFIX) {
				return apiContext.put(prefix + uri, { data });
			},
			delete(uri: string, params?: AnyObj, prefix = API_PREFIX) {
				return apiContext.delete(prefix + uri, { params });
			},
		});
	},
	makeAxeBuilder: async ({ page }, use) => {
		const SELECT_KNOW_ISSUES = ['aria-hidden-focus', 'nested-interactive']
    const makeAxeBuilder = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).include('body').disableRules([...SELECT_KNOW_ISSUES]);
    await use(makeAxeBuilder);
  }
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
