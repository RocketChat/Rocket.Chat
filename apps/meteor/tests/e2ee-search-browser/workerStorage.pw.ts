import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

const WEBKIT_MEMORY_ONLY = 'Playwright WebKit cannot persist the index, so it keeps the index in memory only';

const FAULT_WORKER = `
{
self.storageFault = '';
const getDirectory = StorageManager.prototype.getDirectory;
StorageManager.prototype.getDirectory = function (...args) {
	if (self.storageFault === 'refused') return Promise.reject(new DOMException('injected storage refusal', 'SecurityError'));
	return getDirectory.apply(this, args);
};
const removeEntry = FileSystemDirectoryHandle.prototype.removeEntry;
FileSystemDirectoryHandle.prototype.removeEntry = function (...args) {
	if (self.storageFault === 'remove') return Promise.reject(new Error('injected removal failure'));
	return removeEntry.apply(this, args);
};
const createWritable = FileSystemFileHandle.prototype.createWritable;
FileSystemFileHandle.prototype.createWritable = function (...args) {
	if (self.storageFault === 'save') return Promise.reject(new Error('injected save failure'));
	return createWritable.apply(this, args);
};
const generateKey = SubtleCrypto.prototype.generateKey;
SubtleCrypto.prototype.generateKey = function (...args) {
	if (self.storageFault === 'key' && args[1] === true) return Promise.reject(new Error('injected data key failure'));
	return generateKey.apply(this, args);
};
self.addEventListener('message', (event) => {
	if (event.data.op !== 'testFault') return;
	event.stopImmediatePropagation();
	self.storageFault = event.data.fault;
	self.postMessage({ id: event.data.id, rows: [] });
});
}
`;

type WorkerWindow = Window & {
	workerCall: (request: Record<string, unknown>) => Promise<unknown[]>;
	workerKey: CryptoKey;
};

let server: { url: string; close: () => void };

test.beforeAll(async () => {
	const dist = resolve(__dirname, '../../../../packages/e2ee-search-worker/dist');
	const source = readFileSync(process.env.E2EE_WORKER_TEST_BUNDLE ?? resolve(dist, 'worker.mjs'), 'utf8');
	const constructor = "const newMemoryDb = async () => new (await sqlite3Ready).oo1.DB(':memory:', 'c');";
	expect(source).toContain(constructor);
	const worker = `${FAULT_WORKER}\n${source.replace(
		constructor,
		`const newMemoryDb = async () => {
			if (self.storageFault === 'database') throw new Error('injected database creation failure');
			return new (await sqlite3Ready).oo1.DB(':memory:', 'c');
		};`,
	)}\nself.postMessage({ ready: true });`;
	const wasm = readFileSync(resolve(dist, 'sqlite3.wasm'));
	const http = createServer((request, response) => {
		switch (new URL(request.url ?? '/', 'http://localhost').pathname) {
			case '/':
				response.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html>');
				break;
			case '/workers/e2ee-search/storage-fault-worker.mjs':
				response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(worker);
				break;
			case '/workers/e2ee-search/sqlite3.wasm':
				response.writeHead(200, { 'Content-Type': 'application/wasm' }).end(wasm);
				break;
			default:
				response.writeHead(404).end();
		}
	});
	await new Promise<void>((done) => http.listen(0, '127.0.0.1', done));
	const address = http.address();
	if (!address || typeof address === 'string') throw new Error('The worker test server has no TCP address');
	server = { url: `http://127.0.0.1:${address.port}/`, close: () => void http.close() };
});

test.afterAll(() => server?.close());

test.beforeEach(async ({ page }) => {
	await page.goto(server.url);
	await page.evaluate(async () => {
		const target = window as unknown as WorkerWindow;
		target.workerKey = await crypto.subtle.importKey('raw', new Uint8Array(32).fill(7), 'HKDF', false, ['deriveKey']);
		const worker = new Worker('/workers/e2ee-search/storage-fault-worker.mjs', { type: 'module' });
		let nextId = 0;
		const pending = new Map<number, { resolve: (rows: unknown[]) => void; reject: (error: Error) => void }>();
		const ready = new Promise<void>((resolveReady, rejectReady) => {
			worker.onerror = (event) => rejectReady(new Error(event.message));
			worker.onmessage = ({ data }) => {
				if (data.ready) return resolveReady();
				const call = pending.get(data.id);
				if (!call) return;
				pending.delete(data.id);
				if (data.error) call.reject(new Error(data.error));
				else call.resolve(data.rows);
			};
		});
		target.workerCall = (request) =>
			new Promise((resolveCall, reject) => {
				const id = nextId++;
				pending.set(id, { resolve: resolveCall, reject });
				worker.postMessage({ ...request, id, ...(request.op === 'open' ? { wrapKey: target.workerKey } : {}) });
			});
		await ready;
	});
});

