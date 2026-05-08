import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { MessageList } from './MessageList';
import { useMessages } from './hooks/useMessages';
import { RoomManager } from '../../../lib/RoomManager';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';

const mockVirtualizerHandle = {
	scrollToIndex: jest.fn(),
	scrollTo: jest.fn(),
	findItemIndex: jest.fn((offset: number) => offset),
	scrollOffset: 0,
	scrollSize: 1000,
	viewportSize: 300,
};

jest.mock('virtua', () => {
	const React = require('react');

	return {
		VList: React.forwardRef(
			(
				{ children, onScroll, shift: _shift, ...props }: { children: ReactNode; onScroll?: (offset: number) => void; shift?: boolean },
				ref: any,
			) => {
				React.useImperativeHandle(ref, () => mockVirtualizerHandle);
				return (
					<ul data-testid='message-list' onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)} {...props}>
						{children}
					</ul>
				);
			},
		),
	};
});

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	useDebouncedCallback: (callback: (...args: any[]) => void) => callback,
}));

jest.mock('../../../lib/RoomManager', () => ({
	RoomManager: {
		getStore: jest.fn(),
	},
}));

jest.mock('./hooks/useMessages', () => ({
	useMessages: jest.fn(),
}));

jest.mock('./hooks/useTryToJumpToMessage', () => jest.fn());

jest.mock('../hooks/useFirstUnreadMessageId', () => ({
	useFirstUnreadMessageId: jest.fn(),
}));

jest.mock('../contexts/RoomContext', () => ({
	useRoomSubscription: jest.fn(() => undefined),
}));

jest.mock('../contexts/ChatContext', () => ({
	useChat: jest.fn(() => ({
		readStateManager: {
			setIsUnreadMarkVisibleCallback: jest.fn(),
		},
	})),
}));

jest.mock('./MessageListItem', () => ({
	MessageListItem: ({ message }: { message: IMessage }) => <li data-testid='message-list-item'>{message.msg}</li>,
}));

jest.mock('./providers/MessageListProvider', () => ({ children }: { children: ReactNode }) => <>{children}</>);

jest.mock('../providers/SelectedMessagesProvider', () => ({
	SelectedMessagesProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock('../body/LoadingMessagesIndicator', () => () => <span>Loading</span>);

jest.mock('../body/RetentionPolicyWarning', () => () => <span>Retention policy warning</span>);

jest.mock('../body/RoomForeword/RoomForeword', () => () => <span>Room foreword</span>);

const createMessage = (_id: string, ts = new Date()): IMessage =>
	({
		_id,
		rid: 'room-id',
		msg: `message ${_id}`,
		ts,
		_updatedAt: ts,
		u: {
			_id: 'user-id',
			username: 'user',
		},
	}) as IMessage;

const defaultProps = {
	rid: 'room-id' as IRoom['_id'],
	canPreview: true,
	hasMorePreviousMessages: false,
	isLoadingMoreMessages: false,
	user: { _id: 'user-id', username: 'user' } as IUser,
	room: { _id: 'room-id', t: 'c' } as IRoom,
	retentionPolicy: undefined,
	hasMoreNextMessages: false,
	shouldJumpToBottom: false,
	setShouldJumpToBottom: jest.fn(),
	isAtBottom: { current: false },
	isJumpingToMessage: false,
	setIsJumpingToMessage: jest.fn(),
	setUnreadCount: jest.fn(),
	setLastMessageDate: jest.fn(),
	debouncedClearNewMessagesOnScroll: jest.fn(),
	handleDateScroll: jest.fn(),
	debouncedMessageRead: jest.fn(),
};

describe('MessageList scroll position', () => {
	let root: ReturnType<typeof mockAppRoot>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockVirtualizerHandle.scrollToIndex.mockClear();
		mockVirtualizerHandle.scrollTo.mockClear();
		mockVirtualizerHandle.findItemIndex.mockImplementation((offset: number) => offset);
		mockVirtualizerHandle.scrollOffset = 0;
		mockVirtualizerHandle.scrollSize = 1000;
		mockVirtualizerHandle.viewportSize = 300;
		(useMessages as jest.Mock).mockReturnValue([createMessage('message-1'), createMessage('message-2')]);
		(useFirstUnreadMessageId as jest.Mock).mockReturnValue(undefined);
		root = mockAppRoot().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true);
	});

	it('should restore room scroll position based on store', () => {
		const store = {
			scroll: 123,
			atBottom: false,
			update: jest.fn(),
		};
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);
		mockVirtualizerHandle.findItemIndex.mockReturnValue(4);

		render(<MessageList {...defaultProps} />, { wrapper: root.build() });

		expect(screen.getByTestId('message-list')).toBeInTheDocument();
		expect(mockVirtualizerHandle.findItemIndex).toHaveBeenCalledWith(123);
		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(4, { align: 'start' });
		expect(mockVirtualizerHandle.scrollTo).not.toHaveBeenCalled();
	});

	it('should jump to bottom if atBottom is true', () => {
		const store = {
			scroll: 123,
			atBottom: true,
			update: jest.fn(),
		};
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);

		render(<MessageList {...defaultProps} shouldJumpToBottom={true} />, { wrapper: root.build() });

		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(2, { align: 'center' });
	});

	it('should jump to bottom if unreads are present', () => {
		const store = {
			scroll: 123,
			atBottom: false,
			update: jest.fn(),
		};
		(useFirstUnreadMessageId as jest.Mock).mockReturnValue('message-1');
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);

		render(<MessageList {...defaultProps} shouldJumpToBottom={true} />, { wrapper: root.build() });

		expect(defaultProps.setShouldJumpToBottom).toHaveBeenCalledWith(true);
	});

	it('should do nothing if no previous scroll position is stored', () => {
		const store = {
			scroll: undefined,
			atBottom: false,
			update: jest.fn(),
		};
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);

		render(<MessageList {...defaultProps} />, { wrapper: root.build() });

		expect(screen.getByTestId('message-list')).toBeInTheDocument();
		expect(mockVirtualizerHandle.scrollToIndex).not.toHaveBeenCalled();
		expect(mockVirtualizerHandle.scrollTo).not.toHaveBeenCalled();
	});

	it('should update store based on scroll position', async () => {
		const store = {
			scroll: 1,
			atBottom: false,
			update: jest.fn(),
		};
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);
		mockVirtualizerHandle.scrollOffset = 50;

		render(<MessageList {...defaultProps} />, { wrapper: root.build() });

		fireEvent.scroll(screen.getByTestId('message-list'));

		await waitFor(() => {
			expect(store.update).toHaveBeenCalledWith({ scroll: 50, atBottom: false });
		});
	});
});
