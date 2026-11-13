import type { IRoom, ISubscription, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { MessageListDateBubble } from '@rocket.chat/ui-message-list';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';

import ThreadMessageList from './ThreadMessageList';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../../../../tests/mocks/data';
import { clearHighlightMessage, getSnapshot, setHighlightMessage } from '../../../MessageList/providers/messageHighlightSubscription';
import { RoomContext, RoomSubscriptionContext } from '../../../contexts/RoomContext';
import { selectedMessageStore } from '../../../providers/SelectedMessageStore';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';

jest.mock('../../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../../lib/SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../../../../../lib/onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn((message) => message) }));
jest.mock('../../../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({ setMessageJumpQueryStringParameter: jest.fn() }));
jest.mock('../hooks/useThreadMessagesQuery', () => ({ useThreadMessagesQuery: jest.fn() }));

let mockFirstUnread: string | undefined;
jest.mock('../../../hooks/useFirstUnreadMessageId', () => ({ useFirstUnreadMessageId: () => mockFirstUnread }));

// The virtualizer cannot measure anything in jsdom: the list draws every row instead
jest.mock('@rocket.chat/ui-message-list/dist/MessageList/MessageListVirtualizer', () =>
	jest.requireActual('@rocket.chat/ui-message-list/dist/MessageList/MessageListRows'),
);

const mockMessageList = jest.fn();
const mockThreadMessage = jest.fn();
jest.mock('@rocket.chat/ui-message-list', () => {
	const actual = jest.requireActual('@rocket.chat/ui-message-list');
	const { createElement } = jest.requireActual('react');
	// The real list and variants, seen through the props the thread gives them
	return {
		...actual,
		MessageList: (props: unknown) => {
			mockMessageList(props);
			return createElement(actual.MessageList, props);
		},
		ThreadMessage: (props: unknown) => {
			mockThreadMessage(props);
			return createElement(actual.ThreadMessage, props);
		},
	};
});

let mockSearch: Record<string, string> = {};

const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, seconds));
const alice = { _id: 'alice', username: 'alice', name: 'Alice' };
const bob = { _id: 'bob', username: 'bob', name: 'Bob' };
const mainMessage = createFakeMessage<IThreadMainMessage>({
	_id: 'thread-id',
	rid: room._id,
	msg: 'main message',
	tcount: 2,
	ts: at(0),
	u: alice,
});
const reply = (_id: string, seconds: number, overrides: Partial<IThreadMessage> = {}) =>
	createFakeMessage<IThreadMessage>({
		_id,
		rid: room._id,
		tmid: mainMessage._id,
		msg: `text of ${_id}`,
		ts: at(seconds),
		u: bob,
		...overrides,
	});
const firstReply = reply('reply-1', 100);
const secondReply = reply('reply-2', 200, { u: alice });

const loaders = {
	fetchNextPage: jest.fn().mockResolvedValue(undefined),
	fetchPreviousPage: jest.fn().mockResolvedValue(undefined),
	loadMessageAround: jest.fn().mockResolvedValue(undefined),
	jumpToRecent: jest.fn().mockResolvedValue(undefined),
};

const query = (overrides: Record<string, unknown> = {}) => ({
	data: { messages: [firstReply, secondReply], itemCount: 2 },
	isLoading: false,
	hasNextPage: false,
	isFetchingNextPage: false,
	hasPreviousPage: false,
	isFetchingPreviousPage: false,
	...loaders,
	...overrides,
});

const mockQuery = (overrides: Record<string, unknown> = {}) =>
	jest.mocked(useThreadMessagesQuery).mockReturnValue(query(overrides) as never);

type Props = { groupingPeriod?: number; dateFormat?: string };

const renderList = ({ groupingPeriod = 300, dateFormat = 'LL' }: Props = {}) => {
	const wrapper = mockAppRoot()
		.withJohnDoe()
		.withRouter({ getSearchParameters: () => mockSearch })
		.withSetting('Message_GroupingPeriod', groupingPeriod)
		.withSetting('Message_DateFormat', dateFormat)
		.build();
	const tree = (nextMain = mainMessage, nextSubscription?: ISubscription, nextRoom: IRoom = room) => (
		<RoomContext.Provider value={{ rid: nextRoom._id, room: nextRoom, subscribed: !!nextSubscription }}>
			<RoomSubscriptionContext.Provider value={nextSubscription}>
				<ThreadMessageList mainMessage={nextMain} />
			</RoomSubscriptionContext.Provider>
		</RoomContext.Provider>
	);

	return { ...render(tree(), { wrapper }), tree };
};

const listProps = () => mockMessageList.mock.lastCall?.[0];
const row = (id: string) => screen.getAllByRole('listitem').find((item) => item.getAttribute('data-mid') === id);
const rowIds = () =>
	screen
		.getAllByRole('listitem')
		.map((item) => item.getAttribute('data-mid'))
		.filter(Boolean);

beforeEach(() => {
	mockSearch = {};
	mockFirstUnread = undefined;
	mockQuery();
});

afterEach(() => {
	jest.clearAllMocks();
	act(() => {
		selectedMessageStore.reset();
		clearHighlightMessage();
	});
});

it("renders a labelled list of the thread's messages (R1)", async () => {
	const { container } = renderList();

	expect(screen.getByRole('list', { name: 'Thread_message_list' })).toBeInTheDocument();
	expect(screen.getByText('text of reply-1')).toBeInTheDocument();
	expect(await axe(container)).toHaveNoViolations();
});

describe('what is loading', () => {
	it.each([
		['the first page', { isLoading: true, data: undefined }, 'true'],
		['an older page', { hasPreviousPage: true, isFetchingPreviousPage: true }, 'true'],
		['a newer page', { hasNextPage: true, isFetchingNextPage: true }, 'true'],
		['no page', { hasPreviousPage: true, hasNextPage: true }, 'false'],
	])('marks the list busy exactly while %s loads, once it has placed itself (R3)', async (_state, overrides, busy) => {
		mockQuery(overrides);

		renderList();
		await waitFor(() => expect(screen.getByRole('list').parentElement).toHaveAttribute('data-phase', 'idle'));

		expect(screen.getByRole('list')).toHaveAttribute('aria-busy', busy);
	});

	it('gives the list no message while the first page loads, not even the main message (R4)', () => {
		mockQuery({ isLoading: true, data: undefined });

		renderList();

		expect(listProps().messages).toEqual([]);
		expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
		expect(screen.queryByText('main message')).not.toBeInTheDocument();
	});

	it('shows the main message alone when the first page failed (R5)', async () => {
		mockQuery({ data: undefined });

		const { container } = renderList();

		expect(listProps().messages).toEqual([mainMessage]);
		expect(screen.getByText('main message')).toBeInTheDocument();
		await waitFor(() => expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'false'));
		expect(await axe(container)).toHaveNoViolations();
	});
});

