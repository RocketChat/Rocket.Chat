import type { E2EESearchIndexEvent, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexSessionBackend } from './searchIndexSessionBackend';

const createBackend = () => ({
	open: jest.fn(async () => ({ schemaVersion: 1, encryptedAtRest: false })),
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

it('creates distinct handles for repeated opens of one backend', async () => {
	const raw = createBackend();
	const first = createSearchIndexSessionBackend(raw);
	const second = createSearchIndexSessionBackend(raw);
	expect(first.backend).not.toBe(second.backend);
	first.revoke();
	await expect(first.backend.listRooms()).rejects.toThrow('session has ended');
	await expect(second.backend.listRooms()).resolves.toEqual(['r1']);
	expect(raw.listRooms).toHaveBeenCalledTimes(1);
});

it('does not permit a session handle to reopen the raw backend', async () => {
	const raw = createBackend();
	const { backend } = createSearchIndexSessionBackend(raw);
	await expect(backend.open({ userId: 'other' })).rejects.toThrow('cannot open another index');
	expect(raw.open).not.toHaveBeenCalled();
});

it('preserves available optional methods without inventing capabilities', () => {
	const { backend } = createSearchIndexSessionBackend(createBackend());
	expect(backend.close).toBeUndefined();
	expect(backend.onIndexEvent).toBeUndefined();
	expect(backend.searchRecentPage).toBeUndefined();
});

it('rejects a late result after revocation', async () => {
	const raw = createBackend();
	let resolve!: (value: string[]) => void;
	raw.listRooms.mockReturnValueOnce(
		new Promise((done) => {
			resolve = done;
		}),
	);
	const { backend, revoke } = createSearchIndexSessionBackend(raw);
	const result = backend.listRooms();
	revoke();
	resolve(['private-room']);
	await expect(result).rejects.toThrow('session has ended');
});

it('does not forward any later operation after revocation', async () => {
	const raw = createBackend();
	const { backend, revoke } = createSearchIndexSessionBackend(raw);
	revoke();
	const operations = [
		() => backend.upsert([]),
		() => backend.remove([]),
		() => backend.removeRoom('r1'),
		() => backend.listRooms(),
		() => backend.search({ text: 'needle' }),
		() => backend.getRoomState('r1'),
		() => backend.setRoomState('r1', { backfillDone: true }),
		() => backend.stats(),
		() => backend.wipe(),
	];
	for (const operation of operations) await expect(operation()).rejects.toThrow('session has ended');
	for (const method of Object.values(raw)) expect(method).not.toHaveBeenCalled();
});

it('forwards calls with the raw backend as receiver', async () => {
	const raw = createBackend();
	const { backend } = createSearchIndexSessionBackend(raw);
	await backend.upsert([]);
	await backend.remove(['m1']);
	await backend.removeRoom('r1');
	await backend.listRooms();
	await backend.search({ text: 'needle' });
	await backend.getRoomState('r1');
	await backend.setRoomState('r1', { backfillDone: true });
	await backend.stats();
	await backend.wipe({ userId: 'u1' });
	for (const [name, method] of Object.entries(raw)) {
		if (name === 'open') continue;
		expect(method.mock.instances[0]).toBe(raw);
	}
});

it('forwards recent paging only during its own session', async () => {
	const searchRecentPage = jest.fn(async () => ({ hits: [] }));
	const { backend, revoke } = createSearchIndexSessionBackend({ ...createBackend(), searchRecentPage });
	const query = { text: 'needle', cursor: { ts: 1000, id: 'm1' } };
	await expect(backend.searchRecentPage!(query)).resolves.toEqual({ hits: [] });
	expect(searchRecentPage).toHaveBeenCalledWith(query);
	revoke();
	await expect(backend.searchRecentPage!(query)).rejects.toThrow('session has ended');
	expect(searchRecentPage).toHaveBeenCalledTimes(1);
});

it('revokes access before closing without wiping retained data', async () => {
	const raw = createBackend();
	const close = jest.fn(async () => undefined);
	const { backend } = createSearchIndexSessionBackend({ ...raw, close });
	await backend.close!();
	await expect(backend.listRooms()).rejects.toThrow('session has ended');
	await expect(backend.close!()).rejects.toThrow('session has ended');
	expect(close).toHaveBeenCalledTimes(1);
	expect(raw.wipe).not.toHaveBeenCalled();
});

it('removes event listeners and ignores late callbacks after revocation', () => {
	const unsubscribe = jest.fn();
	const onIndexEvent = jest.fn((_listener: (event: E2EESearchIndexEvent) => void) => unsubscribe);
	const { backend, revoke } = createSearchIndexSessionBackend({ ...createBackend(), onIndexEvent });
	const listener = jest.fn();
	const off = backend.onIndexEvent!(listener);
	const callback = onIndexEvent.mock.calls[0][0];
	callback({ type: 'changed' });
	expect(listener).toHaveBeenCalledTimes(1);
	revoke();
	revoke();
	off();
	callback({ type: 'lost' });
	expect(listener).toHaveBeenCalledTimes(1);
	expect(unsubscribe).toHaveBeenCalledTimes(1);
	expect(() => backend.onIndexEvent!(listener)).toThrow('session has ended');
});

it('removes every listener even when one unsubscribe fails', () => {
	const failure = new Error('unsubscribe failed');
	const first = jest.fn(() => {
		throw failure;
	});
	const second = jest.fn();
	const onIndexEvent = jest.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
	const { backend, revoke } = createSearchIndexSessionBackend({ ...createBackend(), onIndexEvent });
	backend.onIndexEvent!(jest.fn());
	backend.onIndexEvent!(jest.fn());
	expect(revoke).toThrow(failure);
	expect(first).toHaveBeenCalledTimes(1);
	expect(second).toHaveBeenCalledTimes(1);
	expect(revoke).not.toThrow();
});

it('cleans a listener when its immediate lost callback revokes the session', () => {
	const unsubscribe = jest.fn();
	const raw: ISearchIndexBackend = {
		...createBackend(),
		onIndexEvent: (listener) => {
			listener({ type: 'lost' });
			return unsubscribe;
		},
	};
	const { backend, revoke } = createSearchIndexSessionBackend(raw);
	backend.onIndexEvent!(() => revoke());
	expect(unsubscribe).toHaveBeenCalledTimes(1);
});
