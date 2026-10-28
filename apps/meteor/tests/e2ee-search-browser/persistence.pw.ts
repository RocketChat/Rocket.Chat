import { expect, test, type Page } from '@playwright/test';

import { startHarnessServer, type TestWindow } from './harness';

// The browser index keeps an encrypted copy in OPFS under a non-extractable key in IndexedDB.
const NEEDLE = 'quokkazebrafjord';
const DOC = { id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1000, updatedAt: 1000, kind: 'text', body: `the ${NEEDLE} test` };

let server: { url: string; close: () => void };
let page: Page;

// Playwright's WebKit cannot store a CryptoKey in IndexedDB (UnknownError), so there the index is memory only and has no
// copy on disk to test. Safari itself stores CryptoKeys; this machine does not drive Safari.
const WEBKIT_MEMORY_ONLY = 'Playwright WebKit cannot store the CryptoKey in IndexedDB, so the index is memory only';

test.describe.configure({ mode: 'serial' });
test.skip(({ browserName }) => browserName === 'webkit', WEBKIT_MEMORY_ONLY);

test.beforeAll(async ({ browser }) => {
	server = await startHarnessServer();
	page = await browser.newPage();
	page.on('console', (message) => console.log(`[page] ${message.text()}`));
	console.log(`${browser.browserType().name()} ${browser.version()}`);
});

test.afterAll(async () => {
	await page?.close();
	server?.close();
});

const load = async () => {
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchTest' in window);
};

const create = (namespace: string) => page.evaluate((name) => (window as unknown as TestWindow).e2eeSearchTest.create(name), namespace);

const call = (id: number, method: string, ...args: unknown[]) =>
	page.evaluate(([backendId, name, list]) => (window as unknown as TestWindow).e2eeSearchTest.call(backendId, name, list), [
		id,
		method,
		args,
	] as const);

const flush = (id: number) => page.evaluate((backendId) => (window as unknown as TestWindow).e2eeSearchTest.flush(backendId), id);

// Every file in the index folder of OPFS, with a flag that says whether its bytes hold `text` as UTF-8.
const opfsFiles = (text: string) =>
	page.evaluate(async (needle) => {
		const root = await navigator.storage.getDirectory();
		let folder: FileSystemDirectoryHandle;
		try {
			folder = await root.getDirectoryHandle('e2ee-search');
		} catch {
			return [];
		}
		const wanted = new TextEncoder().encode(needle);
		const holds = (bytes: Uint8Array) => {
			outer: for (let i = 0; i + wanted.length <= bytes.length; i++) {
				for (let j = 0; j < wanted.length; j++) if (bytes[i + j] !== wanted[j]) continue outer;
				return true;
			}
			return false;
		};
		const files: { name: string; size: number; holdsText: boolean }[] = [];
		for await (const [name, handle] of folder as unknown as AsyncIterable<[string, FileSystemFileHandle]>) {
			const bytes = new Uint8Array(await (await handle.getFile()).arrayBuffer());
			files.push({ name, size: bytes.length, holdsText: holds(bytes) });
		}
		return files;
	}, text);

// The keys in IndexedDB: for each one, whether it is extractable and whether exportKey fails.
const storedKeys = () =>
	page.evaluate(async () => {
		const db = await new Promise<IDBDatabase>((resolve, reject) => {
			const request = indexedDB.open('rc-e2ee-search-keys', 1);
			request.onupgradeneeded = () => request.result.createObjectStore('keys');
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		const keys = await new Promise<CryptoKey[]>((resolve, reject) => {
			const request = db.transaction('keys').objectStore('keys').getAll();
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		db.close();
		return Promise.all(
			keys.map(async (key) => ({
				type: key.constructor.name,
				extractable: key.extractable,
				exportFails: await crypto.subtle.exportKey('raw', key).then(
					() => false,
					() => true,
				),
			})),
		);
	});

test('finds a message after a page reload from the encrypted copy, with no crawl', async () => {
	await load();
	const first = await create('https://chat.example');
	await expect(call(first, 'open', { userId: 'u1' })).resolves.toEqual({ schemaVersion: 1, encryptedAtRest: true });
	await call(first, 'upsert', [DOC]);
	await flush(first);

	await load();
	const second = await create('https://chat.example');
	await call(second, 'open', { userId: 'u1' });

	const hits = (await call(second, 'search', { text: NEEDLE.slice(0, 7) })) as { id: string }[];
	expect(hits.map((hit) => hit.id)).toEqual(['m1']);
});

test('keeps no plaintext in OPFS: the byte scan finds the needle only in a plaintext control file', async () => {
	await page.evaluate(async (needle) => {
		const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search', { create: true });
		const writable = await (await folder.getFileHandle('plaintext-control.txt', { create: true })).createWritable();
		await writable.write(`control ${needle} control`);
		await writable.close();
	}, NEEDLE);

	const files = await opfsFiles(NEEDLE);
	console.log(`OPFS files: ${JSON.stringify(files)}`);
	expect(files.find((file) => file.name === 'plaintext-control.txt')?.holdsText).toBe(true);
	const index = files.filter((file) => file.name.endsWith('.db.enc'));
	expect(index).toHaveLength(1);
	expect(index[0].size).toBeGreaterThan(4096);
	expect(index[0].holdsText).toBe(false);
	// The file name does not show the server or the user.
	expect(index[0].name).toMatch(/^[0-9a-f]{64}\.db\.enc$/);

	await page.evaluate(async () =>
		(await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search')).removeEntry('plaintext-control.txt'),
	);
});

test('seals the copy under a non-extractable key kept in IndexedDB', async () => {
	await expect(storedKeys()).resolves.toEqual([{ type: 'CryptoKey', extractable: false, exportFails: true }]);
});

test('keeps the index of each server and user apart', async () => {
	const other = await create('https://other.example');
	await call(other, 'open', { userId: 'u1' });
	await expect(call(other, 'search', { text: NEEDLE })).resolves.toEqual([]);
	await call(other, 'upsert', [{ ...DOC, body: 'other server words' }]);
	await flush(other);
	expect((await opfsFiles(NEEDLE)).filter((file) => file.name.endsWith('.db.enc'))).toHaveLength(2);
	await call(other, 'wipe');
});

test('deletes the OPFS file and the IndexedDB key on wipe', async () => {
	await load();
	const backend = await create('https://chat.example');
	await call(backend, 'open', { userId: 'u1' });
	await call(backend, 'wipe');

	await expect(opfsFiles(NEEDLE)).resolves.toEqual([]);
	await expect(storedKeys()).resolves.toEqual([]);
});

test('deletes the copy of a user whose index is not open, by scope', async () => {
	await load();
	const first = await create('https://chat.example');
	await call(first, 'open', { userId: 'u9' });
	await call(first, 'upsert', [DOC]);
	await flush(first);

	await load();
	const second = await create('https://chat.example');
	await call(second, 'wipe', { userId: 'u9' });

	await expect(opfsFiles(NEEDLE)).resolves.toEqual([]);
	await expect(storedKeys()).resolves.toEqual([]);
});
