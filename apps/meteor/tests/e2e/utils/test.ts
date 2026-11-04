/* oxlint-disable react-hooks/rules-of-hooks */
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import AxeBuilder from '@axe-core/playwright';
import type { BrowserContext, Locator, Page, APIResponse, APIRequestContext } from '@playwright/test';
import { test as baseTest, request as baseRequest } from '@playwright/test';

import { BASE_API_URL, API_PREFIX, ADMIN_CREDENTIALS } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { pagesNavigatingInClient } from '../page-objects/routed-page';

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
	interface Window {
		collectIstanbulCoverage: (coverageJSON: string) => void;
		__coverage__: Record<string, unknown>;
	}
}

export type TestOptions = {
	/**
	 * Keeps one page, and so one running client, for all the tests of a serial describe, instead of a fresh page per test.
	 * A failed test discards the page, so the next one starts from a fresh page.
	 */
	reusePage: boolean;
};

type WorkerFixtures = {
	sharedPage: { key?: string; page?: Page; release(): Promise<void> };
};

let apiContext: APIRequestContext;

const cacheFromCredentials = new Map<string, string>();

const instrumentCoverage = async (context: BrowserContext) => {
	await context.addInitScript(() =>
		window.addEventListener('beforeunload', () => window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))),
	);

	await fs.promises.mkdir(PATH_NYC_OUTPUT, { recursive: true });

	await context.exposeFunction('collectIstanbulCoverage', (coverageJSON: string) => {
		if (coverageJSON) {
			fs.writeFileSync(path.join(PATH_NYC_OUTPUT, `playwright_coverage_${randomUUID()}.json`), coverageJSON);
		}
	});
};

const collectCoverageAndClose = (context: BrowserContext) =>
	Promise.all(
		context.pages().map(async (page) => {
			await page.evaluate(() => window.collectIstanbulCoverage(JSON.stringify(window.__coverage__)));
			await page.close();
		}),
	);

export const test = baseTest.extend<BaseTest & TestOptions, WorkerFixtures>({
	reusePage: [false, { option: true }],

	sharedPage: [
		// oxlint-disable-next-line no-empty-pattern -- Playwright requires the fixtures argument to be destructured
		async ({}, use) => {
			const slot: WorkerFixtures['sharedPage'] = {
				async release() {
					const context = slot.page?.context();
					slot.key = undefined;
					slot.page = undefined;
					if (!context) {
						return;
					}
					if (process.env.E2E_COVERAGE) {
						await collectCoverageAndClose(context);
					}
					await context.close();
				},
			};
			await use(slot);
			await slot.release();
		},
		{ scope: 'worker' },
	],

	page: async ({ context, reusePage, sharedPage }, use) => {
		await use(reusePage && sharedPage.page ? sharedPage.page : await context.newPage());
	},

	context: async (
		{ context, reusePage, sharedPage, browser, baseURL, storageState, viewport, locale, timezoneId, permissions, ignoreHTTPSErrors },
		use,
		testInfo,
	) => {
		const key = `${testInfo.file}:${testInfo.titlePath.slice(0, -1).join(' > ')}`;
		if (!reusePage || sharedPage.key !== key) {
			// an idle shared page would keep its user online and subscribed while other tests run
			await sharedPage.release();
		}

		if (reusePage) {
			if (!sharedPage.page) {
				const shared = await browser.newContext({ baseURL, storageState, viewport, locale, timezoneId, permissions, ignoreHTTPSErrors });
				if (process.env.E2E_COVERAGE) {
					await instrumentCoverage(shared);
				}
				sharedPage.key = key;
				sharedPage.page = await shared.newPage();
				pagesNavigatingInClient.add(sharedPage.page);
			} else {
				// undo what a previous test may have changed on the page
				if (viewport) {
					await sharedPage.page.setViewportSize(viewport);
				}
				await sharedPage.page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
			}

			await use(sharedPage.page.context());

			if (testInfo.status !== testInfo.expectedStatus) {
				await sharedPage.release();
			}
			return;
		}

		if (!process.env.E2E_COVERAGE) {
			await use(context);
			await context.close();

			return;
		}

		await instrumentCoverage(context);

		await use(context);

		await collectCoverageAndClose(context);
	},

	api: async ({ request }, use) => {
		const newContext = async (token: string, userId: string) =>
			baseRequest.newContext({
				baseURL: BASE_API_URL,
				extraHTTPHeaders: {
					'X-Auth-Token': token,
					'X-User-Id': userId,
				},
			});

		const login = async (credentials: { username: string; password: string }): Promise<APIRequestContext> => {
			if (credentials.username === Users.admin.data.username) {
				return newContext(Users.admin.data.loginToken, Users.admin.data.username);
			}

			if (cacheFromCredentials.has(credentials.username + credentials.password)) {
				const token = cacheFromCredentials.get(credentials.username + credentials.password);
				return newContext(token!, credentials.username);
			}

			const resp = await request.post(`${BASE_API_URL}/login`, { data: credentials });
			const json = await resp.json();

			cacheFromCredentials.set(credentials.username + credentials.password, json.data.authToken);

			return newContext(json.data.authToken, json.data.userId);
		};

		const recreateContext = async () => {
			apiContext = await login(ADMIN_CREDENTIALS);
		};

		await recreateContext();

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
		const SELECT_KNOW_ISSUES = ['aria-hidden-focus', 'nested-interactive'];

		const makeAxeBuilder = () =>
			new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.include('body')
				.disableRules([...SELECT_KNOW_ISSUES]);
		await use(makeAxeBuilder);
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