const call = (page: Page, request: Record<string, unknown>) =>
	page.evaluate((message) => (window as unknown as WorkerWindow).workerCall(message), request);
const fault = (page: Page, value: string) => call(page, { op: 'testFault', fault: value });
const open = (page: Page, scopeId: string) => call(page, { op: 'open', scopeId });
const exec = (page: Page, sql: string, bind?: (string | number | null)[]) => call(page, { op: 'exec', sql, bind });

const fileLockHeld = (page: Page, scopeId: string) =>
	page.evaluate(async (id) => {
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id));
		const name = `${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}.db.enc`;
		return (await navigator.locks.query()).held?.some((lock) => lock.name === `rc-e2ee-search-file:${name}`) ?? false;
	}, scopeId);

test('rejects wipe failure after storage refusal followed by a successful persistent open', async ({ page, browserName }) => {
	test.skip(browserName === 'webkit', WEBKIT_MEMORY_ONLY);
	await fault(page, 'refused');
	await expect(open(page, 'refused')).resolves.toMatchObject([{ persistent: false }]);
	await fault(page, '');
	await expect(open(page, 'persistent')).resolves.toMatchObject([{ persistent: true }]);
	await exec(page, 'CREATE TABLE messages(body); INSERT INTO messages VALUES (1)');
	await call(page, { op: 'flush' });
	await fault(page, 'remove');
	await expect(call(page, { op: 'wipe', scopeId: 'persistent' })).rejects.toThrow('injected removal failure');
});

test('retains the old dirty database and lock when a scope switch cannot save it', async ({ page, browserName }) => {
	test.skip(browserName === 'webkit', WEBKIT_MEMORY_ONLY);
	await open(page, 'old');
	await exec(page, 'CREATE TABLE messages(body); INSERT INTO messages VALUES (42)');
	await fault(page, 'save');
	await expect(open(page, 'new')).rejects.toThrow('injected save failure');
	await expect(exec(page, 'SELECT body FROM messages')).resolves.toEqual([{ body: 42 }]);
	await expect(fileLockHeld(page, 'old')).resolves.toBe(true);
	await expect(fileLockHeld(page, 'new')).resolves.toBe(false);
	await fault(page, '');
	await call(page, { op: 'flush' });
	await open(page, 'new');
	await expect(open(page, 'old')).resolves.toMatchObject([{ persistent: true, restored: true }]);
	await expect(exec(page, 'SELECT body FROM messages')).resolves.toEqual([{ body: 42 }]);
});

for (const failure of ['key', 'database']) {
	test(`releases the lock and clears partial state after ${failure} creation fails`, async ({ page, browserName }) => {
		await fault(page, failure);
		await expect(open(page, failure)).rejects.toThrow(`injected ${failure === 'key' ? 'data key' : 'database creation'} failure`);
		await expect(fileLockHeld(page, failure)).resolves.toBe(false);
		await expect(exec(page, 'SELECT 1')).rejects.toThrow('index is not open');
		await fault(page, '');
		await expect(open(page, failure)).resolves.toMatchObject([{ persistent: browserName !== 'webkit' }]);
	});
}

