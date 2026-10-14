import type { ISubscription } from '@rocket.chat/core-typings';

import { ReadStateManager } from './readStateManager';
import { RoomHistoryManager } from '../RoomHistoryManager';
import { sdk } from '../SDKClient';

jest.mock('../SDKClient', () => ({
	sdk: { rest: { post: jest.fn(() => Promise.resolve()) } },
}));

jest.mock('../RoomHistoryManager', () => ({
	RoomHistoryManager: {
		getRoom: jest.fn(() => ({ unreadNotLoaded: 0 })),
		updateRoom: jest.fn(),
		on: jest.fn(),
	},
}));

jest.mock('../LegacyRoomManager', () => ({
	LegacyRoomManager: { setPropertyByRid: jest.fn() },
}));

jest.mock('../../stores', () => ({
	Messages: { state: { findFirst: jest.fn(() => ({ _id: 'first-unread' })) } },
}));

jest.mock('../user', () => ({
	getUserId: () => 'user-id',
}));

const createManager = () => {
	const manager = new ReadStateManager('room-id');
	manager.updateSubscription({ rid: 'room-id', unread: 3, alert: true, ls: new Date('2026-01-01') } as ISubscription);
	return manager;
};

describe('ReadStateManager.attemptMarkAsRead', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(document, 'hasFocus').mockReturnValue(true);
		(RoomHistoryManager.getRoom as jest.Mock).mockReturnValue({ unreadNotLoaded: 0 });
	});

	it('should not mark as read while the unread mark is out of view', () => {
		const manager = createManager();
		manager.setIsUnreadMarkVisibleCallback(() => false);

		manager.attemptMarkAsRead();

		expect(sdk.rest.post).not.toHaveBeenCalled();
	});

	it('should mark as read once the unread mark is visible', () => {
		const manager = createManager();
		manager.setIsUnreadMarkVisibleCallback(() => true);

		manager.attemptMarkAsRead();

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/subscriptions.read', { rid: 'room-id' });
	});

	it('should mark as read when the user reached the latest message, even with the unread mark out of view', () => {
		const manager = createManager();
		manager.setIsUnreadMarkVisibleCallback(() => false);
		manager.setHasUserReachedLatestMessageCallback(() => true);

		manager.attemptMarkAsRead();

		expect(sdk.rest.post).toHaveBeenCalledWith('/v1/subscriptions.read', { rid: 'room-id' });
	});

	it('should mark as read when the user reached the latest message, even with unread messages not loaded', () => {
		(RoomHistoryManager.getRoom as jest.Mock).mockReturnValue({ unreadNotLoaded: 10 });
		const manager = createManager();
		manager.setHasUserReachedLatestMessageCallback(() => true);

		manager.attemptMarkAsRead();

		expect(sdk.rest.post).toHaveBeenCalled();
	});

	it('should not mark as read without window focus', () => {
		(document.hasFocus as jest.Mock).mockReturnValue(false);
		const manager = createManager();
		manager.setHasUserReachedLatestMessageCallback(() => true);

		manager.attemptMarkAsRead();

		expect(sdk.rest.post).not.toHaveBeenCalled();
	});
});
