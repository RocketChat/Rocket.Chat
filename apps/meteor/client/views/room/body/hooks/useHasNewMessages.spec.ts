import type { IEditedMessage, IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { renderHook, act } from '@testing-library/react';

import { useHasNewMessages } from './useHasNewMessages';

jest.mock('../../contexts/ChatContext', () => ({
	useChat: () => ({
		composer: { focus: jest.fn() },
	}),
}));

jest.mock('../../../../../app/ui-utils/client', () => ({
	RoomHistoryManager: {
		clear: jest.fn(),
		getMoreIfIsEmpty: jest.fn(),
	},
}));

describe('useHasNewMessages', () => {
	const mockScrollBehavior = {
		sendToBottom: jest.fn(),
		sendToBottomIfNecessary: jest.fn(),
		isAtBottom: jest.fn(() => true),
	};

	const atBottomRef = { current: true };
	const rid = 'room-id';
	const uid = 'current-user-id';

	beforeEach(() => {
		jest.clearAllMocks();
		clientCallbacks.remove('streamNewMessage', rid);
		clientCallbacks.remove('afterSaveMessage', rid);
	});

	afterEach(() => {
		clientCallbacks.remove('streamNewMessage', rid);
		clientCallbacks.remove('afterSaveMessage', rid);
	});

	it('should NOT show new messages button when user sends their own message', () => {
		const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, mockScrollBehavior), { wrapper: mockAppRoot().build() });

		const ownMsg: IMessage = {
			_id: 'msg-1',
			rid,
			u: { _id: uid, username: 'current-user', name: 'Current User' },
			msg: 'Hello',
			ts: new Date(),
			_updatedAt: new Date(),
		};

		const callbacks = clientCallbacks.getCallbacks('streamNewMessage');
		act(() => {
			callbacks.forEach((callback) => callback(ownMsg));
		});
		expect(result.current.hasNewMessages).toBe(false);
	});

	it('should NOT show new messages button when user sends own message during race condition (not at bottom)', () => {
		const scrollBehavior = {
			...mockScrollBehavior,
			isAtBottom: jest.fn(() => false),
		};

		const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollBehavior), { wrapper: mockAppRoot().build() });

		const ownMsg: IMessage = {
			_id: 'msg-race',
			rid,
			u: { _id: uid, username: 'current-user', name: 'Current User' },
			msg: 'Message sent during scroll',
			ts: new Date(),
			_updatedAt: new Date(),
		};

		const callbacks = clientCallbacks.getCallbacks('streamNewMessage');
		act(() => {
			callbacks.forEach((callback) => callback(ownMsg));
		});
		expect(result.current.hasNewMessages).toBe(false);
	});

	it('should show new messages button when another user sends a message and user is NOT at bottom', () => {
		const scrollBehavior = {
			...mockScrollBehavior,
			isAtBottom: jest.fn(() => false),
		};

		const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollBehavior), { wrapper: mockAppRoot().build() });

		const otherUserMsg: IMessage = {
			_id: 'msg-2',
			rid,
			u: { _id: 'other-user-id', username: 'other-user', name: 'Other User' },
			msg: 'Hello from another user',
			ts: new Date(),
			_updatedAt: new Date(),
		};

		const callbacks = clientCallbacks.getCallbacks('streamNewMessage');
		act(() => {
			callbacks.forEach((callback) => callback(otherUserMsg));
		});
		expect(result.current.hasNewMessages).toBe(true);
	});

	it('should NOT show new messages button when another user sends a message but user IS at bottom', () => {
		const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, mockScrollBehavior), { wrapper: mockAppRoot().build() });

		const otherUserMsg: IMessage = {
			_id: 'msg-3',
			rid,
			u: { _id: 'other-user-id', username: 'other-user', name: 'Other User' },
			msg: 'Hello from another user',
			ts: new Date(),
			_updatedAt: new Date(),
		};

		const callbacks = clientCallbacks.getCallbacks('streamNewMessage');
		act(() => {
			callbacks.forEach((callback) => callback(otherUserMsg));
		});
		expect(result.current.hasNewMessages).toBe(false);
	});

	it('should ignore edited messages in streamNewMessage', () => {
		const scrollBehavior = {
			...mockScrollBehavior,
			isAtBottom: jest.fn(() => false),
		};

		const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollBehavior), { wrapper: mockAppRoot().build() });

		const editedMsg: IEditedMessage = {
			_id: 'msg-4',
			rid,
			u: { _id: 'other-user-id', username: 'other-user', name: 'Other User' },
			msg: 'Edited message',
			ts: new Date(),
			_updatedAt: new Date(),
			editedAt: new Date(),
			editedBy: { _id: 'other-user-id', username: 'other-user' },
		};

		const callbacks = clientCallbacks.getCallbacks('streamNewMessage');
		act(() => {
			callbacks.forEach((callback) => callback(editedMsg));
		});
		expect(result.current.hasNewMessages).toBe(false);
	});

	it('should ignore thread messages in streamNewMessage', () => {
		const scrollBehavior = {
			...mockScrollBehavior,
			isAtBottom: jest.fn(() => false),
		};

		const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollBehavior), { wrapper: mockAppRoot().build() });

		const threadMsg: IMessage = {
			_id: 'msg-5',
			rid,
			tmid: 'parent-thread-id',
			u: { _id: 'other-user-id', username: 'other-user', name: 'Other User' },
			msg: 'Thread reply',
			ts: new Date(),
			_updatedAt: new Date(),
		};

		const callbacks = clientCallbacks.getCallbacks('streamNewMessage');
		act(() => {
			callbacks.forEach((callback) => callback(threadMsg));
		});
		expect(result.current.hasNewMessages).toBe(false);
	});

	it('should clear hasNewMessages when afterSaveMessage fires for current user', () => {
		const scrollBehavior = {
			...mockScrollBehavior,
			isAtBottom: jest.fn(() => false),
		};

		const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollBehavior), { wrapper: mockAppRoot().build() });

		const otherUserMsg: IMessage = {
			_id: 'msg-6',
			rid,
			u: { _id: 'other-user-id', username: 'other-user', name: 'Other User' },
			msg: 'Hello',
			ts: new Date(),
			_updatedAt: new Date(),
		};

		const streamCallbacks = clientCallbacks.getCallbacks('streamNewMessage');
		act(() => {
			streamCallbacks.forEach((callback) => callback(otherUserMsg));
		});
		expect(result.current.hasNewMessages).toBe(true);

		const ownMsg: IMessage = {
			_id: 'msg-7',
			rid,
			u: { _id: uid, username: 'current-user', name: 'Current User' },
			msg: 'My reply',
			ts: new Date(),
			_updatedAt: new Date(),
		};

		const afterSaveCallbacks = clientCallbacks.getCallbacks('afterSaveMessage');
		act(() => {
			afterSaveCallbacks.forEach((callback) => callback(ownMsg));
		});
		expect(result.current.hasNewMessages).toBe(false);
		expect(mockScrollBehavior.sendToBottom).toHaveBeenCalled();
	});
});
