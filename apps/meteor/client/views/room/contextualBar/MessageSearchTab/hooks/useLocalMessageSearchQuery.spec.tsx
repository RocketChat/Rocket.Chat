import type { E2EESearchHit, E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { canLoadMoreLocalHits, useLocalMessageSearchQuery } from './useLocalMessageSearchQuery';
import { supportsLocalSearch, useLocalSearchIndexOpenResult } from './useLocalSearchIndexBackend';
import { createTestSearchBackend } from '../verification/testSearchBackend';

const mockOpened: E2EESearchOpenResult = {
	schemaVersion: 1,
	encryptedAtRest: true,
	capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 },
};
const mockSession = { getOpenResult: jest.fn(() => mockOpened), subscribe: jest.fn(() => () => undefined) };
jest.mock('../../../../../lib/e2ee/rocketchat.e2e', () => ({
	get e2eSearchIndexSession() {
		return mockSession;
	},
	e2eSearchIndexWriter: { subscribe: () => () => undefined, getVersion: () => 0 },
	e2eSearchIndexRuntime: {},
}));
jest.mock('../../../contexts/RoomContext', () => ({ useRoom: () => ({ _id: 'room' }) }));
jest.mock('../../../../../stores', () => ({
	Messages: { state: { find: () => undefined } },
	Users: { state: { find: () => undefined } },
}));

const hit: E2EESearchHit = { id: 'message', rid: 'room', uid: 'alice', username: 'alice', ts: 1, snippet: 'needle' };
const wrapper = mockAppRoot().build();
const options = (backend: ISearchIndexBackend) => ({ backend, openResult: mockOpened, searchText: 'needle', limit: 10 });

it('reads the current open result from the session', () => {
	const { result } = renderHook(useLocalSearchIndexOpenResult);
	expect(result.current).toBe(mockOpened);
	expect(mockSession.getOpenResult).toHaveBeenCalled();
});

it.each([undefined, {}, { recentCursor: 1 }, { recentCursor: 1, lifecycleEvents: 1 }])(
	'does not query a backend without every capability: %j',
	async (capabilities) => {
		const backend = createTestSearchBackend();
		const search = jest.spyOn(backend, 'searchRecentPage');
		const openResult = { ...mockOpened, capabilities: capabilities as E2EESearchOpenResult['capabilities'] };
		const { result } = renderHook(() => useLocalMessageSearchQuery({ ...options(backend), openResult }), { wrapper });
		expect(supportsLocalSearch(backend, openResult)).toBe(false);
		expect(result.current.fetchStatus).toBe('idle');
		expect(search).not.toHaveBeenCalled();
	},
);

it.each(['searchRecentPage', 'onIndexEvent', 'close'] as const)('requires the announced %s method', (method) => {
	const backend = createTestSearchBackend();
	delete backend[method];
	expect(supportsLocalSearch(backend, mockOpened)).toBe(false);
});

it('does not accept a locked open result', () => {
	expect(supportsLocalSearch(createTestSearchBackend(), { ...mockOpened, locked: true })).toBe(false);
});

it('uses cursor pages rather than the legacy search method', async () => {
	const backend = createTestSearchBackend();
	const search = jest.spyOn(backend, 'search');
	const searchRecentPage = jest.spyOn(backend, 'searchRecentPage').mockResolvedValue({ hits: [hit] });
	const { result } = renderHook(() => useLocalMessageSearchQuery(options(backend)), { wrapper });
	await waitFor(() => expect(result.current.isSuccess).toBe(true));
	expect(result.current.data).toEqual([hit]);
	expect(searchRecentPage).toHaveBeenCalledWith({ text: 'needle', rid: 'room', limit: 10 });
	expect(search).not.toHaveBeenCalled();
});

it('refreshes results after backend events without a writer notification', async () => {
	const backend = createTestSearchBackend();
	let listener!: Parameters<NonNullable<ISearchIndexBackend['onIndexEvent']>>[0];
	backend.onIndexEvent = (callback) => {
		listener = callback;
		return () => undefined;
	};
	const search = jest.spyOn(backend, 'searchRecentPage').mockResolvedValue({ hits: [] });
	const { result } = renderHook(() => useLocalMessageSearchQuery(options(backend)), { wrapper });
	await waitFor(() => expect(result.current.data).toEqual([]));
	search.mockResolvedValue({ hits: [hit] });
	act(() => listener({ type: 'changed' }));
	await waitFor(() => expect(result.current.data).toEqual([hit]));
});

it('does not keep old hits after index loss while replacement results load', async () => {
	const backend = createTestSearchBackend();
	let listener!: Parameters<NonNullable<ISearchIndexBackend['onIndexEvent']>>[0];
	backend.onIndexEvent = (callback) => {
		listener = callback;
		return () => undefined;
	};
	const search = jest.spyOn(backend, 'searchRecentPage').mockResolvedValue({ hits: [hit] });
	const { result } = renderHook(() => useLocalMessageSearchQuery(options(backend)), { wrapper });
	await waitFor(() => expect(result.current.data).toEqual([hit]));
	let resolve!: (page: { hits: E2EESearchHit[] }) => void;
	search.mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	act(() => listener({ type: 'lost' }));
	await waitFor(() => expect(result.current.data).toBeUndefined());
	await act(async () => resolve({ hits: [] }));
	await waitFor(() => expect(result.current.data).toEqual([]));
});

it('does not expose old-session results after a replacement backend opens', async () => {
	const first = createTestSearchBackend();
	const second = createTestSearchBackend();
	let resolve!: (page: { hits: E2EESearchHit[] }) => void;
	jest.spyOn(first, 'searchRecentPage').mockReturnValue(
		new Promise((done) => {
			resolve = done;
		}),
	);
	jest.spyOn(second, 'searchRecentPage').mockResolvedValue({ hits: [{ ...hit, id: 'replacement', snippet: 'new session' }] });
	const { result, rerender } = renderHook(({ backend }) => useLocalMessageSearchQuery(options(backend)), {
		wrapper,
		initialProps: { backend: first },
	});
	await waitFor(() => expect(first.searchRecentPage).toHaveBeenCalled());
	rerender({ backend: second });
	await waitFor(() => expect(result.current.data?.[0].id).toBe('replacement'));
	await act(async () => resolve({ hits: [hit] }));
	expect(result.current.data?.[0].id).toBe('replacement');
});

it.each([
	[{ isSuccess: true, isPlaceholderData: false, data: Array(10) }, 10, true],
	[{ isSuccess: true, isPlaceholderData: true, data: Array(10) }, 10, false],
	[{ isSuccess: false, isPlaceholderData: false, data: Array(10) }, 10, false],
	[{ isSuccess: true, isPlaceholderData: false, data: Array(9) }, 10, false],
	[{ isSuccess: true, isPlaceholderData: false, data: Array(1000) }, 1000, false],
])('bounds load-more requests (%#)', (query, limit, expected) => {
	expect(canLoadMoreLocalHits(query, limit)).toBe(expected);
});
