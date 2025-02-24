import type { ISubscription } from '@rocket.chat/core-typings';
import type { IActionManager } from '@rocket.chat/ui-contexts';
import { useUserId } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useChatMessagesInstance } from './useChatMessagesInstance';
import { E2ERoomState } from '../../../../../app/e2e/client/E2ERoomState';
import { ChatMessages } from '../../../../../app/ui/client/lib/ChatMessages';
import { useEmojiPicker } from '../../../../contexts/EmojiPickerContext';
import { useUiKitActionManager } from '../../../../uikit/hooks/useUiKitActionManager';
import { useRoomSubscription } from '../../contexts/RoomContext';
import { useE2EERoomState } from '../../hooks/useE2EERoomState';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserId: jest.fn(),
}));
jest.mock('../../contexts/RoomContext', () => ({
	useRoomSubscription: jest.fn(),
}));
jest.mock('../../../../uikit/hooks/useUiKitActionManager', () => ({
	useUiKitActionManager: jest.fn(),
}));
jest.mock('../../hooks/useE2EERoomState', () => ({
	useE2EERoomState: jest.fn(),
}));
jest.mock('../../../../contexts/EmojiPickerContext', () => ({
	useEmojiPicker: jest.fn(),
}));

const updateSubscriptionMock = jest.fn();
jest.mock('../../../../../app/ui/client/lib/ChatMessages', () => {
	return {
		ChatMessages: jest.fn().mockImplementation(() => {
			return {
				release: jest.fn(),
				readStateManager: {
					updateSubscription: updateSubscriptionMock,
				},
			};
		}),
	};
});

describe('useChatMessagesInstance', () => {
	let mockUid: string;
	let mockSubscription: Pick<ISubscription, 'u' | 't' | 'rid'>;
	let mockActionManager: IActionManager | undefined;
	let mockE2EERoomState: E2ERoomState;
	let mockEmojiPicker: {
		open: jest.Mock;
		isOpen: boolean;
		close: jest.Mock;
	};

	beforeEach(() => {
		jest.clearAllMocks();

		mockUid = 'mockUid';
		mockSubscription = {
			u: {
				_id: mockUid,
				username: 'usernameMock',
				name: 'nameMock',
			},
			t: 'p',
			rid: 'roomId',
		};
		mockActionManager = undefined;
		mockE2EERoomState = E2ERoomState.READY;
		mockEmojiPicker = {
			open: jest.fn(),
			isOpen: false,
			close: jest.fn(),
		};

		(useUserId as jest.Mock).mockReturnValue(mockUid);
		(useRoomSubscription as jest.Mock).mockReturnValue(mockSubscription);
		(useUiKitActionManager as jest.Mock).mockReturnValue(mockActionManager);
		(useE2EERoomState as jest.Mock).mockReturnValue(mockE2EERoomState);
		(useEmojiPicker as jest.Mock).mockReturnValue(mockEmojiPicker);
	});

	it('should initialize ChatMessages instance with correct arguments', () => {
		const { result } = renderHook(() =>
			useChatMessagesInstance({
				rid: mockSubscription.rid,
				tmid: 'threadId',
				encrypted: false,
			}),
		);

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);
	});

	it('should update ChatMessages subscription', () => {
		const { result, rerender } = renderHook(() =>
			useChatMessagesInstance({
				rid: mockSubscription.rid,
				tmid: 'threadId',
				encrypted: false,
			}),
		);

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);

		(useRoomSubscription as jest.Mock).mockReturnValue({ ...mockSubscription, rid: 'newRoomId' });

		rerender();

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(2);
	});

	it('should update ChatMessages instance when dependencies changes', () => {
		const { result, rerender } = renderHook(() =>
			useChatMessagesInstance({
				rid: mockSubscription.rid,
				tmid: 'threadId',
				encrypted: false,
			}),
		);

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);

		(useE2EERoomState as jest.Mock).mockReturnValue(E2ERoomState.WAITING_KEYS);

		rerender();

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(updateSubscriptionMock).toHaveBeenCalledTimes(2);
		expect(ChatMessages).toHaveBeenCalledTimes(2);
	});

	it('should update ChatMessages instance when hook props changes', () => {
		const initialProps = {
			rid: mockSubscription.rid,
			tmid: 'threadId',
			encrypted: false,
		};
		const { result, rerender } = renderHook((props = initialProps) => useChatMessagesInstance(props as any));

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);

		expect(ChatMessages).toHaveBeenCalledTimes(1);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(1);

		rerender({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			encrypted: true,
		});

		expect(ChatMessages).toHaveBeenCalledWith({
			rid: mockSubscription.rid,
			tmid: 'threadId',
			uid: mockUid,
			actionManager: mockActionManager,
		});

		expect(result.current.emojiPicker).toBe(mockEmojiPicker);
		expect(updateSubscriptionMock).toHaveBeenCalledTimes(2);
		expect(ChatMessages).toHaveBeenCalledTimes(2);
	});
});
