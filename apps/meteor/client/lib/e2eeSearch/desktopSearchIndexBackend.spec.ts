import type { E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { getDesktopSearchIndexBackend } from './desktopSearchIndexBackend';

const capabilities = { recentCursor: 1, lifecycleEvents: 1, close: 1 } as const;
const createBridge = () => ({
	open: jest.fn(async (_scope: Parameters<ISearchIndexBackend['open']>[0]): Promise<E2EESearchOpenResult> => ({
		schemaVersion: 1,
		encryptedAtRest: true,
	})),
	upsert: jest.fn(async () => undefined),
	remove: jest.fn(async () => undefined),
	removeRoom: jest.fn(async () => undefined),
	listRooms: jest.fn(async () => ['r1']),
	search: jest.fn(async () => []),
	getRoomState: jest.fn(async () => undefined),
	setRoomState: jest.fn(async () => undefined),
	stats: jest.fn(async () => ({ docs: 0, bytes: 0, rooms: 0 })),
	wipe: jest.fn(async () => undefined),
});
const setDesktop = (desktop: unknown) => {
	(window as { RocketChatDesktop?: unknown }).RocketChatDesktop = desktop;
};
afterEach(() => setDesktop(undefined));

it('returns no backend without a complete desktop bridge', () => {
	for (const desktop of [undefined, {}, { e2eeSearch: {} }, { e2eeSearch: { open: jest.fn() } }]) {
		setDesktop(desktop);
		expect(getDesktopSearchIndexBackend()).toBeUndefined();
	}
});

it('preserves all legacy calls and optional close without requiring capabilities', async () => {
	const bridge = createBridge();
	const close = jest.fn(async () => undefined);
	setDesktop(Object.freeze({ e2eeSearch: Object.freeze({ ...bridge, close }) }));
	const backend = getDesktopSearchIndexBackend()!;
	const scope = { userId: 'u1', wrapKey: new Uint8Array(32) };
	const docs = [{ id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1, updatedAt: 1, kind: 'text' as const, body: 'needle' }];
	const roomState = { backfillDone: false };
	await backend.open(scope);
	await backend.upsert(docs);
	await backend.remove(['m1']);
	await backend.removeRoom('r1');
	await expect(backend.listRooms()).resolves.toEqual(['r1']);
	await expect(backend.search({ text: 'needle' })).resolves.toEqual([]);
	await backend.getRoomState('r1');
	await backend.setRoomState('r1', roomState);
	await backend.stats();
	await backend.wipe();
	await backend.wipe({ userId: 'u1' });
	await backend.close?.();
	expect(bridge.open).toHaveBeenCalledWith(scope);
	expect(bridge.open.mock.calls[0][0]).toBe(scope);
	expect(bridge.upsert).toHaveBeenCalledWith(docs);
	expect(bridge.remove).toHaveBeenCalledWith(['m1']);
	expect(bridge.removeRoom).toHaveBeenCalledWith('r1');
	expect(bridge.listRooms).toHaveBeenCalledWith();
	expect(bridge.search).toHaveBeenCalledWith({ text: 'needle' });
	expect(bridge.getRoomState).toHaveBeenCalledWith('r1');
	expect(bridge.setRoomState).toHaveBeenCalledWith('r1', roomState);
	expect(bridge.stats).toHaveBeenCalledWith();
	expect(bridge.wipe).toHaveBeenNthCalledWith(1);
	expect(bridge.wipe).toHaveBeenNthCalledWith(2, { userId: 'u1' });
	expect(close).toHaveBeenCalledWith();
	expect(backend.searchRecentPage).toBeUndefined();
});

it('does not add close or recent methods to a legacy bridge', () => {
	setDesktop({ e2eeSearch: createBridge() });
	const backend = getDesktopSearchIndexBackend()!;
	expect(backend.close).toBeUndefined();
	expect(backend.searchRecentPage).toBeUndefined();
});

it.each([undefined, {}, { recentCursor: 1 }, { recentCursor: 2, lifecycleEvents: 1, close: 1 }])(
	'rejects new paging without a complete capability report: %j',
	async (report) => {
		const bridge = createBridge();
		bridge.open.mockResolvedValue({
			schemaVersion: 1,
			encryptedAtRest: true,
			capabilities: report as E2EESearchOpenResult['capabilities'],
		});
		const searchRecentPage = jest.fn(async () => ({ hits: [] }));
		setDesktop({ e2eeSearch: { ...bridge, searchRecentPage, onIndexEvent: jest.fn(), close: jest.fn() } });
		const backend = getDesktopSearchIndexBackend()!;
		await backend.open({ userId: 'u1' });
		await expect(backend.searchRecentPage!({ text: 'needle' })).rejects.toThrow('does not support');
		expect(searchRecentPage).not.toHaveBeenCalled();
		await expect(backend.search({ text: 'needle' })).resolves.toEqual([]);
	},
);

it.each(['searchRecentPage', 'onIndexEvent', 'close'] as const)('requires the announced %s method', async (missing) => {
	const bridge = { ...createBridge(), searchRecentPage: jest.fn(), onIndexEvent: jest.fn(), close: jest.fn() };
	bridge.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: true, capabilities });
	delete (bridge as Partial<ISearchIndexBackend>)[missing];
	setDesktop({ e2eeSearch: bridge });
	const backend = getDesktopSearchIndexBackend()!;
	await backend.open({ userId: 'u1' });
	expect(backend.searchRecentPage).toBeUndefined();
});

