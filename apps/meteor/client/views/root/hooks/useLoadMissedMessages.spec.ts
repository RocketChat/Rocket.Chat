import { useConnectionStatus, useEndpoint } from '@rocket.chat/ui-contexts';
import { act, renderHook } from '@testing-library/react';

import { useLoadMissedMessages } from './useLoadMissedMessages';
import { LegacyRoomManager, upsertMessageBulk } from '../../../../app/ui-utils/client';
import { Messages, Subscriptions } from '../../../stores';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useConnectionStatus: jest.fn(),
	useEndpoint: jest.fn(),
}));

jest.mock('../../../../app/ui-utils/client', () => ({
	LegacyRoomManager: { openedRooms: {} as Record<string, { rid: string }> },
	upsertMessageBulk: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../stores', () => ({
	Messages: { state: { findFirst: jest.fn(), delete: jest.fn() } },
	Subscriptions: { state: { find: jest.fn() } },
}));

const flushMicrotasks = () => act(() => Promise.resolve().then().then().then());

describe('useLoadMissedMessages', () => {
	const rid = 'room-1';

	beforeEach(() => {
		jest.clearAllMocks();
		(LegacyRoomManager as { openedRooms: Record<string, { rid: string }> }).openedRooms = { [rid]: { rid } };
		(Subscriptions.state.find as jest.Mock).mockReturnValue(undefined);
	});

	const setConnected = (connected: boolean) => {
		(useConnectionStatus as jest.Mock).mockReturnValue({ connected });
	};

	it('does nothing when there is no known message to anchor the sync on', async () => {
		(Messages.state.findFirst as jest.Mock).mockReturnValue(undefined);
		const syncMessages = jest.fn();
		(useEndpoint as jest.Mock).mockReturnValue(syncMessages);

		setConnected(false);
		const { rerender } = renderHook(() => useLoadMissedMessages());
		setConnected(true);
		rerender();
		await flushMicrotasks();

		expect(syncMessages).not.toHaveBeenCalled();
	});

	it('does not call the endpoint when the connection was already online (no reconnect edge)', async () => {
		(Messages.state.findFirst as jest.Mock).mockReturnValue({
			_id: 'msg-1',
			rid,
			ts: new Date('2026-01-01T00:00:00.000Z'),
			_updatedAt: new Date('2026-01-01T00:00:00.000Z'),
		});
		const syncMessages = jest.fn();
		(useEndpoint as jest.Mock).mockReturnValue(syncMessages);

		setConnected(true);
		renderHook(() => useLoadMissedMessages());
		await flushMicrotasks();

		expect(syncMessages).not.toHaveBeenCalled();
	});

	it('anchors the sync on the last known message `_updatedAt`, not `ts`', async () => {
		(Messages.state.findFirst as jest.Mock).mockReturnValue({
			_id: 'msg-1',
			rid,
			ts: new Date('2026-01-01T00:00:00.000Z'),
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'), // edited after creation
		});

		const syncMessages = jest.fn().mockResolvedValue({ result: { updated: [], deleted: [] } });
		(useEndpoint as jest.Mock).mockReturnValue(syncMessages);

		setConnected(false);
		const { rerender } = renderHook(() => useLoadMissedMessages());
		setConnected(true);
		rerender();
		await flushMicrotasks();

		expect(syncMessages).toHaveBeenCalledWith({ roomId: rid, lastUpdate: '2026-01-02T00:00:00.000Z' });
	});

	it('stores updated messages and removes deleted ones on reconnect', async () => {
		(Messages.state.findFirst as jest.Mock).mockReturnValue({
			_id: 'msg-2',
			rid,
			ts: new Date('2026-01-01T00:00:01.000Z'),
			_updatedAt: new Date('2026-01-01T00:00:01.000Z'),
		});

		const updatedMessage = {
			_id: 'msg-1',
			rid,
			msg: 'edited while offline',
			ts: '2026-01-01T00:00:00.000Z',
			_updatedAt: '2026-01-03T00:00:00.000Z',
		};

		const syncMessages = jest.fn().mockResolvedValue({
			result: {
				updated: [updatedMessage],
				deleted: [{ _id: 'msg-2', _deletedAt: '2026-01-03T00:00:00.000Z' }],
			},
		});
		(useEndpoint as jest.Mock).mockReturnValue(syncMessages);

		setConnected(false);
		const { rerender } = renderHook(() => useLoadMissedMessages());
		setConnected(true);
		rerender();
		await flushMicrotasks();
		await flushMicrotasks();

		expect(upsertMessageBulk).toHaveBeenCalledWith({
			msgs: [expect.objectContaining({ _id: 'msg-1', msg: 'edited while offline', _updatedAt: new Date('2026-01-03T00:00:00.000Z') })],
			subscription: undefined,
		});
		expect(Messages.state.delete).toHaveBeenCalledWith('msg-2');
	});
});
