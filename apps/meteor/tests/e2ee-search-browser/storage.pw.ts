import { expect, test, type Page } from '@playwright/test';

import { startHarnessServer, wrapKey, type TestWindow } from './harness';

// What the browser index does when the browser keeps, evicts or refuses its storage.
const NEEDLE = 'pangolinmesaquartz';
const DOC = { id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1000, updatedAt: 1000, kind: 'text', body: `the ${NEEDLE} test` };
const REFUSED_STORAGE_WORKER = '/test/refused-storage-worker.mjs';

let server: { url: string; close: () => void };
let page: Page;
const logs: string[] = [];

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser, browserName }) => {
	server = await startHarnessServer();
	page = await browser.newPage();
	page.on('console', (message) => {
		logs.push(message.text());
		console.log(`[page] ${message.text()}`);
	});
	console.log(`${browserName} ${browser.version()}`);
});

test.afterAll(async () => {
	await page?.close();
	server?.close();
});

const load = async (target = page) => {
	await target.goto(server.url);
	await target.waitForFunction(() => 'e2eeSearchTest' in window);
};

const create = (namespace: string, workerUrl?: string) =>
	page.evaluate(([name, url]) => (window as unknown as TestWindow).e2eeSearchTest.create(name, url), [namespace, workerUrl] as const);

const call = (id: number, method: string, ...args: unknown[]) =>
	page.evaluate(([backendId, name, list]) => (window as unknown as TestWindow).e2eeSearchTest.call(backendId, name, list), [
		id,
		method,
		args,
	] as const);

const flush = (id: number) => page.evaluate((backendId) => (window as unknown as TestWindow).e2eeSearchTest.flush(backendId), id);

const indexFiles = () =>
	page.evaluate(async () => {
		try {
			const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search');
			const names: string[] = [];
			for await (const [name] of folder as unknown as AsyncIterable<[string, FileSystemHandle]>) names.push(name);
			return names.filter((name) => name.endsWith('.db.enc'));
		} catch {
			return [];
		}
	});

// Deletes every saved copy of the index and keeps the keys, as a browser does when it evicts or clears OPFS.
const evictCopies = () =>
	page.evaluate(async () => {
		const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search');
		const names: string[] = [];
		for await (const [name] of folder as unknown as AsyncIterable<[string, FileSystemHandle]>) names.push(name);
		await Promise.all(names.map((name) => folder.removeEntry(name)));
		return names.length;
	});

const hitIds = async (id: number) => ((await call(id, 'search', { text: NEEDLE.slice(0, 8) })) as { id: string }[]).map((hit) => hit.id);

let savesToDisk = false;

test('asks the browser once to keep its storage persistent, and logs the answer', async ({ browserName }) => {
	await load();
	const backend = await create('https://persist.example');
	const opened = (await call(backend, 'open', { userId: 'u1', wrapKey: wrapKey() })) as { encryptedAtRest: boolean };
	savesToDisk = opened.encryptedAtRest;
	console.log(`encryptedAtRest: ${savesToDisk}`);
	// Playwright's WebKit cannot store a CryptoKey in IndexedDB, so it must fall back to memory only, not fail.
	expect(savesToDisk).toBe(browserName !== 'webkit');
	test.skip(!savesToDisk, 'this browser keeps the index in memory only, so it does not ask for persistent storage');

	const requests = () => logs.filter((line) => line === 'E2EE search index: persistent storage requested');
	const answers = () => logs.filter((line) => /^E2EE search index: persistent storage (granted|not granted)$/.test(line));
	expect(requests()).toHaveLength(1);
	// Firefox answers only after the user answers its prompt, and a headless browser shows no prompt.
	if (browserName !== 'firefox') await expect.poll(() => answers().length).toBe(1);
	// A second open on the same page does not ask again.
	await call(backend, 'open', { userId: 'u2', wrapKey: wrapKey() });
	await page.waitForTimeout(500);
	expect(requests()).toHaveLength(1);
	expect(answers().length).toBeLessThanOrEqual(1);
	await call(backend, 'wipe');
});