it('gives the list no header, no position and no visibility callback (R7)', () => {
	renderList();

	const { header, restoredPosition, onPositionChange, onVisibleMessagesChange } = listProps();
	expect([header, restoredPosition, onPositionChange, onVisibleMessagesChange]).toEqual([undefined, undefined, undefined, undefined]);
});

it('opens a thread again at the bottom, giving the list no position back and taking none from it (R7)', () => {
	const { rerender, tree } = renderList();
	// Closed and opened again under the same app, which would keep anything stored for the thread
	rerender(<></>);
	rerender(tree());

	const given = mockMessageList.mock.calls.map(([{ restoredPosition, onPositionChange }]) => [restoredPosition, onPositionChange]);
	expect(given).toEqual(given.map(() => [undefined, undefined]));
	expect(screen.getByRole('list', { name: 'Thread_message_list' }).parentElement).toHaveAttribute('data-anchor', 'bottom');
});

describe("paging before the viewer's input (R22)", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		// The list pages only in a viewport that has a size, which jsdom does not lay out
		jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
		mockQuery({ hasPreviousPage: true, hasNextPage: true });
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('tells the list to wait for the viewer before it pages (R22)', () => {
		renderList();

		expect(listProps()).toEqual(expect.objectContaining({ deferPagingUntilInput: true }));
	});

	it('asks for no previous or next page of replies once the thread has opened, until the viewer acts in the list (R22)', async () => {
		renderList();
		await act(async () => {
			jest.advanceTimersByTime(2000);
		});

		expect(loaders.fetchPreviousPage).not.toHaveBeenCalled();
		expect(loaders.fetchNextPage).not.toHaveBeenCalled();

		fireEvent.wheel(screen.getByRole('list', { name: 'Thread_message_list' }));
		await act(async () => undefined);

		expect(loaders.fetchPreviousPage).toHaveBeenCalled();
	});
});

