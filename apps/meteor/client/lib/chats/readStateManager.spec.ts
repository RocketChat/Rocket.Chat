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

const initialFindFirst = Messages.state.findFirst;

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
	Messages.use.setState({ findFirst: initialFindFirst });
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

		expect(roomMessageCallback).toBeDefined();
		roomMessageCallback?.(realtimeMessage);

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
		const restoreSpy = registerCleanup(() => {
			findFirstSpy.mockRestore();
			Messages.use.setState({ findFirst: initialFindFirst });
		});

		const manager = new ReadStateManager('room-id');

		manager.updateSubscription({
			rid: 'room-id',
			unread: 1,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		findFirstSpy.mockClear();

		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		expect(roomMessageCallback).toBeDefined();
		roomMessageCallback?.({
			_id: 'own-msg-id',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'Own message',
			u: { _id: 'user-id', username: 'user' },
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		});

		expect(findFirstSpy).not.toHaveBeenCalled();

		unsubscribe();
		restoreSpy();
	});

	it('preserves the existing first unread marker when a real-time message arrives while the window is focused', () => {
		let roomMessageCallback: ((msg: IMessage) => void) | undefined;

		(RoomHistoryManager.subscribeToRoomMessages as jest.Mock).mockImplementation((_rid: string, cb: (msg: IMessage) => void) => {
			roomMessageCallback = cb;
			return jest.fn();
		});

		const firstUnreadMessage: IMessage = {
			_id: 'first-unread',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'First unread message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		};

		Messages.state.replaceAll([firstUnreadMessage]);

		const manager = new ReadStateManager('room-id');

		manager.updateSubscription({
			rid: 'room-id',
			unread: 1,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBe('first-unread');

		const findFirstSpy = jest.spyOn(Messages.state, 'findFirst');
		const restoreSpy = registerCleanup(() => {
			findFirstSpy.mockRestore();
			Messages.use.setState({ findFirst: initialFindFirst });
		});
		findFirstSpy.mockClear();

		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		const realtimeMessage: IMessage = {
			_id: 'realtime-msg-id',
			rid: 'room-id',
			ts: new Date('2026-01-03T00:00:00.000Z'),
			msg: 'Another incoming message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-03T00:00:00.000Z'),
		};

		Messages.state.store(realtimeMessage);
		findFirstSpy.mockClear();

		expect(roomMessageCallback).toBeDefined();
		roomMessageCallback?.(realtimeMessage);

		expect(manager.getFirstUnreadRecordId()).toBe('first-unread');
		expect(findFirstSpy).not.toHaveBeenCalled();

		unsubscribe();
		restoreSpy();
	});

	it('updates the first unread marker after historical messages are loaded', () => {
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

	it('does not emit unread-state-change when the first unread record ID remains stable', () => {
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

	it('updates firstUnreadRecordId when the first unread message is deleted', () => {
		const msg1: IMessage = {
			_id: 'msg-1',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'First unread message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		};
		const msg2: IMessage = {
			_id: 'msg-2',
			rid: 'room-id',
			ts: new Date('2026-01-03T00:00:00.000Z'),
			msg: 'Second unread message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-03T00:00:00.000Z'),
		};
		const unrelatedRoomMsg: IMessage = {
			_id: 'msg-other-room',
			rid: 'other-room-id',
			ts: new Date('2026-01-02T12:00:00.000Z'),
			msg: 'Unrelated room message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T12:00:00.000Z'),
		};

		Messages.state.replaceAll([msg1, msg2, unrelatedRoomMsg]);

		const manager = new ReadStateManager('room-id');
		const listener = jest.fn();
		const unsubListener = registerCleanup(manager.onUnreadStateChange(listener));

		manager.updateSubscription({
			rid: 'room-id',
			unread: 2,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBe('msg-1');
		expect(listener).toHaveBeenCalledWith('msg-1');
		listener.mockClear();

		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		// Deleting an unrelated message in another room does not affect the marker
		Messages.state.delete('msg-other-room');
		expect(manager.getFirstUnreadRecordId()).toBe('msg-1');
		expect(listener).not.toHaveBeenCalled();

		// Deleting the first unread message updates marker to the second unread message
		Messages.state.delete('msg-1');
		expect(manager.getFirstUnreadRecordId()).toBe('msg-2');
		expect(listener).toHaveBeenCalledWith('msg-2');
		listener.mockClear();

		// Deleting the remaining unread message clears the marker
		Messages.state.delete('msg-2');
		expect(manager.getFirstUnreadRecordId()).toBeUndefined();
		expect(listener).toHaveBeenCalledWith(undefined);

		unsubscribe();
		unsubListener();
	});

	it('does not recalculate when a message other than the first unread message is deleted', () => {
		const msg1: IMessage = {
			_id: 'msg-1',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'First unread message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		};
		const msg2: IMessage = {
			_id: 'msg-2',
			rid: 'room-id',
			ts: new Date('2026-01-03T00:00:00.000Z'),
			msg: 'Second unread message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-03T00:00:00.000Z'),
		};
		const unrelatedRoomMsg: IMessage = {
			_id: 'msg-other-room',
			rid: 'other-room-id',
			ts: new Date('2026-01-02T12:00:00.000Z'),
			msg: 'Unrelated room message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T12:00:00.000Z'),
		};

		Messages.state.replaceAll([msg1, msg2, unrelatedRoomMsg]);

		const manager = new ReadStateManager('room-id');
		manager.updateSubscription({
			rid: 'room-id',
			unread: 2,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBe('msg-1');

		const findFirstSpy = jest.spyOn(Messages.state, 'findFirst');
		const restoreSpy = registerCleanup(() => {
			findFirstSpy.mockRestore();
			Messages.use.setState({ findFirst: initialFindFirst });
		});
		findFirstSpy.mockClear();

		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		// Deleting unrelated message from another room does not call findFirst
		Messages.state.delete('msg-other-room');
		expect(findFirstSpy).not.toHaveBeenCalled();

		// Deleting a later message in the same room does not call findFirst
		Messages.state.delete('msg-2');
		expect(findFirstSpy).not.toHaveBeenCalled();
		expect(manager.getFirstUnreadRecordId()).toBe('msg-1');

		unsubscribe();
		restoreSpy();
	});

	it('stops listening to store deletions after unsubscribe', () => {
		const msg1: IMessage = {
			_id: 'msg-1',
			rid: 'room-id',
			ts: new Date('2026-01-02T00:00:00.000Z'),
			msg: 'First unread message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-02T00:00:00.000Z'),
		};
		const msg2: IMessage = {
			_id: 'msg-2',
			rid: 'room-id',
			ts: new Date('2026-01-03T00:00:00.000Z'),
			msg: 'Second unread message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-03T00:00:00.000Z'),
		};

		Messages.state.replaceAll([msg1, msg2]);

		const manager = new ReadStateManager('room-id');
		manager.updateSubscription({
			rid: 'room-id',
			unread: 2,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		expect(manager.getFirstUnreadRecordId()).toBe('msg-1');

		const unsubscribe = registerCleanup(manager.subscribeToMessages());
		unsubscribe();

		Messages.state.delete('msg-1');
		expect(manager.getFirstUnreadRecordId()).toBe('msg-1');
	});
	it('recalculates firstUnreadRecordId when a real-time message arrives while focused if the marker message was deleted', () => {
		let roomMessageCallback: ((msg: IMessage) => void) | undefined;

		const hasFocusSpy = jest.spyOn(document, 'hasFocus').mockReturnValue(true);
		const restoreHasFocusSpy = registerCleanup(() => hasFocusSpy.mockRestore());
		(RoomHistoryManager.subscribeToRoomMessages as jest.Mock).mockImplementation((_rid: string, cb: (msg: IMessage) => void) => {
			roomMessageCallback = cb;
			return jest.fn();
		});

		const manager = new ReadStateManager('room-id');

		manager.updateSubscription({
			rid: 'room-id',
			unread: 1,
			alert: true,
			ls: new Date('2026-01-01T00:00:00.000Z'),
		} as ISubscription);

		// Simulate a stale marker whose message has already been deleted.
		(manager as any).firstUnreadRecordId = 'stale-deleted-id';

		const realtimeMessage: IMessage = {
			_id: 'realtime-msg-id',
			rid: 'room-id',
			ts: new Date('2026-01-03T00:00:00.000Z'),
			msg: 'New incoming message',
			u: { _id: 'other-user', username: 'other.user' },
			_updatedAt: new Date('2026-01-03T00:00:00.000Z'),
		};

		// Seed the message BEFORE subscribing to the store.
		// This prevents the store subscription from triggering the recalculation.
		Messages.state.store(realtimeMessage);

		const unsubscribe = registerCleanup(manager.subscribeToMessages());

		expect(document.hasFocus()).toBe(true);
		expect(manager.getFirstUnreadRecordId()).toBe('stale-deleted-id');

		expect(roomMessageCallback).toBeDefined();
		roomMessageCallback?.(realtimeMessage);

		// The real-time callback must repair the stale marker,
		// even while the window is focused.
		expect(manager.getFirstUnreadRecordId()).toBe('realtime-msg-id');

		unsubscribe();
		restoreHasFocusSpy();
	});
});
