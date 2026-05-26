import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import useTryToJumpToThreadMessage from './useTryToJumpToThreadMessage';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';

jest.mock('../../../../../app/ui-utils/client', () => ({
	RoomHistoryManager: {
		getSurroundingMessages: jest.fn().mockResolvedValue(undefined),
		isLoaded: jest.fn().mockReturnValue(false),
		getMore: jest.fn().mockResolvedValue(undefined),
	},
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

const mockedRoomHistoryManager = jest.mocked(RoomHistoryManager);

afterEach(() => {
	jest.clearAllMocks();
});

describe('useTryToJumpToThreadMessage', () => {
	describe('early return when msg param is absent or jumpContext is jumpToUnread', () => {
		it('should not navigate or load messages when msg search parameter is absent', () => {
			const endpointSpy = jest.fn();

			renderHook(() => useTryToJumpToThreadMessage(), {
				wrapper: mockAppRoot().withEndpoint('GET', '/v1/chat.getMessage', endpointSpy).build(),
			});

			expect(endpointSpy).not.toHaveBeenCalled();
			expect(mockedRoomHistoryManager.getSurroundingMessages).not.toHaveBeenCalled();
			expect(mockedRoomHistoryManager.getMore).not.toHaveBeenCalled();
		});

		it('should not navigate or load messages when jumpContext is jumpToUnread', async () => {
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
				expect(mockedRoomHistoryManager.getMore).not.toHaveBeenCalled();
			});

			expect(mockedRoomHistoryManager.getSurroundingMessages).not.toHaveBeenCalled();
			expect(mockedRoomHistoryManager.getMore).not.toHaveBeenCalled();
		});
	});

	describe('when jumpContext is absent', () => {
		it('should load more messages when jumpContext is null', async () => {
			const threadMessage = {
				_id: 'msg-1',
				rid: 'room-1',
				tmid: 'parent-msg-1',
				ts: new Date('2024-01-01T00:00:00Z').toISOString(),
				u: { _id: 'user-1', username: 'john' },
				msg: 'Thread reply',
				_updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
			};

			mockedRoomHistoryManager.isLoaded.mockReturnValue(false);

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
				expect(mockedRoomHistoryManager.getMore).toHaveBeenCalledWith('room-1');
			});

			expect(mockedRoomHistoryManager.getSurroundingMessages).not.toHaveBeenCalled();
		});
	});
});
