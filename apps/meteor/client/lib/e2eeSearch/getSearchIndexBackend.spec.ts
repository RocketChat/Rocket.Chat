import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { absoluteUrl } from '../absoluteUrl';
import { FAKE_BACKEND_STORAGE_KEY, getSearchIndexBackend } from './getSearchIndexBackend';

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'listRooms', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

const createBridge = () =>
	Object.fromEntries(
		methods.map((method) => [method, jest.fn(async () => `${method} result`)]),
	) as unknown as jest.Mocked<ISearchIndexBackend>;

const setDesktop = (desktop: unknown) => {
	(window as { RocketChatDesktop?: unknown }).RocketChatDesktop = desktop;
};

const originalNodeEnv = process.env.NODE_ENV;

const setNodeEnv = (value: string) => {
	(process.env as Record<string, string>).NODE_ENV = value;
};

afterEach(() => {
	setDesktop(undefined);
	window.localStorage.clear();
	setNodeEnv(originalNodeEnv as string);
});

describe('getSearchIndexBackend', () => {
	it('returns no backend in a browser that cannot run a module worker', () => {
		expect(typeof Worker).toBe('undefined');

		expect(getSearchIndexBackend()).toBeUndefined();
	});

	it('returns the browser SQLite backend in a browser with workers and WebAssembly, and starts no worker before a call', async () => {
		const workers: { url: string; options: WorkerOptions; postMessage: jest.Mock }[] = [];
		const FakeWorker = jest.fn(function (this: (typeof workers)[number], url: string, options: WorkerOptions) {
			this.url = url;
			this.options = options;
			this.postMessage = jest.fn();
			workers.push(this);
		});
		(window as { Worker?: unknown }).Worker = FakeWorker;

		try {
			const backend = getSearchIndexBackend();

			expect(backend).toBeDefined();
			expect(getSearchIndexBackend()).toBe(backend);
			expect(workers).toHaveLength(0);

			void backend?.open({ userId: 'u1', wrapKey: new Uint8Array(32).fill(1) });

			// The worker starts after the page imported the wrap key.
			for (let tries = 0; workers.length === 0 && tries < 100; tries++) await new Promise((resolve) => setTimeout(resolve, 5));
			expect(workers).toHaveLength(1);
			expect(workers[0].url).toMatch(/workers\/e2ee-search\/worker\.mjs$/);
			expect(workers[0].options).toEqual({ type: 'module', name: 'e2ee-search-index' });
			// The first call opens the index of this server and user, which comes back from its encrypted copy.
			expect(workers[0].postMessage).toHaveBeenCalledWith(
				expect.objectContaining({
					op: 'open',
					scopeId: JSON.stringify([absoluteUrl(''), 'u1']),
					wrapKey: expect.objectContaining({ type: 'secret', extractable: false }),
				}),
			);
		} finally {
			delete (window as { Worker?: unknown }).Worker;
		}
	});

	it('returns no backend on a desktop version with no E2EE search bridge, also when the browser index could run', () => {
		setDesktop({ setBadge: jest.fn() });
		(window as { Worker?: unknown }).Worker = jest.fn();

		try {
			expect(getSearchIndexBackend()).toBeUndefined();
		} finally {
			delete (window as { Worker?: unknown }).Worker;
		}
	});

	it('returns the desktop backend when the desktop app has one, also with the dev flag set', async () => {
		const bridge = createBridge();
		setDesktop({ e2eeSearch: bridge });
		setNodeEnv('development');
		window.localStorage.setItem(FAKE_BACKEND_STORAGE_KEY, 'true');

		await expect(getSearchIndexBackend()?.search({ text: 'needle' })).resolves.toBe('search result');
		expect(bridge.search).toHaveBeenCalledWith({ text: 'needle' });
	});

	it('returns a memory-only fake backend in a development build with the dev flag set', async () => {
		setNodeEnv('development');
		window.localStorage.setItem(FAKE_BACKEND_STORAGE_KEY, 'true');

		const backend = getSearchIndexBackend();

		await expect(backend?.open({ userId: 'u1' })).resolves.toEqual({ schemaVersion: 1, encryptedAtRest: false });
	});

	it('keeps one fake backend, so its messages stay between calls', async () => {
		setNodeEnv('development');
		window.localStorage.setItem(FAKE_BACKEND_STORAGE_KEY, 'true');

		await getSearchIndexBackend()?.open({ userId: 'u1' });
		await getSearchIndexBackend()?.upsert([
			{ id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1, updatedAt: 1, kind: 'text', body: 'needle' },
		]);

		await expect(getSearchIndexBackend()?.stats()).resolves.toEqual({ docs: 1, bytes: 6, rooms: 1 });
	});

	it('returns no fake backend in a production build, also with the dev flag set', () => {
		setNodeEnv('production');
		window.localStorage.setItem(FAKE_BACKEND_STORAGE_KEY, 'true');

		expect(getSearchIndexBackend()).toBeUndefined();
	});

	it.each(['false', '1', ''])('returns no backend in a development build when the dev flag is %p', (value) => {
		setNodeEnv('development');
		window.localStorage.setItem(FAKE_BACKEND_STORAGE_KEY, value);

		expect(getSearchIndexBackend()).toBeUndefined();
	});

	it('returns no backend when local storage cannot be read', () => {
		setNodeEnv('development');
		const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('SecurityError');
		});

		try {
			expect(getSearchIndexBackend()).toBeUndefined();
		} finally {
			getItem.mockRestore();
		}
	});
});