it('composes only the floating date, also while newer replies remain (R8, R40)', () => {
	mockQuery({ hasNextPage: true });

	renderList();

	expect(listProps().children.type).toBe(MessageListDateBubble);
	expect(screen.queryByText('New_messages')).not.toBeInTheDocument();
	expect(screen.queryByText('Jump_to_recent_messages')).not.toBeInTheDocument();
});

it("gives the list the thread's threshold, grouping period and grouping rule (R9)", () => {
	renderList({ groupingPeriod: 120 });

	expect(listProps()).toEqual(expect.objectContaining({ bottomThreshold: 20, groupingPeriodSeconds: 120, groupsThreadReplies: false }));
});

describe('the main message first', () => {
	it('puts the main message first once no older reply remains, and the older loader first while some do (R10)', () => {
		const { unmount } = renderList();
		expect(rowIds()).toEqual(['thread-id', 'reply-1', 'reply-2']);
		expect(listProps().hasOlderMessages).toBe(false);
		unmount();

		mockQuery({ hasPreviousPage: true });
		renderList();
		expect(rowIds()).toEqual(['reply-1', 'reply-2']);
		expect(listProps()).toEqual(expect.objectContaining({ hasOlderMessages: true, messages: [firstReply, secondReply] }));
	});

	it('shows the main message alone for a thread with no reply (R12)', () => {
		mockQuery({ data: { messages: [], itemCount: 0 } });

		renderList();

		expect(rowIds()).toEqual(['thread-id']);
		expect(listProps()).toEqual(expect.objectContaining({ hasOlderMessages: false, hasNewerMessages: false }));
	});

	it('groups the main message with the first reply as any two messages (R13)', () => {
		const sameAuthor = reply('reply-same', 100, { u: alice });
		mockQuery({ data: { messages: [sameAuthor, secondReply], itemCount: 2 } });

		renderList();

		expect(row('reply-same')).toHaveAttribute('data-sequential', 'true');
		expect(row('thread-id')).toHaveAttribute('data-sequential', 'false');
	});

	it('draws a changed main message in place and no other row again (R14)', () => {
		const { rerender, tree } = renderList();
		mockThreadMessage.mockClear();

		rerender(tree({ ...mainMessage, msg: 'edited main message' }));

		expect(screen.getByText('edited main message')).toBeInTheDocument();
		expect(mockThreadMessage.mock.calls.map(([props]) => props.message._id)).toEqual(['thread-id']);
	});
});

describe('what the list is given to open and to page', () => {
	it('gives no target and no position to a thread opened without msg (R15)', () => {
		renderList();

		expect(listProps().targetMessageId).toBeUndefined();
		expect(listProps().restoredPosition).toBeUndefined();
	});

	it("maps the older and newer pages and their loaders to the query's (R19, R20, R21)", () => {
		mockQuery({ hasPreviousPage: true, hasNextPage: true, isFetchingPreviousPage: true, isFetchingNextPage: false });

		renderList();

		expect(listProps()).toEqual(
			expect.objectContaining({
				hasOlderMessages: true,
				hasNewerMessages: true,
				isLoadingOlderMessages: true,
				isLoadingNewerMessages: false,
				isLoadingInitialMessages: false,
				onLoadOlderMessages: loaders.fetchPreviousPage,
				onLoadNewerMessages: loaders.fetchNextPage,
			}),
		);
	});

	it("tells the list the viewer's own messages and gives it the query's latest replies as its jump to the latest (R33, R34, R36)", () => {
		renderList();

		const { isOwnMessage, onJumpToLatest } = listProps();
		expect(isOwnMessage(reply('mine', 1, { u: { _id: 'john.doe', username: 'john.doe' } }))).toBe(true);
		expect(isOwnMessage(firstReply)).toBe(false);
		expect(onJumpToLatest).toBe(loaders.jumpToRecent);
	});

	it("keeps the list's rule of rows kept mounted and adds none (R38)", () => {
		renderList();

		expect(listProps().shouldKeepMounted).toBeUndefined();
	});
});

