import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import ThreadMessageList from './ThreadMessageList';
import { createFakeMessage, createFakeRoom } from '../../../../../../tests/mocks/data';
import { createBubbleDateStore } from '../../../BubbleDate/bubbleDateStore';
import { selectedMessageStore } from '../../../providers/SelectedMessageStore';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';

const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const mockVirtualizerHandle = {
	scrollToIndex: jest.fn(),
	findItemIndex: jest.fn(() => 0),
	scrollOffset: 100,
	scrollSize: 1000,
	viewportSize: 300,
};
const mockRenderedVList = { keepMounted: undefined as number[] | undefined };
const mockHandleDateScroll = jest.fn();
const mockBubbleDateStore = createBubbleDateStore();

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
					keepMounted,
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
				mockRenderedVList.keepMounted = keepMounted;
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
	useMergedRefsV2: jest.requireActual('@rocket.chat/ui-client').useMergedRefsV2,
}));

jest.mock('../hooks/useThreadMessagesQuery', () => ({
	useThreadMessagesQuery: jest.fn(),
}));

jest.mock('../../../hooks/useDateScroll', () => ({
	useDateScroll: () => ({
		bubbleRef: { current: null },
		handleDateScroll: mockHandleDateScroll,
		bubbleDateStore: mockBubbleDateStore,
	}),
}));

jest.mock('../../../contexts/RoomContext', () => ({
	useRoom: () => room,
	useRoomSubscription: () => undefined,
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

const mockMessagesProvider = jest.fn();
jest.mock('../../../../../providers/MessagesProvider', () => ({
	MessagesProvider: (props: { children: ReactNode }) => {
		mockMessagesProvider(props);
		return <>{props.children}</>;
	},
}));

jest.mock('../../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({
	setMessageJumpQueryStringParameter: jest.fn(),
}));

jest.mock('./ThreadMessageItem', () => ({
	ThreadMessageItem: ({ message }: { message: IMessage }) => (
		<>
			<div role='listitem'>{message._id}</div>
			<div data-testid='day-divider' data-time='20260102' />
		</>
	),
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
		render(<ThreadMessageList mainMessage={mainMessage} shouldJumpToBottom={false} setShouldJumpToBottom={jest.fn()} />, {
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

describe('ThreadMessageList rows', () => {
	const mainMessage = createFakeMessage<IThreadMainMessage>({
		_id: 'thread-id',
		rid: room._id,
		msg: 'main message',
		tcount: 2,
		u: { _id: 'user-id', username: 'user', name: 'User' },
	});

	const withFile = { ...createThreadMessage(1), files: [{ _id: 'file-id', name: 'file.png', type: 'image/png', size: 1 }] };

	beforeEach(() => {
		(useThreadMessagesQuery as jest.Mock).mockReturnValue({
			data: { messages: [withFile, createThreadMessage(2)] },
			isLoading: false,
			fetchNextPage: jest.fn(),
			hasNextPage: false,
			isFetchingNextPage: false,
			fetchPreviousPage: jest.fn(),
			hasPreviousPage: true,
			isFetchingPreviousPage: false,
			loadMessageAround: jest.fn(),
		});
	});

	const renderThreadMessageList = () =>
		render(<ThreadMessageList mainMessage={mainMessage} shouldJumpToBottom={false} setShouldJumpToBottom={jest.fn()} />, {
			wrapper: mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).withUserPreference('displayAvatars', true).build(),
		});

	it('keeps mounted the row of a message with a file while the older loader is the first row', () => {
		renderThreadMessageList();

		expect(mockRenderedVList.keepMounted).toEqual([1]);
	});

	it('reports the message of the topmost row, not the one below it, while the older loader is the first row', () => {
		mockVirtualizerHandle.findItemIndex.mockReturnValueOnce(1);

		renderThreadMessageList();
		fireEvent.scroll(screen.getByTestId('thread-message-list'));

		expect(mockHandleDateScroll).toHaveBeenCalledWith(withFile, mockVirtualizerHandle.scrollOffset);
	});
});

it('hides the inline day divider the floating date covers', () => {
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
	mockBubbleDateStore.set((current) => ({ ...current, date: '2026-01-02T00:00:00.000Z', show: true, showDivider: false }));
	const mainMessage = createFakeMessage<IThreadMainMessage>({ _id: 'thread-id', rid: room._id, msg: 'main message', tcount: 1 });

	render(<ThreadMessageList mainMessage={mainMessage} shouldJumpToBottom={false} setShouldJumpToBottom={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).build(),
	});

	expect(screen.getAllByTestId('day-divider')[0]).toHaveStyle({ opacity: 0 });
});

it("gives the messages of the thread no selection, so they never join the room's (message-variants R24, R25)", () => {
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
	const mainMessage = createFakeMessage<IThreadMainMessage>({ _id: 'thread-id', rid: room._id, msg: 'main message', tcount: 1 });
	mockMessagesProvider.mockClear();

	render(<ThreadMessageList mainMessage={mainMessage} shouldJumpToBottom={false} setShouldJumpToBottom={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().withSetting('Message_GroupingPeriod', 300).build(),
	});

	expect(mockMessagesProvider).toHaveBeenCalledWith(expect.objectContaining({ room }));
	expect(mockMessagesProvider).not.toHaveBeenCalledWith(expect.objectContaining({ selection: expect.anything() }));
	expect(selectedMessageStore.availableMessagesCount()).toBe(0);
});
