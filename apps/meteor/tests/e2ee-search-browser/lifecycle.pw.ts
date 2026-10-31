import { expect, test, type Page } from '@playwright/test';

import { startHarnessServer, type TestWindow } from './harness';

let server: Awaited<ReturnType<typeof startHarnessServer>>;
test.beforeAll(async () => {
	server = await startHarnessServer();
});
test.afterAll(() => server?.close());
const load = async (page: Page) => {
	await page.goto(server.url);
	await page.waitForFunction(() => 'e2eeSearchTest' in window);
};
const call = (page: Page, id: number, method: string, ...args: unknown[]) =>
	page.evaluate(([id, method, args]) => (window as unknown as TestWindow).e2eeSearchTest.call(id, method, args), [
		id,
		method,
		args,
	] as const);
const open = (page: Page, id: number, key = 7) => call(page, id, 'open', { userId: 'u', wrapKey: new Uint8Array(32).fill(key) });
const document = { id: 'm', rid: 'r', uid: 'u', username: 'alice', ts: 1, updatedAt: 1, kind: 'text', body: 'needle' };

test('isolates a live follower with another key and delivers change events only to the active session', async ({ context }) => {
	const leader = await context.newPage();
	const follower = await context.newPage();
	await load(leader);
	await load(follower);
	const a = await leader.evaluate(() => (window as unknown as TestWindow).e2eeSearchTest.createShared('two-keys'));
	const b = await follower.evaluate(() => (window as unknown as TestWindow).e2eeSearchTest.createShared('two-keys'));
	await open(leader, a);
	await call(leader, a, 'upsert', [document]);
	await expect(open(follower, b, 9)).resolves.toMatchObject({ locked: true });
	await expect(call(follower, b, 'search', { text: 'needle' })).rejects.toThrow('not open');
	await expect(call(follower, b, 'upsert', [document])).rejects.toThrow('not open');
	await expect(call(leader, a, 'search', { text: 'needle' })).resolves.toHaveLength(1);
	await open(follower, b);
	await follower.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.watch(id), b);
	await call(leader, a, 'remove', ['m']);
	await expect
		.poll(() => follower.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.events(id), b))
		.toContainEqual({ type: 'changed' });
	await call(follower, b, 'close');
	const count = await follower.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.events(id).length, b);
	await call(leader, a, 'upsert', [document]);
	await open(follower, b);
	await call(follower, b, 'search', { text: 'needle' });
	expect(await follower.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.events(id).length, b)).toBe(count);
	await call(follower, b, 'close');
	await call(leader, a, 'wipe');
	await call(leader, a, 'close');
	await leader.close();
	await follower.close();
});

test('signals memory-only index loss and clears checkpoints after leader replacement without an app recovery policy', async ({
	context,
}) => {
	const leader = await context.newPage();
	const follower = await context.newPage();
	await load(leader);
	await load(follower);
	const create = (page: Page) =>
		page.evaluate(() =>
			(window as unknown as TestWindow).e2eeSearchTest.createShared('memory-handover', '/test/refused-storage-worker.mjs'),
		);
	const a = await create(leader);
	const b = await create(follower);
	await expect(open(leader, a)).resolves.toMatchObject({ encryptedAtRest: false });
	await open(follower, b);
	await call(leader, a, 'upsert', [document]);
	await call(leader, a, 'setRoomState', 'r', { lastUpdate: 100, backfillDone: true });
	await follower.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.watch(id), b);
	await leader.close();
	await expect.poll(() => follower.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.isLeader(id), b)).toBe(true);
	await expect(call(follower, b, 'search', { text: 'needle' })).resolves.toEqual([]);
	await expect
		.poll(() => follower.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.events(id), b))
		.toContainEqual({ type: 'lost' });
	await expect(call(follower, b, 'getRoomState', 'r')).resolves.toBeUndefined();
	await call(follower, b, 'close');
	await follower.close();
});

test('retains saved documents but invalidates restored checkpoints after persistent worker replacement', async ({ page, browserName }) => {
	test.skip(browserName === 'webkit', 'Playwright WebKit cannot persist the device key');
	await load(page);
	const id = await page.evaluate(async (doc) => {
		const NativeWorker = Worker;
		const workers: Worker[] = [];
		window.Worker = class extends NativeWorker {
			constructor(url: string | URL, options?: WorkerOptions) {
				super(url, options);
				workers.push(this);
			}
		};
		const api = (window as unknown as TestWindow).e2eeSearchTest;
		const id = api.create('persistent-worker-failure', '/test/persistent-crashable-worker.mjs');
		const state = await api.call(id, 'open', [{ userId: 'u', wrapKey: new Uint8Array(32).fill(7) }]);
		if (!(state as { encryptedAtRest: boolean }).encryptedAtRest) throw new Error('Persistent storage is required');
		await api.call(id, 'upsert', [[doc]]);
		await api.call(id, 'setRoomState', ['r', { backfillDone: true }]);
		api.watch(id);
		workers[0].postMessage({ op: 'testCrash' });
		return id;
	}, document);
	await expect
		.poll(() => page.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.events(id), id))
		.toContainEqual({ type: 'lost' });
	await expect(call(page, id, 'getRoomState', 'r')).resolves.toBeUndefined();
	await expect(call(page, id, 'search', { text: 'needle' })).resolves.toMatchObject([{ id: 'm' }]);
	await call(page, id, 'wipe');
	await call(page, id, 'close');
});

test('signals a real worker failure, replaces the memory-only worker, and invalidates checkpoints', async ({ page }) => {
	await load(page);
	const id = await page.evaluate(async (doc) => {
		const NativeWorker = Worker;
		const workers: Worker[] = [];
		window.Worker = class extends NativeWorker {
			constructor(url: string | URL, options?: WorkerOptions) {
				super(url, options);
				workers.push(this);
			}
		};
		const api = (window as unknown as TestWindow).e2eeSearchTest;
		const id = api.create('worker-failure', '/test/crashable-worker.mjs');
		await api.call(id, 'open', [{ userId: 'u', wrapKey: new Uint8Array(32).fill(7) }]);
		await api.call(id, 'upsert', [[doc]]);
		await api.call(id, 'setRoomState', ['r', { backfillDone: true }]);
		api.watch(id);
		workers[0].postMessage({ op: 'testCrash' });
		return id;
	}, document);
	await expect
		.poll(() => page.evaluate((id) => (window as unknown as TestWindow).e2eeSearchTest.events(id), id))
		.toContainEqual({ type: 'lost' });
	await expect(call(page, id, 'getRoomState', 'r')).resolves.toBeUndefined();
	await expect(call(page, id, 'search', { text: 'needle' })).resolves.toEqual([]);
	await call(page, id, 'close');
});