test('reports an evicted copy, starts empty with no room state, and finds the message again after the backfill', async () => {
	test.skip(!savesToDisk, 'this browser keeps the index in memory only, so nothing can be evicted');
	await load();
	const first = await create('https://evict.example');
	await call(first, 'open', { userId: 'u1', wrapKey: wrapKey() });
	await call(first, 'upsert', [DOC]);
	await call(first, 'setRoomState', 'r1', { lastUpdate: 5, backfillDone: true });
	await flush(first);
	expect(await evictCopies()).toBeGreaterThan(0);

	await load();
	logs.length = 0;
	const second = await create('https://evict.example');
	await expect(call(second, 'open', { userId: 'u1', wrapKey: wrapKey() })).resolves.toMatchObject({
		schemaVersion: 1,
		encryptedAtRest: true,
	});
	expect(logs).toContain('E2EE search index: the saved copy is gone, the index is built again');
	await expect(hitIds(second)).resolves.toEqual([]);
	// No room state means the crawler treats every room as not indexed and backfills it from the start.
	await expect(call(second, 'getRoomState', 'r1')).resolves.toBeUndefined();

	// The backfill writes the message again, and the new copy comes back after a reload.
	await call(second, 'upsert', [DOC]);
	await expect(hitIds(second)).resolves.toEqual(['m1']);
	await flush(second);
	await load();
	logs.length = 0;
	const third = await create('https://evict.example');
	await call(third, 'open', { userId: 'u1', wrapKey: wrapKey() });
	await expect(hitIds(third)).resolves.toEqual(['m1']);
	expect(logs).not.toContain('E2EE search index: the saved copy is gone, the index is built again');
	await call(third, 'wipe');
});

test('does not report an eviction on the first open of a new user', async () => {
	test.skip(!savesToDisk, 'this browser keeps the index in memory only');
	await load();
	logs.length = 0;
	const backend = await create('https://fresh.example');
	await call(backend, 'open', { userId: 'u1', wrapKey: wrapKey() });
	expect(logs).not.toContain('E2EE search index: the saved copy is gone, the index is built again');
	await call(backend, 'wipe');
});

test('does not report an eviction when the tab closed before the first copy was saved', async () => {
	test.skip(!savesToDisk, 'this browser keeps the index in memory only');
	await load();
	const first = await create('https://quick-close.example');
	await call(first, 'open', { userId: 'u1', wrapKey: wrapKey() });
	await load();
	await expect(indexFiles()).resolves.toEqual([]);
	logs.length = 0;
	const second = await create('https://quick-close.example');
	await call(second, 'open', { userId: 'u1', wrapKey: wrapKey() });
	expect(logs).not.toContain('E2EE search index: the saved copy is gone, the index is built again');
	await call(second, 'wipe');
});

test('keeps the index in memory when the browser refuses its storage, and still finds messages', async () => {
	await load();
	const before = await indexFiles();
	const backend = await create('https://refused.example', REFUSED_STORAGE_WORKER);
	await expect(call(backend, 'open', { userId: 'u1', wrapKey: wrapKey() })).resolves.toMatchObject({
		schemaVersion: 1,
		encryptedAtRest: false,
	});
	await call(backend, 'upsert', [DOC]);
	await expect(hitIds(backend)).resolves.toEqual(['m1']);
	await flush(backend);
	await expect(indexFiles()).resolves.toEqual(before);
	await call(backend, 'wipe');
});

test('gives no backend in a browser without WebAssembly or workers', async ({ browser }) => {
	await load();
	await expect(page.evaluate(() => (window as unknown as TestWindow).e2eeSearchTest.canRun())).resolves.toBe(true);

	for (const missing of ['WebAssembly', 'Worker']) {
		const stripped = await browser.newPage();
		await stripped.addInitScript((name) => {
			delete (window as unknown as Record<string, unknown>)[name];
		}, missing);
		await load(stripped);
		await expect(
			stripped.evaluate(() => (window as unknown as TestWindow).e2eeSearchTest.canRun()),
			missing,
		).resolves.toBe(false);
		await stripped.close();
	}
});
