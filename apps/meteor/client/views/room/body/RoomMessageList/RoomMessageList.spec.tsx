import type { IMessage, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { clientCallbacks } from '@rocket.chat/ui-client';
import type { MessageListHandle, MessageListPosition } from '@rocket.chat/ui-message-list';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import type { ReactNode, Ref } from 'react';
import { createRef } from 'react';

import RoomMessageList from './RoomMessageList';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../../../tests/mocks/data';
import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';
import { RoomManager } from '../../../../lib/RoomManager';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';
import { Messages, Subscriptions } from '../../../../stores';
import { ChatContext } from '../../contexts/ChatContext';
import { RoomContext, RoomSubscriptionContext } from '../../contexts/RoomContext';
import { selectedMessageStore } from '../../providers/SelectedMessageStore';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../lib/SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../../../../lib/onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn((message) => message) }));
jest.mock('../../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../RoomForeword/RoomForeword', () => () => <span>Room foreword</span>);
jest.mock('../RetentionPolicyWarning', () => () => <span>Retention policy warning</span>);
jest.mock('../../hooks/useFirstUnreadMessageId', () => ({ useFirstUnreadMessageId: () => undefined }));

let mockTarget: string | undefined;
jest.mock('./useRoomJumpTarget', () => ({
	useRoomJumpTarget: () => ({ targetMessageId: mockTarget, onTargetMessageReached: jest.fn() }),
}));

// The virtualizer cannot measure anything in jsdom: the list draws every row instead
jest.mock('@rocket.chat/ui-message-list/dist/MessageList/MessageListVirtualizer', () =>
	jest.requireActual('@rocket.chat/ui-message-list/dist/MessageList/MessageListRows'),
);

const mockMessageList = jest.fn();
const mockRoomMessage = jest.fn();
jest.mock('@rocket.chat/ui-message-list', () => {
	const actual = jest.requireActual('@rocket.chat/ui-message-list');
	const { createElement } = jest.requireActual('react');
	// The real list and variants, seen through the props the room gives them
	return {
		...actual,
		MessageList: (props: unknown) => {
			mockMessageList(props);
			return createElement(actual.MessageList, props);
		},
		RoomMessage: (props: unknown) => {
			mockRoomMessage(props);
			return createElement(actual.RoomMessage, props);
		},
	};
});

const rid = 'room-id';
const author = { _id: 'author', username: 'author' };
const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, seconds));
const message = (_id: string, seconds: number, overrides: Partial<IMessage> = {}) =>
	createFakeMessage({ _id, rid, ts: at(seconds), msg: `text of ${_id}`, u: author, ...overrides });
const user = { _id: 'john.doe', username: 'john.doe' } as IUser;
const composer = { focus: jest.fn() };
const chat = { composer } as unknown as ChatAPI;

type Props = {
	room?: IRoom;
	subscription?: ISubscription;
	canPreview?: boolean;
	retention?: boolean;
	groupingPeriod?: number;
	dateFormat?: string;
	listRef?: Ref<MessageListHandle>;
	overlayTopInset?: number;
};

const renderList = ({
	room = createFakeRoom({ _id: rid, t: 'c' }),
	subscription,
	canPreview = true,
	retention = false,
	groupingPeriod = 300,
	dateFormat = 'LL',
	listRef,
	overlayTopInset,
}: Props = {}) => {
	const wrapper = mockAppRoot()
		.withJohnDoe()
		.withSetting('Message_GroupingPeriod', groupingPeriod)
		.withSetting('Message_DateFormat', dateFormat)
		.wrap((children: ReactNode) => (
			<ChatContext.Provider value={chat}>
				<RoomContext.Provider value={{ rid, room, subscribed: true }}>
					<RoomSubscriptionContext.Provider value={subscription}>{children}</RoomSubscriptionContext.Provider>
				</RoomContext.Provider>
			</ChatContext.Provider>
		))
		.build();
	const tree = (nextRoom = room, nextSubscription = subscription) => (
		<RoomMessageList
			ref={listRef}
			room={nextRoom}
			subscription={nextSubscription}
			user={user}
			canPreview={canPreview}
			retentionPolicy={retention ? ({ isActive: true } as never) : undefined}
			overlayTopInset={overlayTopInset}
			onVisibleMessagesChange={jest.fn()}
		/>
	);

	return { ...render(tree(), { wrapper }), tree };
};

