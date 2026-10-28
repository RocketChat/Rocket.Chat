import { expect, test, type Page } from '@playwright/test';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { startHarnessServer, type TestWindow } from './harness';
import {
	describeSearchIndexBackendContract,
	type SearchIndexBackendContractRunner,
} from '../../client/lib/e2eeSearch/searchIndexBackendContract';

let server: { url: string; close: () => void };
let page: Page;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
	server = await startHarnessServer();
	page = await browser.newPage();
	page.on('console', (message) => console.log(`[page] ${message.text()}`));
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchTest' in window);
	console.log(`${browser.browserType().name()} ${browser.version()}`);
});

test.afterAll(async () => {
	await page?.close();
	server?.close();
});

let backendCount = 0;

// A backend in the Chrome page, called from Node: each method call runs in the page and its worker. Each backend has
// its own namespace, so no test sees the encrypted copy that an earlier test left on disk.
const createBackend = async (): Promise<ISearchIndexBackend> => {
	const namespace = `contract-${backendCount++}`;
	const id = await page.evaluate((name) => (window as unknown as TestWindow).e2eeSearchTest.create(name), namespace);
	return new Proxy({} as ISearchIndexBackend, {
		get: (_target, method) =>
			method === 'then' || typeof method !== 'string'
				? undefined
				: (...args: unknown[]) =>
						page.evaluate(([backendId, name, list]) => (window as unknown as TestWindow).e2eeSearchTest.call(backendId, name, list), [
							id,
							method,
							args,
						] as const),
	});
};

// Playwright's WebKit cannot store a CryptoKey in IndexedDB (UnknownError), so there the index is memory only. Its
// open reports encryptedAtRest false, which storage.pw.ts checks. A memory-only index also drops its messages on
// close, so the case that reopens after a close cannot pass there. Every other case of the contract runs in WebKit.
const MEMORY_ONLY_SKIPS = [
	'opens as an index encrypted at rest',
	'closes the index without deleting it, so the same user finds the messages again after the next open',
];

describeSearchIndexBackendContract('SQLite WASM backend in a browser', createBackend, {
	describe: test.describe,
	it: (name, body) =>
		test(name, async ({ browserName }) => {
			test.skip(browserName === 'webkit' && MEMORY_ONLY_SKIPS.includes(name), 'Playwright WebKit keeps the index in memory only');
			await body();
		}),
	// Playwright's `expect` has the Jest matchers that the suite uses.
	expect: expect as unknown as SearchIndexBackendContractRunner['expect'],
	encryptedAtRest: true,
});
