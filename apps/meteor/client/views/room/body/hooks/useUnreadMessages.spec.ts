import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useHandleUnread } from './useUnreadMessages';

const lastSeen = new Date('2026-01-01T00:00:00Z');

const unreadMessages = Array.from({ length: 5 }, (_, index) => ({
	_id: `message-${index}`,
	rid: 'room-id',
	ts: new Date(lastSeen.getTime() + (index + 1) * 1000),
}));

jest.mock('../../../../lib/RoomHistoryManager', () => ({
	RoomHistoryManager: { getRoom: () => ({ firstUnread: undefined }) },
	useRoomHistoryState: () => 0,
}));

jest.mock('../../../../lib/RoomManager', () => ({
	useOpenedRoomUnreadSince: () => lastSeen,
}));

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { isRouteNameKnown: () => true },
}));

jest.mock('../../../../stores', () => ({
	Messages: {
		use: (selector: (state: unknown) => unknown) =>
			selector({
				findFirst: () => undefined,
				filter: (predicate: (record: unknown) => boolean) => unreadMessages.filter(predicate),
			}),
	},
}));

jest.mock('../../contexts/ChatContext', () => ({
	useChat: () => ({ readStateManager: { markAsRead: jest.fn(), attemptMarkAsRead: jest.fn() } }),
}));

describe('useHandleUnread', () => {
	it('should count every loaded unread message before the list reports its top visible message', () => {
		const { result } = renderHook(() => useHandleUnread({ _id: 'room-id' } as IRoom, { rid: 'room-id', ls: lastSeen } as ISubscription), {
			wrapper: mockAppRoot().build(),
		});

		expect(result.current.counter[0]).toBe(5);

		act(() => result.current.setLastMessageDate(unreadMessages[1].ts));

		expect(result.current.counter[0]).toBe(2);
	});
});