beforeEach(() => {
	mockTarget = undefined;
	RoomHistoryManager.close(rid);
	RoomHistoryManager.updateRoom(rid, { hasMore: false, hasMoreNext: false, loaded: 3 });
	RoomManager.back(rid);
	RoomManager.close(rid);
	RoomManager.open(rid);
	Messages.state.replaceAll([message('first', 0), message('second', 100), message('third', 1000)]);
});

afterEach(() => {
	jest.clearAllMocks();
	act(() => {
		Messages.state.replaceAll([]);
		Subscriptions.state.replaceAll([]);
	});
});

it("renders a labelled list of the room's messages (R1)", async () => {
	const { container } = renderList();

	const list = screen.getByRole('list', { name: 'Message_list' });
	expect(list).toBeInTheDocument();
	expect(screen.getByText('text of first')).toBeInTheDocument();
	expect(screen.getByText('text of third')).toBeInTheDocument();
	expect(await axe(container)).toHaveNoViolations();
});

it("gives the messages the room's subscription and selection through the messages provider (R1, message-variants R48, R50)", () => {
	const starred = createFakeMessage({ _id: 'starred', rid, ts: at(5), msg: 'starred text', u: author, starred: [{ _id: 'john.doe' }] });
	Messages.state.replaceAll([starred]);
	const { unmount } = renderList({ subscription: createFakeSubscription({ rid }) });
	expect(screen.getByTitle('Message_has_been_starred')).toBeInTheDocument();

	act(() => selectedMessageStore.setIsSelecting(true));
	expect(screen.getAllByRole('checkbox')).toHaveLength(1);
	act(() => selectedMessageStore.reset());
	unmount();

	renderList();
	expect(screen.queryByTitle('Message_has_been_starred')).not.toBeInTheDocument();
});

it("writes the day dividers in the viewer's date format (R1, message-variants R40)", () => {
	Messages.state.replaceAll([createFakeMessage({ _id: 'new-day', rid, ts: new Date(2021, 9, 27, 12), msg: 'a message', u: author })]);

	renderList({ dateFormat: 'YYYY|MM|DD' });

	expect(screen.getByText('2021|10|27')).toBeInTheDocument();
});

describe('accessibility', () => {
	it('exposes the foreword, the day divider and every message as a list item of a labelled list (R1)', () => {
		renderList();

		const list = screen.getByRole('list');
		expect(list).toHaveAccessibleName();
		expect(within(list).getAllByRole('listitem')).toHaveLength(5);
	});

	it.each([
		['default', () => undefined, {}],
		['loading older messages', () => RoomHistoryManager.updateRoom(rid, { hasMore: true, isLoading: true }), {}],
		['loading while newer messages remain', () => RoomHistoryManager.updateRoom(rid, { hasMoreNext: true, isLoading: true }), {}],
		['showing the retention policy warning', () => undefined, { retention: true }],
		['without preview permission', () => undefined, { canPreview: false }],
	])('has no accessibility violations when %s (R1)', async (_state, prepare, props) => {
		prepare();
		const { container } = renderList(props);

		expect(await axe(container)).toHaveNoViolations();
	});
});

it('groups messages by the grouping period setting (R5)', () => {
	renderList({ groupingPeriod: 120 });
	const sequential = () => screen.getAllByRole('listitem', { name: /text of/ }).map((item) => item.getAttribute('data-sequential'));

	expect(sequential()).toEqual(['false', 'true', 'false']);
});

it('does not group messages further apart than the grouping period setting (R5)', () => {
	renderList({ groupingPeriod: 60 });

	expect(screen.getAllByRole('listitem', { name: /text of/ }).map((item) => item.getAttribute('data-sequential'))).toEqual([
		'false',
		'false',
		'false',
	]);
});

it("gives the list the room's bottom threshold (R6)", () => {
	renderList();

	expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ bottomThreshold: 60 }));
});

it("keeps the room's space above the first row and below the last, more below while newer messages remain (R57)", () => {
	renderList();
	expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ startSpacing: 21, endSpacing: 10 }));

	act(() => RoomHistoryManager.updateRoom(rid, { hasMoreNext: true }));
	expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ startSpacing: 21, endSpacing: 34 }));
});

it('draws the floating date below what the room draws over the list (R61)', () => {
	renderList({ overlayTopInset: 48 });

	expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ overlayTopInset: 48 }));
});

