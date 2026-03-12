import { useRouteParameter } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';

import { useHasNewMessages } from './useHasNewMessages';
import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { useChat } from '../../contexts/ChatContext';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useRouteParameter: jest.fn(),
}));

jest.mock('../../../../../app/ui-utils/client', () => ({
	RoomHistoryManager: {
		clear: jest.fn(),
		getMoreIfIsEmpty: jest.fn(),
	},
}));

jest.mock('../../contexts/ChatContext', () => ({
	useChat: jest.fn(),
}));

const mockSendToBottom = jest.fn();
const mockSendToBottomIfNecessary = jest.fn();
const mockIsAtBottom = jest.fn();

describe('useHasNewMessages', () => {
	const rid = 'test-room-id';
	const uid = 'test-user-id';
	const atBottomRef: MutableRefObject<boolean> = { current: false };
	const scrollHelpers = {
		sendToBottom: mockSendToBottom,
		sendToBottomIfNecessary: mockSendToBottomIfNecessary,
		isAtBottom: mockIsAtBottom,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		atBottomRef.current = false;
		(useChat as jest.Mock).mockReturnValue({
			composer: { focus: jest.fn() },
		});
	});

	describe('handleJumpToRecentButtonClick', () => {
		it('should call RoomHistoryManager.clear with a filter to exclude the opened thread messages', () => {
			const openThreadId = 'thread-123';
			(useRouteParameter as jest.Mock).mockImplementation((param: string) => {
				if (param === 'tab') return 'thread';
				if (param === 'context') return openThreadId;
				return undefined;
			});

			const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollHelpers));

			result.current.handleJumpToRecentButtonClick();

			expect(RoomHistoryManager.clear).toHaveBeenCalledWith(rid, expect.any(Function));
			expect(RoomHistoryManager.getMoreIfIsEmpty).toHaveBeenCalledWith(rid);

			const shouldRemoveFn = (RoomHistoryManager.clear as jest.Mock).mock.calls[0][1];
			expect(shouldRemoveFn({ _id: openThreadId })).toBe(false);
			expect(shouldRemoveFn({ _id: 'message_id', tmid: openThreadId })).toBe(false);
			expect(shouldRemoveFn({ _id: 'message_id', tmid: 'other-thread' })).toBe(true);
			expect(shouldRemoveFn({ _id: 'other-message-id' })).toBe(true);
		});

		it('should call RoomHistoryManager.clear with a filter to clear all messages of opened room when not in a thread', () => {
			(useRouteParameter as jest.Mock).mockImplementation((param: string) => {
				if (param === 'tab') return 'info';
				if (param === 'context') return 'some-context';
				return undefined;
			});

			const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollHelpers));

			result.current.handleJumpToRecentButtonClick();

			expect(RoomHistoryManager.clear).toHaveBeenCalledWith(rid, expect.any(Function));
			expect(RoomHistoryManager.getMoreIfIsEmpty).toHaveBeenCalledWith(rid);

			const shouldRemoveFn = (RoomHistoryManager.clear as jest.Mock).mock.calls[0][1];
			expect(shouldRemoveFn({ _id: 'some-message-id' })).toBe(true);
			expect(shouldRemoveFn({ _id: 'some-message-id', tmid: 'any-thread' })).toBe(true);
			expect(shouldRemoveFn({ tmid: 'thread-without-id' })).toBe(true);
			expect(shouldRemoveFn({})).toBe(true);
		});

		it('should update atBottomRef when called', () => {
			(useRouteParameter as jest.Mock).mockReturnValue(undefined);

			const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollHelpers));

			result.current.handleJumpToRecentButtonClick();

			expect(atBottomRef.current).toBe(true);
		});

		it('should clear all messages when thread tab is active but context is undefined', () => {
			(useRouteParameter as jest.Mock).mockImplementation((param: string) => {
				if (param === 'tab') return 'thread';
				return undefined;
			});

			const { result } = renderHook(() => useHasNewMessages(rid, uid, atBottomRef, scrollHelpers));

			result.current.handleJumpToRecentButtonClick();

			expect(RoomHistoryManager.clear).toHaveBeenCalledWith(rid, expect.any(Function));

			const shouldRemoveFn = (RoomHistoryManager.clear as jest.Mock).mock.calls[0][1];
			expect(shouldRemoveFn({ _id: 'any-msg' })).toBe(true);
			expect(shouldRemoveFn({ _id: 'any-msg', tmid: 'any-thread' })).toBe(true);
		});
	});
});