it('forwards compound cursors and events only after a capable open', async () => {
	const bridge = createBridge();
	bridge.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: true, capabilities });
	const unsubscribe = jest.fn();
	const listener = jest.fn();
	const searchRecentPage = jest.fn(async () => ({ hits: [], nextCursor: { ts: 1000, id: 'm1' } }));
	const onIndexEvent = jest.fn((_listener: Parameters<NonNullable<ISearchIndexBackend['onIndexEvent']>>[0]) => unsubscribe);
	const close = jest.fn(async () => undefined);
	const fullBridge = { ...bridge, searchRecentPage, onIndexEvent, close };
	setDesktop({ e2eeSearch: fullBridge });
	const backend = getDesktopSearchIndexBackend()!;
	await expect(backend.searchRecentPage!({ text: 'needle' })).rejects.toThrow('does not support');
	await backend.open({ userId: 'u1' });
	const query = { text: 'needle', rid: 'r1', cursor: { ts: 1000, id: 'm2' } };
	await expect(backend.searchRecentPage!(query)).resolves.toEqual({ hits: [], nextCursor: { ts: 1000, id: 'm1' } });
	expect(searchRecentPage).toHaveBeenCalledWith(query);
	expect(searchRecentPage.mock.instances[0]).toBe(fullBridge);
	const off = backend.onIndexEvent!(listener);
	const forwarded = onIndexEvent.mock.calls[0][0];
	forwarded({ type: 'changed' });
	expect(listener).toHaveBeenCalledWith({ type: 'changed' });
	off();
	off();
	forwarded({ type: 'changed' });
	expect(listener).toHaveBeenCalledTimes(1);
	expect(unsubscribe).toHaveBeenCalledTimes(1);
	await backend.close!();
	await expect(backend.searchRecentPage!(query)).rejects.toThrow('does not support');
});

it('ignores events from a previous open session', async () => {
	const bridge = createBridge();
	bridge.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: true, capabilities });
	const onIndexEvent = jest.fn((_listener: Parameters<NonNullable<ISearchIndexBackend['onIndexEvent']>>[0]) => jest.fn());
	setDesktop({ e2eeSearch: { ...bridge, searchRecentPage: jest.fn(), onIndexEvent, close: jest.fn(async () => undefined) } });
	const backend = getDesktopSearchIndexBackend()!;
	const listener = jest.fn();
	await backend.open({ userId: 'u1' });
	const off = backend.onIndexEvent!(listener);
	await backend.close!();
	await backend.open({ userId: 'u2' });
	onIndexEvent.mock.calls[0][0]({ type: 'lost' });
	expect(listener).not.toHaveBeenCalled();
	off();
});

it('does not enable paging when an open resolves after close', async () => {
	const bridge = createBridge();
	let resolve!: (result: E2EESearchOpenResult) => void;
	bridge.open.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	setDesktop({ e2eeSearch: { ...bridge, searchRecentPage: jest.fn(), onIndexEvent: jest.fn(), close: jest.fn(async () => undefined) } });
	const backend = getDesktopSearchIndexBackend()!;
	const opening = backend.open({ userId: 'u1' });
	await backend.close!();
	resolve({ schemaVersion: 1, encryptedAtRest: true, capabilities });
	await opening;
	await expect(backend.searchRecentPage!({ text: '' })).rejects.toThrow('does not support');
});

it('does not enable paging after a locked open', async () => {
	const bridge = createBridge();
	bridge.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: false, locked: true, capabilities });
	const searchRecentPage = jest.fn();
	setDesktop({ e2eeSearch: { ...bridge, searchRecentPage, onIndexEvent: jest.fn(), close: jest.fn() } });
	const backend = getDesktopSearchIndexBackend()!;
	await backend.open({ userId: 'u1' });
	await expect(backend.searchRecentPage!({ text: '' })).rejects.toThrow('does not support');
	expect(searchRecentPage).not.toHaveBeenCalled();
});

it('passes legacy rejections to the caller and reads each replacement bridge', async () => {
	const bridge = createBridge();
	bridge.search.mockRejectedValueOnce(new Error('bridge failure'));
	setDesktop({ e2eeSearch: bridge });
	await expect(getDesktopSearchIndexBackend()!.search({ text: '' })).rejects.toThrow('bridge failure');
	setDesktop({});
	expect(getDesktopSearchIndexBackend()).toBeUndefined();
});
