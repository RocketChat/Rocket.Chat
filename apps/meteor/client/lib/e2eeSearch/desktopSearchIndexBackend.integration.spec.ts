import type { E2EESearchHit, E2EESearchRecentQuery, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { getDesktopSearchIndexBackend } from './desktopSearchIndexBackend';
import { searchLocalIndex } from './searchLocalIndex';

const capabilities = { recentCursor: 1, lifecycleEvents: 1, close: 1 } as const;
const docs: E2EESearchHit[] = Array.from({ length: 205 }, (_, index) => ({
	id: `message-${String(205 - index).padStart(3, '0')}`,
	rid: 'r1',
	uid: 'u1',
	username: 'alice',
	ts: 1000,
	snippet: 'needle',
}));

const setDesktop = (desktop: unknown) => {
	(window as { RocketChatDesktop?: unknown }).RocketChatDesktop = desktop;
};

const createBridge = () => ({
	open: jest.fn(async () => ({ schemaVersion: 1, encryptedAtRest: true, capabilities })),
	upsert: jest.fn(async () => undefined),
	remove: jest.fn(async () => undefined),
	removeRoom: jest.fn(async () => undefined),
	listRooms: jest.fn(async () => []),
	search: jest.fn(async () => []),
	getRoomState: jest.fn(async () => undefined),
	setRoomState: jest.fn(async () => undefined),
	stats: jest.fn(async () => ({ docs: 0, bytes: 0, rooms: 0 })),
	wipe: jest.fn(async () => undefined),
	close: jest.fn(async () => undefined),
	onIndexEvent: jest.fn(() => () => undefined),
	searchRecentPage: jest.fn(async (query: E2EESearchRecentQuery) => {
		const matching = docs.filter(
			({ id, ts, rid }) => rid === query.rid && (!query.cursor || ts < query.cursor.ts || (ts === query.cursor.ts && id < query.cursor.id)),
		);
		const hits = matching.slice(0, query.limit);
		const last = hits.at(-1);
		return { hits, ...(last && matching.length > hits.length && { nextCursor: { ts: last.ts, id: last.id } }) };
	}),
});

afterEach(() => setDesktop(undefined));

it('passes 205 tied hits through the desktop adapter and client query without legacy search', async () => {
	const bridge = createBridge();
	setDesktop(Object.freeze({ e2eeSearch: Object.freeze(bridge) }));
	const backend = getDesktopSearchIndexBackend()!;
	const openResult = await backend.open({ userId: 'u1' });
	await expect(searchLocalIndex(backend, { openResult, searchText: 'needle', rid: 'r1', limit: 300 })).resolves.toEqual(docs);
	expect(bridge.searchRecentPage).toHaveBeenCalledTimes(3);
	expect(bridge.searchRecentPage.mock.calls[1][0].cursor).toEqual({ ts: 1000, id: docs[99].id });
	expect(bridge.searchRecentPage.mock.calls[2][0].cursor).toEqual({ ts: 1000, id: docs[199].id });
	expect(bridge.search).not.toHaveBeenCalled();
	expect(bridge.open).toHaveBeenCalledTimes(1);
});

it('does not query a bridge that announces capabilities but omits an event method', async () => {
	const bridge = createBridge();
	const incomplete: Partial<ISearchIndexBackend> = { ...bridge };
	delete incomplete.onIndexEvent;
	setDesktop({ e2eeSearch: incomplete });
	const backend = getDesktopSearchIndexBackend()!;
	const openResult = await backend.open({ userId: 'u1' });
	await expect(searchLocalIndex(backend, { openResult, searchText: 'needle', rid: 'r1', limit: 300 })).rejects.toThrow(
		'required capabilities',
	);
	expect(bridge.searchRecentPage).not.toHaveBeenCalled();
	expect(bridge.search).not.toHaveBeenCalled();
});
