import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useLoadMissedMessages } from './useLoadMissedMessages';
import { LegacyRoomManager, upsertMessageBulk } from '../../../../app/ui-utils/client';
import { Messages, Subscriptions } from '../../../stores';

jest.mock('../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: {
		openedRooms: {} as Record<string, { rid?: string }>,
	},
	upsertMessageBulk: jest.fn(),
}));

jest.mock('../../../stores', () => ({
	Messages: {
		state: {
			findFirst: jest.fn(),
			remove: jest.fn(),
		},
	},
	Subscriptions: {
		state: {
			find: jest.fn(),
		},
	},
}));

const mockUseConnectionStatus = jest.fn<{ connected: boolean }, []>();

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useConnectionStatus: () => mockUseConnectionStatus(),
}));

const mockedUpsertMessageBulk = jest.mocked(upsertMessageBulk);
const mockedFindFirst = Messages.state.findFirst as jest.Mock;
const mockedRemove = Messages.state.remove as jest.Mock;
const mockedFindSubscription = Subscriptions.state.find as jest.Mock;

const openedRooms = LegacyRoomManager.openedRooms as unknown as Record<string, { rid?: string }>;

const lastLocalMessage = {
	_id: 'msg-local',
	rid: 'room-1',
	_updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const emptyResult = {
	result: {
		updated: [],
		deleted: [],
		cursor: { next: null, previous: null },
	},
};

beforeEach(() => {
	jest.clearAllMocks();
	Object.keys(openedRooms).forEach((key) => delete openedRooms[key]);
	openedRooms.c__general = { rid: 'room-1' };
	mockedFindFirst.mockReturnValue(lastLocalMessage);
	mockedFindSubscription.mockReturnValue(undefined);
	mockedUpsertMessageBulk.mockResolvedValue(undefined);
});

afterEach(() => {
	// Restore any spies (e.g. console.error) regardless of test outcome so they don't leak
	jest.restoreAllMocks();
});

const renderWithReconnect = (wrapper: ReturnType<ReturnType<typeof mockAppRoot>['build']>) => {
	mockUseConnectionStatus.mockReturnValue({ connected: false });
	const utils = renderHook(() => useLoadMissedMessages(), { wrapper });
	mockUseConnectionStatus.mockReturnValue({ connected: true });
	utils.rerender();
	return utils;
};

describe('useLoadMissedMessages', () => {
	it('should not sync while the connection stays online', () => {
		const syncMessagesSpy = jest.fn(() => emptyResult as any);
		mockUseConnectionStatus.mockReturnValue({ connected: true });

		const { rerender } = renderHook(() => useLoadMissedMessages(), {
			wrapper: mockAppRoot().withEndpoint('GET', '/v1/chat.syncMessages', syncMessagesSpy).build(),
		});
		rerender();

		expect(syncMessagesSpy).not.toHaveBeenCalled();
	});

	it('should sync opened rooms on reconnect using the latest local _updatedAt as baseline', async () => {
		const syncMessagesSpy = jest.fn(() => emptyResult as any);

		renderWithReconnect(mockAppRoot().withEndpoint('GET', '/v1/chat.syncMessages', syncMessagesSpy).build());

		await waitFor(() => {
			expect(syncMessagesSpy).toHaveBeenCalledWith({
				roomId: 'room-1',
				lastUpdate: '2026-01-01T00:00:00.000Z',
			});
		});
	});

	it('should only consider non-temp, non-hidden messages that have an _updatedAt as the baseline', async () => {
		const syncMessagesSpy = jest.fn(() => emptyResult as any);

		renderWithReconnect(mockAppRoot().withEndpoint('GET', '/v1/chat.syncMessages', syncMessagesSpy).build());

		await waitFor(() => {
			expect(mockedFindFirst).toHaveBeenCalled();
		});

		const [predicate, comparator] = mockedFindFirst.mock.calls[0];

		expect(predicate({ rid: 'room-1', _hidden: false, temp: false, _updatedAt: new Date() })).toBe(true);
		// an optimistic message that was acked keeps no _updatedAt: it must be skipped so
		// the comparator never dereferences undefined
		expect(predicate({ rid: 'room-1', _hidden: false, temp: false, _updatedAt: undefined })).toBe(false);
		expect(predicate({ rid: 'room-1', _hidden: false, temp: true, _updatedAt: new Date() })).toBe(false);
		expect(predicate({ rid: 'room-1', _hidden: true, temp: false, _updatedAt: new Date() })).toBe(false);
		expect(predicate({ rid: 'room-2', _hidden: false, temp: false, _updatedAt: new Date() })).toBe(false);

		const older = { _updatedAt: new Date('2026-01-01T00:00:00.000Z') };
		const newer = { _updatedAt: new Date('2026-01-02T00:00:00.000Z') };
		expect(comparator(newer, older)).toBeLessThan(0);
		expect(comparator(older, newer)).toBeGreaterThan(0);
	});

	it('should upsert updated messages with dates mapped and delete removed messages', async () => {
		const syncMessagesSpy = jest.fn(
			() =>
				({
					result: {
						updated: [
							{
								_id: 'msg-edited',
								rid: 'room-1',
								msg: 'edited while offline',
								ts: '2025-12-31T23:00:00.000Z',
								u: { _id: 'user-1', username: 'john' },
								_updatedAt: '2026-01-01T01:00:00.000Z',
							},
						],
						deleted: [{ _id: 'msg-deleted', _deletedAt: '2026-01-01T02:00:00.000Z' }],
						cursor: { next: null, previous: null },
					},
				}) as any,
		);
		const subscription = { rid: 'room-1' };
		mockedFindSubscription.mockReturnValue(subscription);

		renderWithReconnect(mockAppRoot().withEndpoint('GET', '/v1/chat.syncMessages', syncMessagesSpy).build());

		await waitFor(() => {
			expect(mockedUpsertMessageBulk).toHaveBeenCalledWith({
				msgs: [
					expect.objectContaining({
						_id: 'msg-edited',
						ts: new Date('2025-12-31T23:00:00.000Z'),
						_updatedAt: new Date('2026-01-01T01:00:00.000Z'),
					}),
				],
				subscription,
			});
		});

		await waitFor(() => {
			expect(mockedRemove).toHaveBeenCalled();
		});
		const removePredicate = mockedRemove.mock.calls[0][0];
		expect(removePredicate({ _id: 'msg-deleted' })).toBe(true);
		expect(removePredicate({ _id: 'msg-kept' })).toBe(false);
	});

	it('should apply deletions even when no message was updated', async () => {
		const syncMessagesSpy = jest.fn(
			() =>
				({
					result: {
						updated: [],
						deleted: [{ _id: 'msg-deleted', _deletedAt: '2026-01-01T02:00:00.000Z' }],
						cursor: { next: null, previous: null },
					},
				}) as any,
		);

		renderWithReconnect(mockAppRoot().withEndpoint('GET', '/v1/chat.syncMessages', syncMessagesSpy).build());

		await waitFor(() => {
			expect(mockedRemove).toHaveBeenCalled();
		});
		const removePredicate = mockedRemove.mock.calls[0][0];
		expect(removePredicate({ _id: 'msg-deleted' })).toBe(true);

		expect(mockedUpsertMessageBulk).not.toHaveBeenCalled();
	});

	it('should skip rooms without local messages', () => {
		mockedFindFirst.mockReturnValue(undefined);
		const syncMessagesSpy = jest.fn(() => emptyResult as any);

		renderWithReconnect(mockAppRoot().withEndpoint('GET', '/v1/chat.syncMessages', syncMessagesSpy).build());

		expect(syncMessagesSpy).not.toHaveBeenCalled();
	});

	it('should keep syncing other rooms when one request fails', async () => {
		openedRooms.c__other = { rid: 'room-2' };
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const syncMessagesSpy = jest.fn(({ roomId }: { roomId: string }) => {
			if (roomId === 'room-1') {
				throw new Error('network error');
			}
			return emptyResult as any;
		});

		renderWithReconnect(mockAppRoot().withEndpoint('GET', '/v1/chat.syncMessages', syncMessagesSpy).build());

		await waitFor(() => {
			expect(syncMessagesSpy).toHaveBeenCalledTimes(2);
		});

		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalledWith('Error syncing missed messages:', expect.any(Error));
		});
	});
});
