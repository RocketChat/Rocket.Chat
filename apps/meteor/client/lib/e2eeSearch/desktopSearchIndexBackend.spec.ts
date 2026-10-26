import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { getDesktopSearchIndexBackend } from './desktopSearchIndexBackend';

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

const createBridge = () =>
	Object.fromEntries(
		methods.map((method) => [method, jest.fn(async () => `${method} result`)]),
	) as unknown as jest.Mocked<ISearchIndexBackend>;

const setDesktop = (desktop: unknown) => {
	(window as { RocketChatDesktop?: unknown }).RocketChatDesktop = desktop;
};

afterEach(() => {
	setDesktop(undefined);
});

describe('getDesktopSearchIndexBackend', () => {
	it('returns no backend outside the desktop app', () => {
		expect(getDesktopSearchIndexBackend()).toBeUndefined();
	});

	it('returns no backend when the desktop app has no E2EE search bridge', () => {
		setDesktop({ setBadge: jest.fn() });

		expect(getDesktopSearchIndexBackend()).toBeUndefined();
	});

	it.each(methods)('returns no backend when the bridge has no %s method', (method) => {
		const bridge: Partial<ISearchIndexBackend> = { ...createBridge() };
		delete bridge[method];
		setDesktop({ e2eeSearch: bridge });

		expect(getDesktopSearchIndexBackend()).toBeUndefined();
	});

	it('returns no backend when a bridge member is not a function', () => {
		setDesktop({ e2eeSearch: { ...createBridge(), search: 'search' } });

		expect(getDesktopSearchIndexBackend()).toBeUndefined();
	});

	it('forwards each call and its result unchanged', async () => {
		const bridge = createBridge();
		setDesktop(Object.freeze({ e2eeSearch: Object.freeze(bridge) }));
		const wrapKey = new Uint8Array(32).fill(7);
		const doc = { id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1, updatedAt: 1, kind: 'text' as const, body: 'needle' };
		const roomState = { backfillDone: false, backfillCursor: 'c1' };

		const backend = getDesktopSearchIndexBackend();
		if (!backend) throw new Error('expected a backend');

		await expect(backend.open({ userId: 'u1', wrapKey })).resolves.toBe('open result');
		await expect(backend.upsert([doc])).resolves.toBe('upsert result');
		await expect(backend.remove(['m1'])).resolves.toBe('remove result');
		await expect(backend.removeRoom('r1')).resolves.toBe('removeRoom result');
		await expect(backend.search({ text: 'needle', rid: 'r1' })).resolves.toBe('search result');
		await expect(backend.getRoomState('r1')).resolves.toBe('getRoomState result');
		await expect(backend.setRoomState('r1', roomState)).resolves.toBe('setRoomState result');
		await expect(backend.stats()).resolves.toBe('stats result');
		await expect(backend.wipe()).resolves.toBe('wipe result');

		expect(bridge.open).toHaveBeenCalledWith({ userId: 'u1', wrapKey });
		expect(bridge.open.mock.calls[0][0].wrapKey).toBe(wrapKey);
		expect(bridge.upsert).toHaveBeenCalledWith([doc]);
		expect(bridge.remove).toHaveBeenCalledWith(['m1']);
		expect(bridge.removeRoom).toHaveBeenCalledWith('r1');
		expect(bridge.search).toHaveBeenCalledWith({ text: 'needle', rid: 'r1' });
		expect(bridge.getRoomState).toHaveBeenCalledWith('r1');
		expect(bridge.setRoomState).toHaveBeenCalledWith('r1', roomState);
		expect(bridge.stats).toHaveBeenCalledWith();
		expect(bridge.wipe).toHaveBeenCalledWith();
	});

	it('passes a bridge rejection to the caller', async () => {
		const bridge = createBridge();
		bridge.search.mockRejectedValueOnce(new Error('E2EE search call failed'));
		setDesktop({ e2eeSearch: bridge });

		await expect(getDesktopSearchIndexBackend()?.search({ text: 'needle' })).rejects.toThrow('E2EE search call failed');
	});

	it('reads the bridge again on each call, so a desktop reload of the bridge is seen', () => {
		setDesktop({ e2eeSearch: createBridge() });
		expect(getDesktopSearchIndexBackend()).toBeDefined();

		setDesktop({});
		expect(getDesktopSearchIndexBackend()).toBeUndefined();
	});
});