describe("the viewer's own reply, arriving (R34)", () => {
	const mine = (overrides: Partial<IThreadMessage> = {}) =>
		reply('mine', 500, { u: { _id: 'john.doe', username: 'john.doe' }, ...overrides });
	const host = () => screen.getByRole('list').parentElement as HTMLElement;
	// As the room stream does: the callbacks hear of a message that the thread's cache has stored
	const arrives = (arrived: IThreadMessage) =>
		act(async () => {
			await clientCallbacks.run('streamNewMessage', arrived);
		});
	const readingAway = () => {
		const view = renderList();
		act(() => listProps().ref.current?.scrollToTop());
		expect(host()).toHaveAttribute('data-anchor', 'none');
		return view;
	};

	it('brings a thread that shows an older window back to its latest replies, at the bottom (R34)', async () => {
		mockQuery({ hasNextPage: true });
		const { rerender, tree } = readingAway();

		await arrives(mine());
		expect(loaders.jumpToRecent).toHaveBeenCalledTimes(1);
		expect(host()).toHaveAttribute('data-anchor', 'none');

		mockQuery({ data: { messages: [firstReply, secondReply, mine()], itemCount: 3 }, hasNextPage: false });
		rerender(tree());
		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});

	it('takes the list to the bottom from wherever the viewer reads when no newer replies remain (R33)', async () => {
		readingAway();

		await arrives(mine());

		expect(loaders.jumpToRecent).not.toHaveBeenCalled();
		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});

	it.each([
		['a reply of someone else', () => reply('theirs', 500)],
		[
			"an edit of the viewer's reply",
			() => mine({ editedAt: at(501), editedBy: { _id: 'john.doe', username: 'john.doe' } } as Partial<IThreadMessage>),
		],
		['a reply of the viewer to another thread', () => mine({ tmid: 'another-thread' })],
		['a message of the viewer in the room', () => mine({ tmid: undefined })],
		['a reply of the viewer in another room', () => mine({ rid: 'another-room' })],
	])('does not move a thread that shows an older window for %s (R34, R36, R37)', async (_, arrived) => {
		mockQuery({ hasNextPage: true });
		readingAway();

		await arrives(arrived());

		expect(loaders.jumpToRecent).not.toHaveBeenCalled();
		expect(host()).toHaveAttribute('data-anchor', 'none');
	});

	it('stops listening when the list goes, so the thread opened again follows the reply (R34)', async () => {
		mockQuery({ hasNextPage: true });
		const { unmount } = readingAway();
		unmount();

		await arrives(mine());
		expect(loaders.jumpToRecent).not.toHaveBeenCalled();

		readingAway();
		await arrives(mine());
		expect(loaders.jumpToRecent).toHaveBeenCalledTimes(1);
	});
});

describe('jumps', () => {
	it('does not write the editing store for a jump, and leaves no highlight behind when the thread closes (R32)', () => {
		mockSearch = { msg: 'reply-1' };
		const { unmount } = renderList();

		expect(listProps().targetMessageId).toBe('reply-1');
		expect(row('reply-1')?.className).toContain('rcx-message--editing');
		expect(getSnapshot()).toBeUndefined();
		unmount();

		expect(getSnapshot()).toBeUndefined();
	});

	it('keeps the editing look on the message being edited while a jump highlights another (R47)', () => {
		act(() => setHighlightMessage('reply-2'));
		mockSearch = { msg: 'reply-1' };

		renderList();

		expect(row('reply-2')?.className).toContain('rcx-message--editing');
		expect(row('reply-1')?.className).toContain('rcx-message--editing');
		expect(getSnapshot()).toBe('reply-2');
	});
});

