import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useRoomJumpTarget } from './useRoomJumpTarget';
import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';
import { setMessageJumpQueryStringParameter } from '../../../../lib/utils/setMessageJumpQueryStringParameter';
import { useGoToRoom } from '../../hooks/useGoToRoom';

jest.mock('../../../../lib/RoomHistoryManager', () => ({
	RoomHistoryManager: { getSurroundingChannelMessages: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../hooks/useGoToRoom', () => ({ useGoToRoom: jest.fn() }));

jest.mock('../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({ setMessageJumpQueryStringParameter: jest.fn() }));

const goToRoom = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
	jest.mocked(useGoToRoom).mockReturnValue(goToRoom);
});

afterEach(() => {
	jest.clearAllMocks();
});

const message = {
	_id: 'msg-1',
	ts: new Date('2024-01-01T00:00:00Z').toISOString(),
	u: { _id: 'user-1', username: 'john' },
	msg: 'Hello',
	_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
};

const renderJumpTarget = (rid: string, fetched: unknown, loaded: Pick<IMessage, '_id'>[] = []) =>
	renderHook(() => useRoomJumpTarget(rid, loaded as IMessage[]), {
		wrapper: mockAppRoot()
			.withRouter({ getSearchParameters: () => ({ msg: 'msg-1' }) })
			.withEndpoint('GET', '/v1/chat.getMessage', (() => {
				if (fetched instanceof Error) {
					throw fetched;
				}
				return { message: fetched };
			}) as any)
			.build(),
	});

it('targets a message of this room, and loads the messages around it when it is not loaded', async () => {
	const { result } = renderJumpTarget('room-1', { ...message, rid: 'room-1' });

	await waitFor(() => expect(result.current.targetMessageId).toBe('msg-1'));
	await waitFor(() => expect(RoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalledWith({ _id: 'msg-1', rid: 'room-1' }));
	expect(goToRoom).not.toHaveBeenCalled();
});

it('does not load anything for a target that is already loaded', async () => {
	const { result } = renderJumpTarget('room-1', { ...message, rid: 'room-1' }, [{ _id: 'msg-1' }]);

	await waitFor(() => expect(result.current.targetMessageId).toBe('msg-1'));
	expect(RoomHistoryManager.getSurroundingChannelMessages).not.toHaveBeenCalled();
});

it('opens the room of a message that belongs to another room', async () => {
	const { result } = renderJumpTarget('room-1', { ...message, rid: 'room-2' });

	await waitFor(() => expect(goToRoom).toHaveBeenCalledWith('room-2'));
	expect(result.current.targetMessageId).toBeUndefined();
});

it("targets the thread's main message for a reply not shown in the room", async () => {
	const { result } = renderJumpTarget('room-1', { ...message, rid: 'room-1', tmid: 'thread-1' });

	await waitFor(() => expect(result.current.targetMessageId).toBe('thread-1'));
});

it('leaves a thread message of another room to the thread jump', async () => {
	renderJumpTarget('room-1', { ...message, rid: 'room-2', tmid: 'thread-1', tshow: true });

	await waitFor(() => expect(goToRoom).not.toHaveBeenCalled());
});

it('drops the jump when the message cannot be fetched', async () => {
	renderJumpTarget('room-1', new Error('error-invalid-message'));

	await waitFor(() => expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null));
});

it('clears the search parameter once the list reached the target', async () => {
	const { result } = renderJumpTarget('room-1', { ...message, rid: 'room-1' }, [{ _id: 'msg-1' }]);

	await waitFor(() => expect(result.current.targetMessageId).toBe('msg-1'));
	result.current.onTargetMessageReached('msg-1');

	expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null);
});
