/* oxlint-disable react-hooks/rules-of-hooks */
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import AxeBuilder from '@axe-core/playwright';
import type { Locator, APIResponse, APIRequestContext } from '@playwright/test';
import { test as baseTest, request as baseRequest } from '@playwright/test';

import { BASE_URL, BASE_API_URL, API_PREFIX, ADMIN_CREDENTIALS } from '../config/constants';
import { Users } from '../fixtures/userStates';

const PATH_NYC_OUTPUT = path.join(process.cwd(), '.nyc_output');
const PATH_E2E_IMPACT = path.join(process.cwd(), '.e2e-impact');
const SERVER_COVERAGE_URL = `${BASE_URL}/__coverage__/functions`;

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
	serverCoverage: void;
};

type WorkerFixtures = {
	serverCoverageBaseline: void;
};
declare global {
	interface Window {
		collectIstanbulCoverage: (coverageJSON: string) => void;
		__coverage__: Record<string, unknown>;
	}
}

let apiContext: APIRequestContext;

const cacheFromCredentials = new Map<string, string>();

export const test = baseTest.extend<BaseTest, WorkerFixtures>({
	context: async ({ context }, use, testInfo) => {
		if (!process.env.E2E_COVERAGE) {
			await use(context);
			await context.close();

			return;
		}

		await context.addInitScript(() =>
			window.addEventListener('beforeunload', () => window.collectIstanbulCoverage(JSON.stringify(window.__coverage__))),
		);

		await fs.promises.mkdir(PATH_NYC_OUTPUT, { recursive: true });

		// Keeps each coverage file attributable to its spec, so CI can select specs by the code they exercise
		const spec = encodeURIComponent(path.relative(testInfo.project.testDir, testInfo.file));

		await context.exposeFunction('collectIstanbulCoverage', (coverageJSON: string) => {
			if (coverageJSON) {
				fs.writeFileSync(path.join(PATH_NYC_OUTPUT, `playwright_coverage_${spec}_${randomUUID()}.json`), coverageJSON);
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
	// Server code that runs before any spec, such as startup, belongs to no spec
	serverCoverageBaseline: [
		async ({ playwright }, use) => {
			if (process.env.E2E_COVERAGE) {
				const request = await playwright.request.newContext();
				await request.get(SERVER_COVERAGE_URL).catch(() => undefined);
				await request.dispose();
			}
			await use();
		},
		{ scope: 'worker', auto: true },
	],

	// Keeps the server files each test ran attributable to its spec, so CI can select specs by the server code they run
	serverCoverage: [
		async ({ request }, use, testInfo) => {
			await use();

			if (!process.env.E2E_COVERAGE) {
				return;
			}
			const response = await request.get(SERVER_COVERAGE_URL).catch(() => undefined);
			if (!response?.ok()) {
				return;
			}
			const spec = encodeURIComponent(path.relative(testInfo.project.testDir, testInfo.file));
			await fs.promises.mkdir(PATH_E2E_IMPACT, { recursive: true });
			await fs.promises.writeFile(path.join(PATH_E2E_IMPACT, `server_coverage_${spec}_${randomUUID()}.json`), await response.text());
		},
		{ auto: true },
	],

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