describe("paging before the viewer's input (R60)", () => {
	let getMore: jest.SpyInstance;
	let getMoreNext: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();
		// The list pages only in a viewport that has a size, which jsdom does not lay out
		jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
		getMore = jest.spyOn(RoomHistoryManager, 'getMore').mockResolvedValue(undefined);
		getMoreNext = jest.spyOn(RoomHistoryManager, 'getMoreNext').mockResolvedValue(undefined);
		RoomHistoryManager.updateRoom(rid, { hasMore: true, hasMoreNext: true });
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('tells the list to wait for the viewer before it pages (R60)', () => {
		renderList();

		expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ deferPagingUntilInput: true }));
	});

	it('asks for no older or newer page once the room has opened, until the viewer acts in the list (R60)', async () => {
		renderList();
		await act(async () => {
			jest.advanceTimersByTime(2000);
		});

		expect(getMore).not.toHaveBeenCalled();
		expect(getMoreNext).not.toHaveBeenCalled();

		fireEvent.wheel(screen.getByRole('list', { name: 'Message_list' }));
		await act(async () => undefined);

		expect(getMore).toHaveBeenCalledWith(rid);
	});
});

it("gives the list the room's tests of the viewer's messages and of arrivals (R43)", () => {
	renderList();

	const { isOwnMessage, countsAsArrival } = mockMessageList.mock.lastCall?.[0] ?? {};
	expect(isOwnMessage(message('mine', 1, { u: { _id: 'john.doe', username: 'john.doe' } }))).toBe(true);
	expect(countsAsArrival(message('reply', 1, { tmid: 'main' }))).toBe(false);
});

describe('the start of the room', () => {
	it('shows the foreword and the retention warning as the header only when the viewer can preview (R7)', () => {
		const { unmount } = renderList({ retention: true });
		expect(screen.getByText('Room foreword')).toBeInTheDocument();
		expect(screen.getByText('Retention policy warning')).toBeInTheDocument();
		unmount();

		RoomHistoryManager.updateRoom(rid, { hasMore: true });
		renderList({ canPreview: false });
		expect(screen.queryByText('Room foreword')).not.toBeInTheDocument();
		expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ hasOlderMessages: false, header: undefined }));
	});

	it('shows no foreword while older messages remain (R7)', () => {
		RoomHistoryManager.updateRoom(rid, { hasMore: true });

		renderList();

		expect(screen.queryByText('Room foreword')).not.toBeInTheDocument();
	});

	it('gives the foreword as the header the jump lands below (R37)', () => {
		mockTarget = 'second';

		renderList();

		expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ targetMessageId: 'second', header: expect.anything() }));
		expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Room foreword');
	});
});

it('focuses the composer after New messages and not after Jump to recent messages (R9)', () => {
	renderList();

	fireEvent.click(screen.getByText('Jump_to_recent_messages'));
	expect(composer.focus).not.toHaveBeenCalled();

	fireEvent.click(screen.getByText('New_messages'));
	expect(composer.focus).toHaveBeenCalledTimes(1);
});

it('gives the list the target together with the saved position (R15)', () => {
	const position: MessageListPosition = {
		isAtBottom: false,
		anchorMessageId: 'first',
		offsetWithinAnchor: 4,
		cacheKeys: { first: 'first', last: 'third', length: 3 },
		width: 600,
	};
	RoomManager.getStore(rid)?.savePosition(position);
	mockTarget = 'second';

	renderList();

	expect(mockMessageList).toHaveBeenLastCalledWith(expect.objectContaining({ targetMessageId: 'second', restoredPosition: position }));
});

it('renders only the row whose message or markers changed (R52)', () => {
	const subscription = createFakeSubscription({ rid, unread: 0, tunread: [] });
	const room = createFakeRoom({ _id: rid, t: 'c', lm: at(1000) });
	const { rerender, tree } = renderList({ room, subscription });
	const renderedBefore = mockRoomMessage.mock.calls.length;
	expect(renderedBefore).toBe(3);

	rerender(
		tree({ ...room, lm: at(2000), msgs: 4 }, { ...subscription, ls: at(2000), lr: at(2000), unread: 1, alert: true, tunread: ['arrived'] }),
	);
	act(() => {
		Messages.state.store(message('arrived', 2000));
	});

	const renderedMessages = mockRoomMessage.mock.calls.slice(renderedBefore).map(([props]) => props.message._id);
	expect(renderedMessages).toEqual(['arrived']);
	expect(mockRoomMessage).toHaveBeenLastCalledWith(expect.objectContaining({ unread: true }));
	expect(mockMessageList.mock.lastCall?.[0].renderMessage).toBe(mockMessageList.mock.calls[0][0].renderMessage);
});

