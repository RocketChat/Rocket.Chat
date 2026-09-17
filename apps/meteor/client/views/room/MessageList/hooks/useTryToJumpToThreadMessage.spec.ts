import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import useTryToJumpToThreadMessage from './useTryToJumpToThreadMessage';
import { RoomManager } from '../../../../lib/RoomManager';
import { useGoToRoom } from '../../hooks/useGoToRoom';

jest.mock('../../hooks/useGoToRoom', () => ({
	useGoToRoom: jest.fn(),
}));

jest.mock('../../../../lib/RoomManager', () => ({
	RoomManager: {
		opened: undefined as string | undefined,
	},
}));

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: {
		openRouteLink: jest.fn(),
	},
}));

jest.mock('../../../../providers/RouterProvider', () => ({
	router: {
		getSearchParameters: jest.fn().mockReturnValue({}),
		getRouteParameters: jest.fn().mockReturnValue({}),
	},
}));

jest.mock('../../../../stores', () => ({
	Subscriptions: {
		state: {
			find: jest.fn().mockReturnValue(undefined),
		},
	},
}));

const mockedUseGoToRoom = jest.mocked(useGoToRoom);
const mockedGoToRoom = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
	mockedUseGoToRoom.mockReturnValue(mockedGoToRoom);
});

afterEach(() => {
	jest.clearAllMocks();
	(RoomManager as { opened: string | undefined }).opened = undefined;
});

describe('useTryToJumpToThreadMessage', () => {
	describe('early return when msg param is absent or jumpContext is jumpToUnread', () => {
		it('should not navigate when msg search parameter is absent', () => {
			const endpointSpy = jest.fn();

			renderHook(() => useTryToJumpToThreadMessage(), {
				wrapper: mockAppRoot().withEndpoint('GET', '/v1/chat.getMessage', endpointSpy).build(),
			});

			expect(endpointSpy).not.toHaveBeenCalled();
			expect(mockedGoToRoom).not.toHaveBeenCalled();
		});

		it('should not navigate when jumpContext is jumpToUnread', async () => {
			const threadMessage = {
				_id: 'msg-1',
				rid: 'room-1',
				tmid: 'parent-msg-1',
				ts: new Date('2024-01-01T00:00:00Z').toISOString(),
				u: { _id: 'user-1', username: 'john' },
				msg: 'Thread reply',
				_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
			};

			const endpointSpy = jest.fn().mockResolvedValue({ message: threadMessage });

			renderHook(() => useTryToJumpToThreadMessage(), {
				wrapper: mockAppRoot()
					.withRouter({ getSearchParameters: () => ({ msg: 'msg-1', jumpContext: 'jumpToUnread' }) })
					.withEndpoint('GET', '/v1/chat.getMessage', endpointSpy)
					.withMethod('getRoomById', () => ({ _id: 'room-1', t: 'c', name: 'general' }) as any)
					.build(),
			});

			await waitFor(() => {
				expect(endpointSpy).toHaveBeenCalledWith({ msgId: 'msg-1' });
			});

			await waitFor(async () => {
				await new Promise((resolve) => setTimeout(resolve, 300));
				expect(mockedGoToRoom).not.toHaveBeenCalled();
			});
		});
	});

	describe('when jumpContext is absent', () => {
		it('should open the thread when jumpContext is null', async () => {
			const threadMessage = {
				_id: 'msg-1',
				rid: 'room-1',
				tmid: 'parent-msg-1',
				ts: new Date('2024-01-01T00:00:00Z').toISOString(),
				u: { _id: 'user-1', username: 'john' },
				msg: 'Thread reply',
				_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
			};

			const endpointSpy = jest.fn().mockResolvedValue({ message: threadMessage });

			renderHook(() => useTryToJumpToThreadMessage(), {
				wrapper: mockAppRoot()
					.withRouter({ getSearchParameters: () => ({ msg: 'msg-1' }) })
					.withEndpoint('GET', '/v1/chat.getMessage', endpointSpy)
					.withMethod('getRoomById', () => ({ _id: 'room-1', t: 'c', name: 'general' }) as any)
					.build(),
			});

			await waitFor(() => {
				expect(endpointSpy).toHaveBeenCalledWith({ msgId: 'msg-1' });
			});

			await waitFor(() => {
				expect(mockedGoToRoom).toHaveBeenCalledWith('room-1', {
					routeParamsOverrides: { tab: 'thread', context: 'parent-msg-1' },
					replace: false,
				});
			});
		});
	});
});
