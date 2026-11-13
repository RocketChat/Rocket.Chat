import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useRoomJumpTarget } from './useRoomJumpTarget';
import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { getSnapshot } from '../../MessageList/providers/messageHighlightSubscription';
import { useGoToRoom } from '../../hooks/useGoToRoom';

jest.mock('../../../../lib/SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../../../../lib/onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn((message) => message) }));
jest.mock('../../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../hooks/useGoToRoom', () => ({ useGoToRoom: jest.fn() }));
jest.mock('../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({ setMessageJumpQueryStringParameter: jest.fn() }));

const goToRoom = jest.fn().mockResolvedValue(undefined);
const rid = 'room-1';
const ts = new Date('2024-01-01T00:00:00Z').toISOString();
const message = { _id: 'msg-1', ts, u: { _id: 'user-1', username: 'john' }, msg: 'Hello', _updatedAt: ts };

const getSurroundingMessages = jest.spyOn(RoomHistoryManager, 'getSurroundingMessages');
const getSurroundingChannelMessages = jest.spyOn(RoomHistoryManager, 'getSurroundingChannelMessages');

beforeEach(() => {
	jest.mocked(useGoToRoom).mockReturnValue(goToRoom);
	getSurroundingMessages.mockResolvedValue(undefined);
	getSurroundingChannelMessages.mockResolvedValue(undefined);
	RoomHistoryManager.close(rid);
	RoomHistoryManager.updateRoom(rid, { loaded: 1 });
});

afterEach(() => {
	jest.clearAllMocks();
});

type Fetched = unknown | Error | Promise<unknown>;

const renderJumpTarget = (fetched: Fetched, loaded: Pick<IMessage, '_id'>[] = [], search: Record<string, string> = { msg: 'msg-1' }) =>
	renderHook(({ listed }) => useRoomJumpTarget(rid, listed as IMessage[]), {
		initialProps: { listed: loaded },
		wrapper: mockAppRoot()
			.withRouter({ getSearchParameters: () => search })
			.withEndpoint('GET', '/v1/chat.getMessage', (async () => {
				if (fetched instanceof Error) {
					throw fetched;
				}
				return { message: await fetched };
			}) as any)
			.build(),
	});

it('targets a message of this room once it is fetched (R31)', async () => {
	const { result } = renderJumpTarget({ ...message, rid });

	expect(result.current.targetMessageId).toBeUndefined();
	await waitFor(() => expect(result.current.targetMessageId).toBe('msg-1'));
	expect(goToRoom).not.toHaveBeenCalled();
});

describe('the messages around the target', () => {
	it('starts loading around the message at once when nothing is loaded and loads around the target once (R32)', async () => {
		RoomHistoryManager.close(rid);
		let fetchedMessage: (value: unknown) => void = () => undefined;
		const { result, rerender } = renderJumpTarget(
			new Promise((resolve) => {
				fetchedMessage = resolve;
			}),
		);

		expect(getSurroundingMessages).toHaveBeenCalledWith({ _id: 'msg-1', rid });
		expect(getSurroundingChannelMessages).not.toHaveBeenCalled();

		await act(async () => fetchedMessage({ ...message, rid }));
		await waitFor(() => expect(getSurroundingChannelMessages).toHaveBeenCalledWith({ _id: 'msg-1', rid }));
		rerender({ listed: [] });

		expect(getSurroundingChannelMessages).toHaveBeenCalledTimes(1);
		expect(result.current.targetMessageId).toBe('msg-1');
	});

	it('does not ask again for a room that has messages, and loads only around a target that is not listed (R32)', async () => {
		const { result } = renderJumpTarget({ ...message, rid });

		await waitFor(() => expect(getSurroundingChannelMessages).toHaveBeenCalledWith({ _id: 'msg-1', rid }));
		expect(getSurroundingMessages).not.toHaveBeenCalled();
		expect(result.current.targetMessageId).toBe('msg-1');
	});

	it('asks for the messages around a target once, while the history manager loads and settles (R32)', async () => {
		let loads = 0;
		getSurroundingChannelMessages.mockImplementation(async () => {
			loads++;
			// What the manager does around a load, until a runaway ends the spec
			if (loads < 6) {
				act(() => RoomHistoryManager.updateRoom(rid, { isLoading: true }));
				await Promise.resolve();
				act(() => RoomHistoryManager.updateRoom(rid, { isLoading: false }));
			}
		});
		const { result } = renderJumpTarget({ ...message, rid });

		await waitFor(() => expect(getSurroundingChannelMessages).toHaveBeenCalled());
		for (let tick = 0; tick < 5; tick++) {
			await act(async () => undefined);
		}

		expect(getSurroundingChannelMessages).toHaveBeenCalledTimes(1);
		expect(result.current.targetMessageId).toBe('msg-1');
	});

	it('waits for the load that is running before it loads around the target (R32)', async () => {
		act(() => RoomHistoryManager.updateRoom(rid, { isLoading: true }));
		const { result } = renderJumpTarget({ ...message, rid });
		await waitFor(() => expect(result.current.targetMessageId).toBe('msg-1'));
		expect(getSurroundingChannelMessages).not.toHaveBeenCalled();

		act(() => RoomHistoryManager.updateRoom(rid, { isLoading: false }));

		await waitFor(() => expect(getSurroundingChannelMessages).toHaveBeenCalledTimes(1));
	});

	it('loads nothing for a target that is already listed (R32)', async () => {
		const { result } = renderJumpTarget({ ...message, rid }, [{ _id: 'msg-1' }]);

		await waitFor(() => expect(result.current.targetMessageId).toBe('msg-1'));
		expect(getSurroundingChannelMessages).not.toHaveBeenCalled();
		expect(getSurroundingMessages).not.toHaveBeenCalled();
	});
});

it('targets the main message of a thread reply that does not show in the room (R33)', async () => {
	const { result } = renderJumpTarget({ ...message, rid, tmid: 'thread-1' });

	await waitFor(() => expect(result.current.targetMessageId).toBe('thread-1'));
});

it('targets the first unread message of a jump to unread (R21)', async () => {
	const { result } = renderJumpTarget({ ...message, _id: 'unread-1', rid }, [], { msg: 'unread-1', jumpContext: 'jumpToUnread' });

	await waitFor(() => expect(result.current.targetMessageId).toBe('unread-1'));
});

describe('a message of another room or a thread', () => {
	it('opens the room of a message of another room (R34)', async () => {
		const { result } = renderJumpTarget({ ...message, rid: 'room-2' });

		await waitFor(() => expect(goToRoom).toHaveBeenCalledWith('room-2'));
		expect(result.current.targetMessageId).toBeUndefined();
	});

	it('leaves a thread message of another room to the thread tab (R34)', async () => {
		const { result } = renderJumpTarget({ ...message, rid: 'room-2', tmid: 'thread-1', tshow: true });

		await waitFor(() => expect(result.current.targetMessageId).toBeUndefined());
		await act(async () => undefined);
		expect(goToRoom).not.toHaveBeenCalled();
	});
});

it('drops the jump when the message cannot be fetched (R35)', async () => {
	renderJumpTarget(new Error('error-invalid-message'));

	await waitFor(() => expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null));
});

describe('when the list reaches the target', () => {
	it('clears the parameter of the target reached and writes no highlight (R36)', async () => {
		const { result } = renderJumpTarget({ ...message, rid }, [{ _id: 'msg-1' }]);
		await waitFor(() => expect(result.current.targetMessageId).toBe('msg-1'));

		act(() => result.current.onTargetMessageReached('msg-1'));

		expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null);
		expect(getSnapshot()).toBeUndefined();
	});

	it('keeps the parameter when the target reached is the main message of a thread reply (R36)', async () => {
		const { result } = renderJumpTarget({ ...message, rid, tmid: 'thread-1' }, [{ _id: 'thread-1' }]);
		await waitFor(() => expect(result.current.targetMessageId).toBe('thread-1'));

		act(() => result.current.onTargetMessageReached('thread-1'));

		expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
	});

	it('jumps again to a link followed after its parameter was cleared (R38)', async () => {
		const { result, rerender } = renderJumpTarget({ ...message, rid });
		await waitFor(() => expect(getSurroundingChannelMessages).toHaveBeenCalledTimes(1));

		act(() => result.current.onTargetMessageReached('msg-1'));
		rerender({ listed: [] });
		await act(async () => undefined);
		act(() => RoomHistoryManager.updateRoom(rid, { isLoading: true }));
		act(() => RoomHistoryManager.updateRoom(rid, { isLoading: false }));

		await waitFor(() => expect(getSurroundingChannelMessages).toHaveBeenCalledTimes(2));
	});
});