test('releases the lock after corrupt file removal fails and permits retry', async ({ page, browserName }) => {
	test.skip(browserName === 'webkit', WEBKIT_MEMORY_ONLY);
	await open(page, 'corrupt');
	await exec(page, 'CREATE TABLE messages(body)');
	await call(page, { op: 'close', scopeId: 'corrupt' });
	await page.evaluate(async () => {
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('corrupt'));
		const name = `${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}.db.enc`;
		const folder = await (await navigator.storage.getDirectory()).getDirectoryHandle('e2ee-search');
		const writable = await (await folder.getFileHandle(name)).createWritable();
		await writable.write(new Uint8Array([0]));
		await writable.close();
	});
	await fault(page, 'remove');
	await expect(open(page, 'corrupt')).rejects.toThrow('injected removal failure');
	await expect(fileLockHeld(page, 'corrupt')).resolves.toBe(false);
	await expect(exec(page, 'SELECT 1')).rejects.toThrow('index is not open');
	await fault(page, '');
	await expect(open(page, 'corrupt')).resolves.toMatchObject([{ persistent: true, evicted: true }]);
});

test('requires a wipe scope ID and leaves the active database open on invalid requests', async ({ page }) => {
	await open(page, 'active');
	await exec(page, 'CREATE TABLE messages(body); INSERT INTO messages VALUES (3)');
	await expect(call(page, { op: 'wipe' })).rejects.toThrow('wipe requires a scope ID');
	await expect(exec(page, 'SELECT body FROM messages')).resolves.toEqual([{ body: 3 }]);
	await call(page, { op: 'wipe', scopeId: 'other' });
	await expect(exec(page, 'SELECT body FROM messages')).resolves.toEqual([{ body: 3 }]);
	await call(page, { op: 'wipe', scopeId: 'active' });
	await expect(exec(page, 'SELECT 1')).rejects.toThrow('index is not open');
});

for (const mutation of [
	{
		name: 'insert',
		sql: 'SELECT body FROM messages; INSERT INTO messages VALUES (?)',
		bind: [7],
		query: 'SELECT body FROM messages',
		rows: [{ body: 7 }],
	},
	{
		name: 'schema',
		sql: 'SELECT body FROM messages; CREATE TABLE added(value)',
		query: "SELECT name FROM sqlite_schema WHERE name = 'added'",
		rows: [{ name: 'added' }],
	},
	{
		name: 'partial failure',
		sql: 'SELECT body FROM messages; INSERT INTO messages VALUES (9); SELECT * FROM missing',
		query: 'SELECT body FROM messages',
		rows: [{ body: 9 }],
	},
]) {
	test(`saves ${mutation.name} after a SELECT in a multi-statement exec`, async ({ page, browserName }) => {
		test.skip(browserName === 'webkit', WEBKIT_MEMORY_ONLY);
		await open(page, mutation.name);
		await exec(page, 'CREATE TABLE messages(body)');
		await call(page, { op: 'flush' });
		const result = exec(page, mutation.sql, mutation.bind);
		if (mutation.name === 'partial failure') await expect(result).rejects.toThrow('no such table');
		else await expect(result).resolves.toEqual([]);
		await call(page, { op: 'close', scopeId: mutation.name });
		await expect(open(page, mutation.name)).resolves.toMatchObject([{ restored: true }]);
		await expect(exec(page, mutation.query)).resolves.toEqual(mutation.rows);
	});
}

test('keeps memory-only SQL usable when storage is refused and clears the session on wipe', async ({ page }) => {
	await fault(page, 'refused');
	await expect(open(page, 'memory')).resolves.toMatchObject([{ persistent: false }]);
	await exec(page, 'CREATE TABLE messages(body)');
	await exec(page, 'SELECT body FROM messages; INSERT INTO messages VALUES (?)', [13]);
	await expect(exec(page, 'SELECT body FROM messages')).resolves.toEqual([{ body: 13 }]);
	await expect(call(page, { op: 'flush' })).resolves.toEqual([]);
	await expect(call(page, { op: 'wipe', scopeId: 'memory' })).resolves.toEqual([]);
	await expect(exec(page, 'SELECT 1')).rejects.toThrow('index is not open');
});

test('preserves read-only SQL with semicolons in literals and comments without saving again', async ({ page }) => {
	await open(page, 'read');
	await exec(page, 'CREATE TABLE messages(body)');
	await call(page, { op: 'flush' });
	await fault(page, 'save');
	await expect(exec(page, "SELECT '; INSERT INTO messages VALUES (1)' AS body /* ; DROP TABLE messages */; SELECT 2")).resolves.toEqual([
		{ body: '; INSERT INTO messages VALUES (1)' },
	]);
	await expect(call(page, { op: 'flush' })).resolves.toEqual([]);
});
