import type { IMessage, ISubscription } from '@rocket.chat/core-typings';

import { Messages } from '../../stores';
import { LegacyRoomManager } from '../LegacyRoomManager';
import { RoomHistoryManager } from '../RoomHistoryManager';
import { sdk } from '../SDKClient';
import { ReadStateManager } from './readStateManager';

jest.mock('../SDKClient', () => ({
	sdk: { rest: { post: jest.fn(() => Promise.resolve()) } },
}));

jest.mock('../RoomHistoryManager', () => ({
	RoomHistoryManager: {
		getRoom: jest.fn(() => ({ unreadNotLoaded: 0 })),
		updateRoom: jest.fn(),
		on: jest.fn(),
		subscribeToRoomMessages: jest.fn(),
	},
}));

jest.mock('../LegacyRoomManager', () => ({
	LegacyRoomManager: { setPropertyByRid: jest.fn() },
}));

jest.mock('../../stores', () => {
	const { Messages } = jest.requireActual('../../stores/Messages');
	return { Messages };
});

jest.mock('../user', () => ({
	getUserId: () => 'user-id',
}));

const defaultUnreadMessage: IMessage = {
	_id: 'first-unread',
	rid: 'room-id',
	ts: new Date('2026-01-02T00:00:00.000Z'),
	msg: 'default unread message',
	u: { _id: 'other-user', username: 'other.user' },
	_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

const createManager = () => {
	const manager = new ReadStateManager('room-id');
	manager.updateSubscription({
		rid: 'room-id',
		unread: 3,
		alert: true,
		ls: new Date('2026-01-01T00:00:00.000Z'),
	} as ISubscription);
	return manager;
};

let cleanups: (() => void)[] = [];

const registerCleanup = (cleanup: () => void): (() => void) => {
	let executed = false;
	const safeCleanup = () => {
		if (executed) {
			return;
		}
		executed = true;
		cleanup();
	};
	cleanups.push(safeCleanup);
	return safeCleanup;
};

beforeEach(() => {
	jest.clearAllMocks();
	(RoomHistoryManager.on as jest.Mock).mockReset().mockImplementation(() => jest.fn());
	(RoomHistoryManager.subscribeToRoomMessages as jest.Mock).mockReset().mockImplementation(() => jest.fn());
	(RoomHistoryManager.getRoom as jest.Mock).mockReset().mockReturnValue({ unreadNotLoaded: 0 });
	(RoomHistoryManager.updateRoom as jest.Mock).mockReset();
	(LegacyRoomManager.setPropertyByRid as jest.Mock).mockReset();
	(sdk.rest.post as jest.Mock).mockReset().mockResolvedValue(undefined);
	jest.spyOn(document, 'hasFocus').mockReturnValue(true);
});

afterEach(() => {
	cleanups.forEach((cleanup) => {
		try {
			cleanup();
		} catch {
			// ignore cleanup error
		}
	});
	cleanups = [];
	Messages.state.replaceAll([]);
	jest.restoreAllMocks();
});

describe('ReadStateManager.attemptMarkAsRead', () => {
	beforeEach(() => {
		Messages.state.replaceAll([defaultUnreadMessage]);
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

describe('ReadStateManager.subscribeToMessages', () => {
	it('subscribes to both loaded-messages and room-specific message stream', () => {
		const offLoaded = jest.fn();
		const offRoom = jest.fn();
		(RoomHistoryManager.on as jest.Mock).mockReturnValue(offLoaded);
		(RoomHistoryManager.subscribeToRoomMessages as jest.Mock).mockReturnValue(offRoom);

		const manager = new ReadStateManager('room-id');
		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		expect(RoomHistoryManager.on).toHaveBeenCalledWith('loaded-messages', expect.any(Function));
		expect(RoomHistoryManager.subscribeToRoomMessages).toHaveBeenCalledWith('room-id', expect.any(Function));

		unsubscribe();
		expect(offLoaded).toHaveBeenCalledTimes(1);
		expect(offRoom).toHaveBeenCalledTimes(1);
	});

	it('updates firstUnreadRecordId when a real-time message arrives after subscription unread arrived first (race condition)', () => {
		let roomMessageCallback: ((msg: IMessage) => void) | undefined;
		(RoomHistoryManager.subscribeToRoomMessages as jest.Mock).mockImplementation((rid: string, cb: (msg: IMessage) => void) => {
			if (rid === 'room-id') {
				roomMessageCallback = cb;
			}
			return jest.fn();
		});

		// 1. Ensure the store is initially empty for the target room
		Messages.state.replaceAll([]);

		const manager = new ReadStateManager('room-id');
		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		// 2. Subscription arrives first indicating unread messages, but message is not in Messages.state yet
		manager.updateSubscription({
			rid: 'room-id',
			unread: 1,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBeUndefined();

		// 3. A realistic valid IMessage fixture is inserted using the actual Messages.state.store() API
		const realtimeMessage: IMessage = {
			_id: 'realtime-msg-id',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'Realtime incoming message',
			u: {
				_id: 'other-user',
				username: 'other.user',
			},
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		};
		Messages.state.store(realtimeMessage);

		// 4. Room-specific callback is invoked
		expect(roomMessageCallback).toBeDefined();
		roomMessageCallback?.(realtimeMessage);

		// 5. ReadStateManager recalculates and locates the real stored message via findFirst
		expect(manager.getFirstUnreadRecordId()).toBe('realtime-msg-id');

		unsubscribe();
	});

	it('ignores own messages in real-time message callback without recalculating', () => {
		let roomMessageCallback: ((msg: IMessage) => void) | undefined;
		(RoomHistoryManager.subscribeToRoomMessages as jest.Mock).mockImplementation((_rid: string, cb: (msg: IMessage) => void) => {
			roomMessageCallback = cb;
			return jest.fn();
		});

		const findFirstSpy = jest.spyOn(Messages.state, 'findFirst');
		const restoreSpy = registerCleanup(() => findFirstSpy.mockRestore());
		findFirstSpy.mockClear();

		const manager = new ReadStateManager('room-id');
		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		// Own message arrives
		roomMessageCallback?.({
			_id: 'own-msg-id',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'Own message',
			u: { _id: 'user-id', username: 'user' }, // matches getUserId() mock
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		});

		expect(findFirstSpy).not.toHaveBeenCalled();
		unsubscribe();
		restoreSpy();
	});

	it('recalculates firstUnreadRecordId when loaded-messages emits (historical pagination)', () => {
		let loadedMessagesCallback: (() => void) | undefined;
		(RoomHistoryManager.on as jest.Mock).mockImplementation((event: string, cb: () => void) => {
			if (event === 'loaded-messages') {
				loadedMessagesCallback = cb;
			}
			return jest.fn();
		});

		Messages.state.replaceAll([]);

		const manager = new ReadStateManager('room-id');
		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		manager.updateSubscription({
			rid: 'room-id',
			unread: 1,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBeUndefined();

		// Historical pagination completes and stores message in Messages.state
		const historyMessage: IMessage = {
			_id: 'history-msg-id',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'Historical message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		};
		Messages.state.store(historyMessage);
		loadedMessagesCallback?.();

		expect(manager.getFirstUnreadRecordId()).toBe('history-msg-id');

		unsubscribe();
	});

	it('does not emit unread-state-change when the firstUnreadRecordId has not changed', () => {
		(document.hasFocus as jest.Mock).mockReturnValue(false);

		const stableMessage: IMessage = {
			_id: 'stable-id',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'Stable message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		};
		Messages.state.replaceAll([stableMessage]);

		const manager = new ReadStateManager('room-id');
		const listener = jest.fn();
		const unsubListener = registerCleanup(manager.onUnreadStateChange(listener));

		// First update sets firstUnreadRecordId to 'stable-id' -> emits once
		manager.updateSubscription({
			rid: 'room-id',
			unread: 1,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBe('stable-id');
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith('stable-id');
		listener.mockClear();

		// Second update results in the same 'stable-id' -> should not emit again
		manager.updateSubscription({
			rid: 'room-id',
			unread: 2,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBe('stable-id');
		expect(listener).not.toHaveBeenCalled();

		unsubListener();
	});
});