describe("the viewer's own message, sent or arriving (R43)", () => {
	const mine = (overrides: Partial<IMessage> = {}) => message('mine', 5000, { u: { _id: 'john.doe', username: 'john.doe' }, ...overrides });
	const host = () => screen.getByRole('list').parentElement as HTMLElement;
	// As the room stream does: the message is stored, then the callbacks hear of it
	const arrives = (arrived: IMessage) =>
		act(async () => {
			Messages.state.store(arrived);
			await clientCallbacks.run('streamNewMessage', arrived);
		});
	const readingAway = (props: Props = {}) => {
		const listRef = createRef<MessageListHandle>();
		const view = renderList({ ...props, listRef });
		act(() => listRef.current?.scrollToTop());
		expect(host()).toHaveAttribute('data-anchor', 'none');
		return view;
	};
	let clear: jest.SpyInstance;
	let getMoreIfIsEmpty: jest.SpyInstance;

	beforeEach(() => {
		clear = jest.spyOn(RoomHistoryManager, 'clear');
		getMoreIfIsEmpty = jest.spyOn(RoomHistoryManager, 'getMoreIfIsEmpty').mockResolvedValue(undefined);
	});

	it('brings a room that shows an older window back to its latest messages, at the bottom (R43)', async () => {
		RoomHistoryManager.updateRoom(rid, { hasMoreNext: true });
		readingAway();

		await arrives(mine());

		expect(clear).toHaveBeenCalledWith(rid);
		expect(getMoreIfIsEmpty).toHaveBeenCalledWith(rid);
		expect(RoomHistoryManager.hasMoreNext(rid)).toBe(false);
		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});

	it('takes the list to the bottom from wherever the viewer reads when no newer messages remain (R43)', async () => {
		readingAway();

		await arrives(mine());

		expect(clear).not.toHaveBeenCalled();
		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});

	it.each([
		['a message of someone else', () => message('theirs', 5000)],
		["the viewer's reply in a thread, which shows in the room", () => mine({ tmid: 'first', tshow: true })],
		[
			"an edit of the viewer's message",
			() => mine({ editedAt: at(5001), editedBy: { _id: 'john.doe', username: 'john.doe' } } as Partial<IMessage>),
		],
		['a message of another room that the viewer wrote', () => mine({ rid: 'another-room' })],
	])('does not move a room that shows an older window for %s (R43)', async (_, arrived) => {
		RoomHistoryManager.updateRoom(rid, { hasMoreNext: true });
		readingAway();

		await arrives(arrived());

		expect(clear).not.toHaveBeenCalled();
		expect(host()).toHaveAttribute('data-anchor', 'none');
	});

	it('stops listening when the list goes (R43)', async () => {
		RoomHistoryManager.updateRoom(rid, { hasMoreNext: true });
		const { unmount } = readingAway();
		unmount();

		await arrives(mine());

		expect(clear).not.toHaveBeenCalled();
	});
});

it('keeps the keys the list handles away from the messages area (R56)', () => {
	const onKeyDown = jest.fn();
	const wrapper = mockAppRoot()
		.withJohnDoe()
		.wrap((children: ReactNode) => (
			<ChatContext.Provider value={chat}>
				<RoomContext.Provider value={{ rid, room: createFakeRoom({ _id: rid, t: 'c' }), subscribed: true }}>
					<div role='presentation' onKeyDown={onKeyDown}>
						{children}
					</div>
				</RoomContext.Provider>
			</ChatContext.Provider>
		))
		.build();
	render(
		<RoomMessageList
			room={createFakeRoom({ _id: rid, t: 'c' })}
			subscription={undefined}
			user={user}
			canPreview
			retentionPolicy={undefined}
			onVisibleMessagesChange={jest.fn()}
		/>,
		{ wrapper },
	);
	const row = screen.getByRole('listitem', { name: /text of second/ });

	fireEvent.keyDown(row, { key: 'PageDown' });
	expect(onKeyDown).toHaveBeenCalledTimes(1);

	fireEvent.keyDown(row, { key: 'ArrowDown' });
	expect(onKeyDown).toHaveBeenCalledTimes(1);
});
