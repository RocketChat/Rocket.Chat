import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import ThreadMessageList from './ThreadMessageList';
import { createFakeMessage, createFakeRoom } from '../../../../../../tests/mocks/data';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';

const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const mockVirtualizerHandle = {
	scrollToIndex: jest.fn(),
	findItemIndex: jest.fn(() => 0),
	scrollOffset: 100,
	scrollSize: 1000,
	viewportSize: 300,
};

jest.mock('virtua', () => {
	const { forwardRef, useImperativeHandle } = jest.requireActual<typeof import('react')>('react');

	return {
		VList: forwardRef(
			(
				{
					children,
					onScroll,
					shift: _shift,
					keepMounted: _keepMounted,
					...props
				}: {
					children: ReactNode;
					onScroll?: (offset: number) => void;
					shift?: boolean;
					keepMounted?: number[];
				},
				ref: any,
			) => {
				useImperativeHandle(ref, () => mockVirtualizerHandle);
				return (
					<ul data-testid='thread-message-list' onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)} {...props}>
						{children}
					</ul>
				);
			},
		),
	};
});

jest.mock('@rocket.chat/fuselage-hooks', () => ({
	...jest.requireActual('@rocket.chat/fuselage-hooks'),
	useDebouncedCallback: (callback: (...args: any[]) => void) => callback,
}));

jest.mock('@rocket.chat/ui-client', () => ({
	clientCallbacks: {
		add: jest.fn(),
		remove: jest.fn(),
		priority: { MEDIUM: 0 },
	},
	CustomVirtuaScrollbars: forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CustomVirtuaScrollbars(
		{ children, ...props },
		ref,
	) {
		return (
			<div {...props}>
				<div ref={ref}>{children}</div>
				<div data-testid='overlay-scrollbar-handle' />
			</div>
		);
	}),
}));

jest.mock('../hooks/useThreadMessagesQuery', () => ({
	useThreadMessagesQuery: jest.fn(),
}));

jest.mock('../../../hooks/useDateScroll', () => ({
	useDateScroll: () => ({
		bubbleRef: { current: null },
		handleDateScroll: jest.fn(),
	}),
}));

jest.mock('../../../contexts/RoomContext', () => ({
	useRoom: () => room,
}));

jest.mock('../../../MessageList/hooks/useKeepAtBottom', () => ({
	useKeepAtBottom: () => ({ keepAtBottomRef: jest.fn(), setKeepAtBottom: jest.fn() }),
}));

jest.mock('../../../hooks/useFirstUnreadMessageId', () => ({
	useFirstUnreadMessageId: () => undefined,
}));

jest.mock('../../../hooks/useMessageListNavigation', () => ({
	useMessageListNavigation: () => ({ messageListRef: { current: null } }),
}));

jest.mock('../../../MessageList/providers/MessageListProvider', () => ({ children }: { children: ReactNode }) => <>{children}</>);

jest.mock('../../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({
	setMessageJumpQueryStringParameter: jest.fn(),
}));

jest.mock('./ThreadMessageItem', () => ({
	ThreadMessageItem: ({ message }: { message: IMessage }) => <li>{message._id}</li>,
}));

jest.mock('../../../BubbleDate', () => ({
	BubbleDate: forwardRef(function BubbleDate(_, ref) {
		return <time ref={ref as any} />;
	}),
}));

const createThreadMessage = (index: number): IThreadMessage => {
	const ts = new Date(Date.UTC(2026, 0, index));

	return createFakeMessage<IThreadMessage>({
		_id: `reply-${index}`,
		rid: room._id,
		tmid: 'thread-id',
		msg: `reply ${index}`,
		ts,
		_updatedAt: ts,
		u: {
			_id: 'user-id',
			username: 'user',
			name: 'User',
		},
	});
};

describe('ThreadMessageList', () => {
	it('fetches the previous page after a pointer interaction with the overlay scrollbar', async () => {
		const user = userEvent.setup();
		const fetchPreviousPage = jest.fn().mockResolvedValue(undefined);
		const mainMessage = createFakeMessage<IThreadMainMessage>({
			_id: 'thread-id',
			rid: room._id,
			msg: 'main message',
			tcount: 1,
			u: {
				_id: 'user-id',
				username: 'user',
				name: 'User',
			},
		});
		(useThreadMessagesQuery as jest.Mock).mockReturnValue({
			data: { messages: [createThreadMessage(1)] },
			isLoading: false,
			fetchNextPage: jest.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			fetchPreviousPage,
			hasPreviousPage: true,
			isFetchingPreviousPage: false,
			loadMessageAround: jest.fn(),
		});

		render(<ThreadMessageList mainMessage={mainMessage} shouldJumpToBottom setShouldJumpToBottom={jest.fn()} />, {
			wrapper: mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true).build(),
		});

		fireEvent.scroll(screen.getByTestId('thread-message-list'));
		expect(fetchPreviousPage).not.toHaveBeenCalled();

		await user.pointer({ keys: '[MouseLeft>]', target: screen.getByTestId('overlay-scrollbar-handle') });
		fireEvent.scroll(screen.getByTestId('thread-message-list'));
		await user.pointer({ keys: '[/MouseLeft]' });

		expect(fetchPreviousPage).toHaveBeenCalledTimes(1);
	});
});