describe('the rows', () => {
	it("writes the day dividers in the viewer's date format and the unread divider (R39)", () => {
		mockFirstUnread = 'reply-2';
		const nextDay = reply('reply-2', 200, { ts: new Date(2021, 9, 27, 12), u: alice });
		mockQuery({ data: { messages: [firstReply, nextDay], itemCount: 2 } });

		renderList({ dateFormat: 'YYYY|MM|DD' });

		expect(screen.getAllByText('2026|01|01').length).toBeGreaterThan(0);
		expect(screen.getByText('2021|10|27')).toBeInTheDocument();
		expect(screen.getByText('unread_messages')).toBeInTheDocument();
	});

	it("marks the first unread message of the room's read state and moves nothing (R41)", () => {
		mockFirstUnread = 'reply-2';

		renderList();

		expect(row('reply-2')).toHaveAttribute('data-unread', 'true');
		expect(row('reply-1')).toHaveAttribute('data-unread', 'false');
		expect(listProps().targetMessageId).toBeUndefined();
		expect(listProps().restoredPosition).toBeUndefined();
	});

	it("gives the messages provider no selection, so the thread's messages never join the room's (R44)", () => {
		const joined = reply('joined', 150, { t: 'uj', msg: 'bob' });
		mockQuery({ data: { messages: [firstReply, joined, secondReply], itemCount: 3 } });
		act(() => selectedMessageStore.setIsSelecting(true));

		renderList();

		expect(screen.getAllByRole('listitem').filter((item) => item.getAttribute('aria-roledescription') === 'system_message')).toHaveLength(
			1,
		);
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		expect(selectedMessageStore.availableMessagesCount()).toBe(0);
		expect(selectedMessageStore.getSelectedMessages()).toEqual([]);
	});

	it('draws the message being edited with the editing look (R45)', () => {
		act(() => setHighlightMessage('reply-1'));

		renderList();

		expect(row('reply-1')?.className).toContain('rcx-message--editing');
		expect(row('reply-2')?.className).not.toContain('rcx-message--editing');
	});
});

describe('what draws again', () => {
	it('gives the list the same function to draw a message across renders (R48)', () => {
		const { rerender, tree } = renderList();
		const first = mockMessageList.mock.calls[0][0].renderMessage;

		rerender(tree(mainMessage, createFakeSubscription({ rid: room._id, ls: at(5) })));

		expect(listProps().renderMessage).toBe(first);
	});

	it('does not draw a row again for a change of the subscription that does not touch its author (R49)', () => {
		const subscription = createFakeSubscription({ rid: room._id, unread: 0, ignored: [] });
		const { rerender, tree } = renderList();
		rerender(tree(mainMessage, subscription));
		mockThreadMessage.mockClear();

		rerender(tree(mainMessage, { ...subscription, ls: at(50), lr: at(50), unread: 3, alert: true }));
		expect(mockThreadMessage).not.toHaveBeenCalled();

		rerender(tree(mainMessage, { ...subscription, ignored: ['bob'] }));
		expect(mockThreadMessage.mock.calls.map(([props]) => props.message._id)).toEqual(['reply-1']);
		expect(mockThreadMessage).toHaveBeenLastCalledWith(expect.objectContaining({ ignoredUser: true }));
	});

	it('draws the row of an arriving reply and no other (R50)', () => {
		const { rerender, tree } = renderList();
		mockThreadMessage.mockClear();

		mockQuery({ data: { messages: [firstReply, secondReply, reply('reply-3', 300)], itemCount: 3 } });
		rerender(tree());

		expect(mockThreadMessage.mock.calls.map(([props]) => props.message._id)).toEqual(['reply-3']);
		expect(rowIds()).toEqual(['thread-id', 'reply-1', 'reply-2', 'reply-3']);
	});
});
