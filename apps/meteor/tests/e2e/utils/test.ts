/* eslint-disable react-hooks/rules-of-hooks */
import * as fs from 'fs';
import * as path from 'path';

import AxeBuilder from '@axe-core/playwright';
import type { Locator, APIResponse, APIRequestContext } from '@playwright/test';
import { test as baseTest, request as baseRequest } from '@playwright/test';
import { v4 as uuid } from 'uuid';
import v8toIstanbul from 'v8-to-istanbul';

import { BASE_API_URL, API_PREFIX, ADMIN_CREDENTIALS } from '../config/constants';
import { Users } from '../fixtures/userStates';

const PATH_NYC_OUTPUT = path.join(process.cwd(), '.nyc_output');
const PATH_LOG_DATA = path.join(process.cwd(), '.log_data');

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
		// collectIstanbulCoverage: (coverageJSON: string) => void;
		getCoverage: () => Array<unknown>;
		__coverage__: Record<string, unknown>;
	}
}

let apiContext: APIRequestContext;

const cacheFromCredentials = new Map<string, string>();

export const test = baseTest.extend<BaseTest>({
	// TODO: if the page is created from the browser fixture, it does not trigger coverage.
	// browser: async ({ browser }, use) => {
	// 	browser.contexts().forEach((context) => {
	// 		context.on('page', (page) => {
	// 			start coverage here
	// 		});
	// 	});
	// 	await use(browser);
	// },
	context: async ({ context }, use) => {
		if (!process.env.E2E_COVERAGE) {
			await use(context);
			await context.close();

			return;
		}

		context.on('page', async (page) => {
			await page.coverage.startJSCoverage();
		});

		await fs.promises.mkdir(PATH_NYC_OUTPUT, { recursive: true });
		await fs.promises.mkdir(PATH_LOG_DATA, { recursive: true });

		await use(context);

		await Promise.all(
			context.pages().map(async (page) => {
				const coverage = await page.coverage.stopJSCoverage();

				const entries = [];
				const paths: Record<string, any> = {};
				const errors: Record<string, any> = [];
				for await (const entry of coverage) {
					if (!entry.url || !entry.source) {
						continue;
					}

					// I'm not sure why but some scripts point to a server URL instead of a path.
					if (entry.url.includes('http:') || entry.url.includes('https:') || entry.url.includes('node_modules')) {
						continue;
					}

					const pathToSource = path.join(process.cwd(), 'bundle/programs/web.browser/dynamic/', `${entry.url}`);
					const pathToSourceMap = `${pathToSource}.map`;

					paths[entry.url] = {
						cwd: process.cwd(),
						pathToSource,
						pathToSourceMap,
					};

					let sourceMapFile;
					try {
						let file = fs.readFileSync(pathToSourceMap, 'utf8');
						// Strip XSSI protection prefix if present ()]}' at the start of the file)
						if (file.startsWith(")]}'")) {
							file = file.slice(5);
						}
						sourceMapFile = JSON.parse(file);
					} catch (error) {
						console.warn('Error reading source map file', pathToSourceMap, error);
						errors.push({ error, pathToSourceMap, cwd: process.cwd() });
						continue;
					}

					// Some source maps (like .css or empty files) don't have any sources, so we skip them to avoid `v8toIstanbul` throwing an error
					if (sourceMapFile.sources.length < 1) {
						continue;
					}

					sourceMapFile.sources = sourceMapFile.sources.map((source: string) => {
						return source.replace('meteor://💻app', process.cwd()); // TODO: this is breaking the file path, I'm not sure why the sources property has this prefix or how to remove it during the build process
					});

					const converter = v8toIstanbul('', 0, {
						source: entry.source,
						sourceMap: { sourcemap: sourceMapFile },
					});
					try {
						await converter.load();
						converter.applyCoverage(entry.functions);
						entries.push(converter.toIstanbul());
					} catch (error) {
						console.warn('Error generating coverage for', entry.url);
						continue;
					}
				}

				fs.writeFileSync(
					path.join(PATH_NYC_OUTPUT, `playwright_coverage_${uuid()}.json`),
					JSON.stringify(Object.fromEntries(entries.flatMap((entry) => Object.entries(entry)))),
				);

				fs.writeFileSync(path.join(PATH_LOG_DATA, `playwright_paths_${uuid()}.json`), JSON.stringify(paths));
				fs.writeFileSync(path.join(PATH_LOG_DATA, `playwright_errors_${uuid()}.json`), JSON.stringify(errors));

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
