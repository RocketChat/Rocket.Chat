import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import ThreadMessageList from './ThreadMessageList';
import { createFakeMessage, createFakeRoom } from '../../../../../../tests/mocks/data';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';
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
	const { Children, forwardRef, useImperativeHandle } = jest.requireActual<typeof import('react')>('react');

	return {
		// `virtua` renders a plain container and wraps every child in a `div` of its own, so the list markup
		// under test cannot rely on `ul`/`li` semantics.
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
					<div data-testid='thread-message-list' onScroll={() => onScroll?.(mockVirtualizerHandle.scrollOffset)} {...props}>
						{Children.map(children, (child) => (child ? <div>{child}</div> : child))}
					</div>
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
	ThreadMessageItem: ({ message }: { message: IMessage }) => <div role='listitem'>{message._id}</div>,
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

		render(<ThreadMessageList mainMessage={mainMessage} />, {
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

describe('ThreadMessageList jump to bottom', () => {
	const mainMessage = createFakeMessage<IThreadMainMessage>({
		_id: 'thread-id',
		rid: room._id,
		msg: 'main message',
		tcount: 2,
		u: {
			_id: 'user-id',
			username: 'user',
			name: 'User',
		},
	});

	const mockThreadMessagesQuery = (overrides: Record<string, unknown> = {}) => {
		(useThreadMessagesQuery as jest.Mock).mockReturnValue({
			data: { messages: [createThreadMessage(1), createThreadMessage(2)] },
			isLoading: false,
			fetchNextPage: jest.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			fetchPreviousPage: jest.fn(),
			hasPreviousPage: false,
			isFetchingPreviousPage: false,
			loadMessageAround: jest.fn().mockResolvedValue(undefined),
			jumpToRecent: jest.fn().mockResolvedValue(undefined),
			...overrides,
		});
	};

	const { clientCallbacks } = jest.requireMock<typeof import('@rocket.chat/ui-client')>('@rocket.chat/ui-client');

	const getStreamNewMessageHandler = () => {
		const [, handler] = (clientCallbacks.add as jest.Mock).mock.calls.findLast(([hook]) => hook === 'streamNewMessage');
		return handler as (message: IMessage) => void;
	};

	const wrapper = mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).build();

	beforeEach(() => {
		mockVirtualizerHandle.scrollToIndex.mockClear();
		mockVirtualizerHandle.scrollSize = 1000;
		(clientCallbacks.add as jest.Mock).mockClear();
	});

	it('scrolls to the last message when the thread opens', () => {
		mockThreadMessagesQuery();

		render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });

		// the main message plus the two replies
		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(3, { align: 'end' });
	});

	it('waits for the messages to load before scrolling', () => {
		mockThreadMessagesQuery({ isLoading: true, data: undefined });

		const { rerender } = render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });
		expect(mockVirtualizerHandle.scrollToIndex).not.toHaveBeenCalled();

		mockThreadMessagesQuery();
		rerender(<ThreadMessageList mainMessage={mainMessage} />);

		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(3, { align: 'end' });
	});

	it('does not scroll to the bottom when a reply is linked', () => {
		mockThreadMessagesQuery();

		render(<ThreadMessageList mainMessage={mainMessage} />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withSetting('Message_GroupingPeriod', 300)
				.withRouter({ getSearchParameters: () => ({ msg: 'reply-1' }) })
				.build(),
		});

		expect(mockVirtualizerHandle.scrollToIndex).not.toHaveBeenCalledWith(3, { align: 'end' });
		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(1, { align: 'center' });
	});

	it("scrolls to the bottom when the user's own reply arrives", () => {
		mockThreadMessagesQuery();
		render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });
		mockVirtualizerHandle.scrollToIndex.mockClear();

		act(() => getStreamNewMessageHandler()({ ...createThreadMessage(3), u: { _id: 'john.doe', username: 'john.doe' } }));

		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(3, { align: 'end' });
	});

	it('follows new replies while at the bottom', () => {
		mockThreadMessagesQuery();
		const { rerender } = render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });
		mockVirtualizerHandle.scrollToIndex.mockClear();

		mockVirtualizerHandle.scrollSize = 1200;
		mockThreadMessagesQuery({ data: { messages: [createThreadMessage(1), createThreadMessage(2), createThreadMessage(3)] } });
		rerender(<ThreadMessageList mainMessage={mainMessage} />);

		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(4, { align: 'end' });
	});

	it("scrolls to the user's own pending reply after scrolling up", () => {
		mockThreadMessagesQuery();
		const { rerender } = render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });
		fireEvent.scroll(screen.getByTestId('thread-message-list'));
		mockVirtualizerHandle.scrollToIndex.mockClear();

		const pendingReply = { ...createThreadMessage(3), temp: true, u: { _id: 'john.doe', username: 'john.doe' } };
		mockThreadMessagesQuery({ data: { messages: [createThreadMessage(1), createThreadMessage(2), pendingReply] } });
		rerender(<ThreadMessageList mainMessage={mainMessage} />);

		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(4, { align: 'end' });
	});

	it('stays put when replies arrive after scrolling up', () => {
		mockThreadMessagesQuery();
		const { rerender } = render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });
		fireEvent.scroll(screen.getByTestId('thread-message-list'));
		mockVirtualizerHandle.scrollToIndex.mockClear();

		mockVirtualizerHandle.scrollSize = 1200;
		mockThreadMessagesQuery({ data: { messages: [createThreadMessage(1), createThreadMessage(2), createThreadMessage(3)] } });
		rerender(<ThreadMessageList mainMessage={mainMessage} />);

		expect(mockVirtualizerHandle.scrollToIndex).not.toHaveBeenCalled();
	});

	it("ignores someone else's reply", () => {
		mockThreadMessagesQuery();
		render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });
		mockVirtualizerHandle.scrollToIndex.mockClear();

		act(() => getStreamNewMessageHandler()({ ...createThreadMessage(3), u: { _id: 'someone-else', username: 'someone' } }));

		expect(mockVirtualizerHandle.scrollToIndex).not.toHaveBeenCalled();
	});

	it("loads the recent replies before scrolling to the user's own reply", async () => {
		const jumpToRecent = jest.fn().mockResolvedValue(undefined);
		mockThreadMessagesQuery({ hasNextPage: true, jumpToRecent });
		render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });
		mockVirtualizerHandle.scrollToIndex.mockClear();

		await act(async () => getStreamNewMessageHandler()({ ...createThreadMessage(3), u: { _id: 'john.doe', username: 'john.doe' } }));

		expect(jumpToRecent).toHaveBeenCalled();
		expect(mockVirtualizerHandle.scrollToIndex).toHaveBeenCalledWith(3, { align: 'end' });
	});
});

