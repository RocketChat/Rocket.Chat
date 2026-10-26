import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { FAKE_BACKEND_STORAGE_KEY, getSearchIndexBackend } from './getSearchIndexBackend';

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

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
	it('returns no backend in a normal browser', () => {
		expect(getSearchIndexBackend()).toBeUndefined();
	});

	it('returns no backend on a desktop version with no E2EE search bridge', () => {
		setDesktop({ setBadge: jest.fn() });

		expect(getSearchIndexBackend()).toBeUndefined();
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

	it('returns no backend in a production build, also with the dev flag set', () => {
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
