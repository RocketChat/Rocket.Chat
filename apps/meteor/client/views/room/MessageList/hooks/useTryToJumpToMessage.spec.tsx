import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import type { MutableRefObject } from 'react';
import type { WindowVirtualizerHandle } from 'virtua';

import useTryToJumpToMessage from './useTryToJumpToMessage';
import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';
import { RoomContext } from '../../contexts/RoomContext';
import { useGoToRoom } from '../../hooks/useGoToRoom';

jest.mock('../../../../lib/RoomHistoryManager', () => ({
	RoomHistoryManager: {
		getSurroundingChannelMessages: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('../../hooks/useGoToRoom', () => ({
	useGoToRoom: jest.fn(),
}));

jest.mock('../../../../providers/RouterProvider', () => ({
	router: {
		getSearchParameters: jest.fn().mockReturnValue({}),
		navigate: jest.fn(),
	},
}));

const mockedRoomHistoryManager = jest.mocked(RoomHistoryManager);
const mockedGoToRoom = jest.fn().mockResolvedValue(undefined);
const mockedSetIsJumpingToMessage = jest.fn();

beforeEach(() => {
	jest.mocked(useGoToRoom).mockReturnValue(mockedGoToRoom);
	mockedRoomHistoryManager.getSurroundingChannelMessages.mockResolvedValue(undefined);
});

afterEach(() => {
	jest.clearAllMocks();
});

const renderJumpHook = (rid: string, message: unknown) =>
	renderHook(
		() =>
			useTryToJumpToMessage({
				rid,
				virtualizerRef: { current: { scrollToIndex: jest.fn() } } as unknown as MutableRefObject<WindowVirtualizerHandle | null>,
				setIsJumpingToMessage: mockedSetIsJumpingToMessage,
				messages: [{ _id: 'another-msg' }],
			}),
		{
			wrapper: mockAppRoot()
				.withRouter({ getSearchParameters: () => ({ msg: 'msg-1' }) })
				.withEndpoint('GET', '/v1/chat.getMessage', (() => {
					if (message instanceof Error) {
						throw message;
					}
					return { message };
				}) as any)
				.wrap((children) => (
					<RoomContext.Provider
						value={
							{
								rid,
								room: { _id: rid, t: 'c', name: 'general' },
								hasMorePreviousMessages: false,
								hasMoreNextMessages: false,
								isLoadingMoreMessages: false,
							} as any
						}
					>
						{children}
					</RoomContext.Provider>
				))
				.build(),
		},
	);

const message = {
	_id: 'msg-1',
	ts: new Date('2024-01-01T00:00:00Z').toISOString(),
	u: { _id: 'user-1', username: 'john' },
	msg: 'Hello',
	_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
};

it('should navigate to the message room when the message belongs to another room', async () => {
	renderJumpHook('room-1', { ...message, rid: 'room-2' });

	await waitFor(() => expect(mockedGoToRoom).toHaveBeenCalledWith('room-2'));

	expect(mockedRoomHistoryManager.getSurroundingChannelMessages).not.toHaveBeenCalled();
});

it('should load surrounding messages in place when the message belongs to the current room', async () => {
	renderJumpHook('room-1', { ...message, rid: 'room-1' });

	await waitFor(() => expect(mockedRoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalled());

	expect(mockedGoToRoom).not.toHaveBeenCalled();
});

it('should discard the jump when the target message cannot be fetched', async () => {
	renderJumpHook('room-1', new Error('error-invalid-message'));

	await waitFor(() => expect(mockedSetIsJumpingToMessage).toHaveBeenCalledWith(false));

	expect(mockedRoomHistoryManager.getSurroundingChannelMessages).not.toHaveBeenCalled();
	expect(mockedGoToRoom).not.toHaveBeenCalled();
});

it('should not navigate for a cross-room thread message, as it is handled by useTryToJumpToThreadMessage', async () => {
	renderJumpHook('room-1', { ...message, rid: 'room-2', tmid: 'parent-msg-1', tshow: true });

	await waitFor(() => expect(mockedSetIsJumpingToMessage).toHaveBeenCalledWith(true));

	expect(mockedGoToRoom).not.toHaveBeenCalled();
	expect(mockedRoomHistoryManager.getSurroundingChannelMessages).not.toHaveBeenCalled();
});

it('should request surrounding messages only once while the target stays out of the list', async () => {
	const { rerender } = renderJumpHook('room-1', { ...message, rid: 'room-1' });

	await waitFor(() => expect(mockedRoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalledTimes(1));

	rerender();
	rerender();

	expect(mockedRoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalledTimes(1);
});

it('should stop jumping when the surrounding messages request fails', async () => {
	mockedRoomHistoryManager.getSurroundingChannelMessages.mockRejectedValue(new Error('too-many-requests'));

	const { rerender } = renderJumpHook('room-1', { ...message, rid: 'room-1' });

	await waitFor(() => expect(mockedSetIsJumpingToMessage).toHaveBeenLastCalledWith(false));

	rerender();

	expect(mockedRoomHistoryManager.getSurroundingChannelMessages).toHaveBeenCalledTimes(1);
});
