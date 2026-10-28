import { expect, test, type BrowserContext, type Page } from '@playwright/test';

import { startHarnessServer, type TestWindow } from './harness';

// The tabs of one origin share one index: one leader tab runs the worker and owns the encrypted copy.
const NAMESPACE = 'https://chat.example';
const LOCK = `rc-e2ee-search:${NAMESPACE}`;
const NEEDLE = 'wombatglacierquill';
const LATER = 'narwhaltundrabloom';
const doc = (id: string, body: string) => ({ id, rid: 'r1', uid: 'u1', username: 'alice', ts: 1000, updatedAt: 1000, kind: 'text', body });

let server: { url: string; close: () => void };
let context: BrowserContext;
const tabs: { page: Page; backend: number }[] = [];

// Playwright's WebKit cannot store a CryptoKey in IndexedDB (UnknownError), so there the index is memory only and has no
// copy on disk to test. Safari itself stores CryptoKeys; this machine does not drive Safari.
const WEBKIT_MEMORY_ONLY = 'Playwright WebKit cannot store the CryptoKey in IndexedDB, so the index is memory only';

test.describe.configure({ mode: 'serial' });
test.skip(({ browserName }) => browserName === 'webkit', WEBKIT_MEMORY_ONLY);

test.beforeAll(async ({ browser }) => {
	server = await startHarnessServer();
	context = await browser.newContext();
	console.log(`${browser.browserType().name()} ${browser.version()}`);
});

test.afterAll(async () => {
	await context?.close();
	server?.close();
});

const openTab = async () => {
	const page = await context.newPage();
	page.on('console', (message) => console.log(`[tab ${tabs.length}] ${message.text()}`));
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchTest' in window);
	const backend = await page.evaluate((name) => (window as unknown as TestWindow).e2eeSearchTest.createShared(name), NAMESPACE);
	const tab = { page, backend };
	tabs.push(tab);
	return tab;
};

const call = ({ page, backend }: { page: Page; backend: number }, method: string, ...args: unknown[]) =>
	page.evaluate(([id, name, list]) => (window as unknown as TestWindow).e2eeSearchTest.call(id, name, list), [
		backend,
		method,
		args,
	] as const);

const isLeader = ({ page, backend }: { page: Page; backend: number }) =>
	page.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.isLeader(id), backend);

const ids = async (tab: { page: Page; backend: number }, text: string) =>
	((await call(tab, 'search', { text })) as { id: string }[]).map((hit) => hit.id);

// The holders and the waiters of the leader lock, and the number of workers that hold a file lock, seen from `page`.
const locks = (page: Page) =>
	page.evaluate(async (name) => {
		const { held = [], pending = [] } = await navigator.locks.query();
		return {
			leaders: held.filter((lock) => lock.name === name).length,
			waiting: pending.filter((lock) => lock.name === name).length,
			files: held.filter((lock) => lock.name?.startsWith('rc-e2ee-search-file:')).length,
		};
	}, LOCK);

test('elects one leader tab, and a write from the other tab is found in both tabs', async () => {
	const first = await openTab();
	const second = await openTab();
	await expect(call(first, 'open', { userId: 'u1' })).resolves.toEqual({ schemaVersion: 1, encryptedAtRest: true });
	await expect(call(second, 'open', { userId: 'u1' })).resolves.toEqual({ schemaVersion: 1, encryptedAtRest: true });

	const leaders = [await isLeader(first), await isLeader(second)];
	console.log(`leaders: ${JSON.stringify(leaders)}, locks: ${JSON.stringify(await locks(first.page))}`);
	expect(leaders.filter(Boolean)).toHaveLength(1);
	await expect(locks(first.page)).resolves.toEqual({ leaders: 1, waiting: 1, files: 1 });

	const follower = leaders[0] ? second : first;
	await call(follower, 'upsert', [doc('m1', `the ${NEEDLE} note`)]);

	expect(await ids(first, NEEDLE.slice(0, 6))).toEqual(['m1']);
	expect(await ids(second, NEEDLE.slice(0, 6))).toEqual(['m1']);
	await expect(call(follower, 'stats')).resolves.toEqual({ docs: 1, bytes: expect.any(Number), rooms: 1 });
});

test('moves the lock to the other tab when the leader tab closes, and that tab finds the earlier message', async () => {
	const leaderIndex = (await isLeader(tabs[0])) ? 0 : 1;
	const follower = tabs[1 - leaderIndex];
	// The follower asks the leader to save now, so the copy holds m1 before the leader tab closes.
	await follower.page.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.flush(id), follower.backend);
	await tabs[leaderIndex].page.close();

	const started = Date.now();
	await expect.poll(() => isLeader(follower), { timeout: 5000, intervals: [50] }).toBe(true);
	console.log(`takeover after ${Date.now() - started} ms`);

	expect(await ids(follower, NEEDLE)).toEqual(['m1']);
	await call(follower, 'upsert', [doc('m2', `the ${LATER} note`)]);
	expect(await ids(follower, LATER)).toEqual(['m2']);
	await expect(locks(follower.page)).resolves.toEqual({ leaders: 1, waiting: 0, files: 1 });
});

test('a tab that opens later joins as a follower of the new leader', async () => {
	const late = await openTab();
	await call(late, 'open', { userId: 'u1' });
	expect(await isLeader(late)).toBe(false);
	expect(await ids(late, LATER)).toEqual(['m2']);
});

test('refuses a second worker that opens the same encrypted copy', async () => {
	const { page } = tabs[tabs.length - 1];
	const direct = await page.evaluate((name) => (window as unknown as TestWindow).e2eeSearchTest.create(name), NAMESPACE);
	const error = await page.evaluate(
		(id) =>
			(window as unknown as TestWindow).e2eeSearchTest.call(id, 'open', [{ userId: 'u1' }]).then(
				() => 'opened',
				(reason: Error) => reason.message,
			),
		direct,
	);
	expect(error).toBe('E2EE search index is open in another worker');
	await expect(locks(page)).resolves.toMatchObject({ files: 1 });
});

test('keeps the key only as a non-extractable CryptoKey in IndexedDB: no key bytes in local storage or OPFS', async () => {
	const { page } = tabs[tabs.length - 1];
	const found = await page.evaluate(async () => {
		const db = await new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open('rc-e2ee-search-keys', 1);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		const keys = await new Promise<CryptoKey[]>((resolve, reject) => {
			const request = db.transaction('keys').objectStore('keys').getAll();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		db.close();
		const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search');
		const files: string[] = [];
		for await (const [name] of folder as unknown as AsyncIterable<[string]>) files.push(name);
		return {
			keys: await Promise.all(
				keys.map(async (key) => ({
					type: key.constructor.name,
					extractable: key.extractable,
					exportFails: await crypto.subtle.exportKey('raw', key).then(
						() => false,
						() => true,
					),
				})),
			),
			localStorage: localStorage.length,
			files,
		};
	});
	console.log(`key check: ${JSON.stringify(found)}`);
	expect(found.keys).toEqual([{ type: 'CryptoKey', extractable: false, exportFails: true }]);
	expect(found.localStorage).toBe(0);
	// The folder holds only the sealed copy: no key file, no plaintext database.
	expect(found.files).toHaveLength(1);
	expect(found.files[0]).toMatch(/^[0-9a-f]{64}\.db\.enc$/);

	await call(tabs[tabs.length - 1], 'wipe');
});