describe('ThreadMessageList message deep link', () => {
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

	beforeEach(() => {
		jest.useFakeTimers();
		(setMessageJumpQueryStringParameter as jest.Mock).mockClear();
		(useThreadMessagesQuery as jest.Mock).mockReturnValue({
			data: { messages: [createThreadMessage(1)] },
			isLoading: false,
			fetchNextPage: jest.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			fetchPreviousPage: jest.fn(),
			hasPreviousPage: false,
			isFetchingPreviousPage: false,
			loadMessageAround: jest.fn(),
		});
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const wrapper = mockAppRoot()
		.withJohnDoe()
		.withSetting('Message_GroupingPeriod', 300)
		.withRouter({ getSearchParameters: () => ({ msg: 'reply-1' }) })
		.build();

	it('clears the `msg` parameter once the linked reply is loaded', () => {
		render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });

		jest.advanceTimersByTime(500);

		expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith(null);
	});

	it('does not touch the `msg` parameter after unmounting', () => {
		const { unmount } = render(<ThreadMessageList mainMessage={mainMessage} />, { wrapper });

		unmount();
		jest.advanceTimersByTime(500);

		expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
	});
});

describe('ThreadMessageList accessibility', () => {
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

	const mockThreadMessagesQuery = (overrides: Record<string, unknown> = {}) => {
		(useThreadMessagesQuery as jest.Mock).mockReturnValue({
			data: { messages: [createThreadMessage(1), createThreadMessage(2)] },
			isLoading: false,
			fetchNextPage: jest.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			fetchPreviousPage: jest.fn(),
			hasPreviousPage: false,
			isFetchingPreviousPage: false,
			loadMessageAround: jest.fn(),
			...overrides,
		});
	};

	const renderThreadMessageList = () =>
		render(<ThreadMessageList mainMessage={mainMessage} />, {
			wrapper: mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true).build(),
		});

	it('should render a labelled list exposing every message as a list item', () => {
		mockThreadMessagesQuery();

		renderThreadMessageList();

		const list = screen.getByRole('list');

		expect(list).toHaveAccessibleName();
		// the two replies plus the main message
		expect(within(list).getAllByRole('listitem')).toHaveLength(3);
	});

	const states: [string, Record<string, unknown>][] = [
		['default', {}],
		['loading', { isLoading: true, data: undefined }],
		['loading previous messages', { hasPreviousPage: true, isFetchingPreviousPage: true }],
		['loading next messages', { hasNextPage: true, isFetchingNextPage: true }],
		['able to load next messages', { hasNextPage: true }],
	];

	it.each(states)('should have no accessibility violations when %s', async (_state, overrides) => {
		mockThreadMessagesQuery(overrides);

		const { container } = renderThreadMessageList();

		expect(await axe(container)).toHaveNoViolations();
	});
});
