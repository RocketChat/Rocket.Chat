import type { IMessage } from '@rocket.chat/core-typings';
import { Message } from '@rocket.chat/fuselage';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import type { MessageListHandle, MessageListProps } from './MessageList';
import MessageList from './MessageList';
import * as stories from './MessageList.stories';
import MessageListDateBubble from './MessageListDateBubble';
import MessageListJumpToLatestButton from './MessageListJumpToLatestButton';
import MessageListNewMessagesButton from './MessageListNewMessagesButton';
import { expectListKeyboard } from '../../tests/utils/listContract';
import { MessageSelectionContext } from '../Message/contexts/MessageSelectionContext';
import { useIsMessageEmphasized } from '../Message/hooks/useIsMessageEmphasized';

jest.mock('./MessageListVirtualizer', () => jest.requireActual('./MessageListRows'));

const wrapper = mockAppRoot()
	.withSetting('Message_DateFormat', 'YYYY/MM/DD')
	.withTranslations('en', 'core', {
		Unread_Messages: 'Unread messages',
		New_messages: 'New messages',
		Jump_to_recent_messages: 'Jump to recent messages',
	})
	.build();

const day = (date: number, hours = 10) => new Date(2024, 0, date, hours);
const alice = { _id: 'alice', username: 'alice', name: 'Alice' };
const bob = { _id: 'bob', username: 'bob', name: 'Bob' };

const messages = [
	createFakeMessage({ _id: 'a', msg: 'first', ts: day(14), u: alice }),
	createFakeMessage({ _id: 'b', msg: 'second', ts: day(15), u: alice }),
	createFakeMessage({ _id: 'c', msg: 'third', ts: day(15, 11), u: bob }),
];

const Row = ({ message }: { message: IMessage }) => {
	const isEmphasized = useIsMessageEmphasized(message._id);
	return (
		<div role='listitem' aria-label={message.u.name} data-emphasized={isEmphasized}>
			{message.msg}
		</div>
	);
};

const renderMessage: MessageListProps<IMessage>['renderMessage'] = (row) => <Row message={row.message} />;

const List = (props: Partial<MessageListProps<IMessage>>) => (
	<MessageList<IMessage> aria-label='Message list' messages={messages} renderMessage={renderMessage} {...props} />
);

const host = () => screen.getByRole('list').parentElement as HTMLElement;

describe('rows', () => {
	it('renders a labelled list, busy while any page loads (R1)', () => {
		const { rerender } = render(<List />, { wrapper });

		expect(screen.getByRole('list', { name: 'Message list' })).toHaveAttribute('aria-busy', 'false');

		rerender(<List isLoadingOlderMessages hasOlderMessages />);
		expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');

		rerender(<List isLoadingNewerMessages hasNewerMessages />);
		expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');

		rerender(<List isLoadingInitialMessages />);
		expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
	});

	it('shows the header once no older messages remain, and the older loader before it (R2)', () => {
		const { rerender } = render(<List header={<p>Start of conversation</p>} hasOlderMessages />, { wrapper });
		expect(screen.queryByText('Start of conversation')).not.toBeInTheDocument();

		rerender(<List header={<p>Start of conversation</p>} />);

		expect(screen.getByText('Start of conversation')).toBeInTheDocument();
		expect(screen.getByText('Start of conversation').compareDocumentPosition(screen.getByText('first'))).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING,
		);
	});

	// `develop`'s `LoadingMessagesIndicator`: a Throbber of the default size, in the default text colour
	const expectDevelopSpinner = () => {
		const circles = Array.from(document.querySelectorAll<HTMLElement>('.rcx-throbber__circle'));
		expect(circles).toHaveLength(3);
		circles.forEach((circle) => {
			expect(getComputedStyle(circle).width).toBe('1rem');
			expect(getComputedStyle(circle).height).toBe('1rem');
			expect(circle).toHaveClass('rcx-throbber__circle--inherit-color');
			expect(getComputedStyle(circle.closest('[role="presentation"]') as HTMLElement).color).toContain('--rcx-color-font-default');
		});
	};

	it('draws the header as a list item and a loader as presentation, spinning only while its page loads (R3)', () => {
		const { rerender, unmount } = render(<List header={<p>Start of conversation</p>} />, { wrapper });
		const items = within(screen.getByRole('list')).getAllByRole('listitem');

		expect(items.find((item) => within(item).getByText('Start of conversation'))).toBeDefined();

		rerender(<List hasOlderMessages hasNewerMessages isLoadingOlderMessages />);
		expect(screen.getAllByRole('presentation')).toHaveLength(2);
		expect(document.querySelectorAll('.rcx-throbber')).toHaveLength(1);

		rerender(<List hasOlderMessages hasNewerMessages isLoadingNewerMessages />);
		expect(document.querySelectorAll('.rcx-throbber')).toHaveLength(1);

		rerender(<List hasOlderMessages hasNewerMessages />);
		expect(document.querySelectorAll('.rcx-throbber')).toHaveLength(0);

		rerender(<List hasOlderMessages hasNewerMessages isLoadingOlderMessages />);
		expectDevelopSpinner();

		unmount();
		render(<List messages={[]} isLoadingInitialMessages />, { wrapper });
		expectDevelopSpinner();
	});

	it('shows only a spinner while the first page loads (R4)', () => {
		const { rerender } = render(<List messages={[]} isLoadingInitialMessages header={<p>Start of conversation</p>} hasOlderMessages />, {
			wrapper,
		});

		expect(screen.queryByText('Start of conversation')).not.toBeInTheDocument();
		expect(screen.queryAllByRole('presentation').filter((node) => node.className.includes('rcx-box')).length).toBeLessThanOrEqual(1);
		expect(document.querySelector('.rcx-throbber')).toBeInTheDocument();

		rerender(<List isLoadingInitialMessages />);
		expect(screen.getByText('first')).toBeInTheDocument();
	});

	it('renders an empty list, with the header when no older messages remain (R5)', () => {
		const { rerender } = render(<List messages={[]} />, { wrapper });

		expect(screen.getByRole('list')).toBeInTheDocument();
		expect(screen.queryAllByRole('listitem')).toHaveLength(0);

		rerender(<List messages={[]} header={<p>Start of conversation</p>} />);
		expect(screen.getByText('Start of conversation')).toBeInTheDocument();
	});

	it('renders each message through renderMessage with its row data and id (R6)', () => {
		const render_ = jest.fn(() => null);
		const grouped = [...messages, createFakeMessage({ _id: 'd', ts: day(15, 11), u: bob })];

		render(<List messages={grouped} firstUnreadMessageId='d' renderMessage={render_} />, { wrapper });

		expect(render_).toHaveBeenCalledTimes(4);
		expect(render_).toHaveBeenCalledWith(
			expect.objectContaining({ key: 'a', message: grouped[0], previous: undefined, isSequential: false, startsNewDay: true }),
		);
		expect(render_).toHaveBeenCalledWith(
			expect.objectContaining({ key: 'd', previous: grouped[2], isSequential: true, startsNewDay: false, isFirstUnread: true }),
		);
		expect(document.querySelectorAll('[data-message-id]')).toHaveLength(4);
		expect(document.querySelector('[data-message-id="c"]')).toBeInTheDocument();
	});

	it("draws a day divider before the first message of each day, in the viewer's date format (R7)", () => {
		render(<List />, { wrapper });

		expect(screen.getByText('2024/01/14')).toBeInTheDocument();
		expect(screen.getByText('2024/01/15')).toBeInTheDocument();
		expect(document.querySelectorAll('.rcx-message-divider')).toHaveLength(2);
	});

	it('combines the unread divider with the day divider and keeps it with its message (R8)', () => {
		render(<List firstUnreadMessageId='b' />, { wrapper });

		expect(document.querySelectorAll('.rcx-message-divider')).toHaveLength(2);
		expect(screen.getByText('unread messages')).toBeInTheDocument();
		const row = screen.getByText('second').closest('[data-message-id]') as HTMLElement;
		expect(within(row).getByText('unread messages')).toBeInTheDocument();
		expect(within(row).getByText('2024/01/15')).toBeInTheDocument();
	});

	it('draws an unread divider alone before a message of the same day (R8)', () => {
		render(<List firstUnreadMessageId='c' />, { wrapper });

		const row = screen.getByText('third').closest('[data-message-id]') as HTMLElement;
		expect(within(row).getByText('unread messages')).toBeInTheDocument();
		expect(within(row).queryByText('2024/01/15')).not.toBeInTheDocument();
	});

	it('ignores a first unread id that is not listed and does not scroll for it (R9)', () => {
		const onTargetMessageReached = jest.fn();
		render(<List firstUnreadMessageId='missing' onTargetMessageReached={onTargetMessageReached} />, { wrapper });

		expect(screen.queryByText('unread messages')).not.toBeInTheDocument();
		expect(onTargetMessageReached).not.toHaveBeenCalled();
		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});

	it('exposes what it holds and its phase (R12)', () => {
		const { unmount } = render(<List />, { wrapper });
		expect(host()).toHaveAttribute('data-anchor', 'bottom');
		expect(host()).toHaveAttribute('data-phase', 'positioning');
		unmount();

		render(<List targetMessageId='b' />, { wrapper });
		expect(host()).toHaveAttribute('data-anchor', 'message');
	});

	it('renders with no provider but the translation and settings roots (R78)', () => {
		render(<List />, { wrapper: mockAppRoot().build() });

		expect(screen.getByText('first')).toBeInTheDocument();
	});
});

describe('overlays', () => {
	it('shows "Jump to recent messages" only while newer messages remain (R24)', () => {
		const { rerender } = render(
			<List hasNewerMessages>
				<MessageListJumpToLatestButton />
			</List>,
			{ wrapper },
		);

		const wrapperOf = () => screen.getByText('Jump to recent messages').closest('[data-visible]');
		expect(wrapperOf()).toHaveAttribute('data-visible', 'true');
		expect(wrapperOf()).toHaveAttribute('aria-hidden', 'false');

		rerender(
			<List>
				<MessageListJumpToLatestButton />
			</List>,
		);
		expect(wrapperOf()).toHaveAttribute('data-visible', 'false');
		expect(wrapperOf()).toHaveAttribute('aria-hidden', 'true');
	});

	it('hides "New messages" until a message arrives out of view (R21)', () => {
		render(
			<List>
				<MessageListNewMessagesButton />
			</List>,
			{ wrapper },
		);

		expect(screen.getByText('New messages').closest('[data-visible]')).toHaveAttribute('data-visible', 'false');
		expect(screen.getByText('New messages').closest('[data-visible]')).toHaveAttribute('aria-hidden', 'true');
	});

	it('composes the date alone, and throws outside a list (R53)', () => {
		render(
			<List>
				<MessageListDateBubble />
			</List>,
			{ wrapper },
		);
		expect(screen.queryByText('New messages')).not.toBeInTheDocument();
		expect(screen.queryByText('Jump to recent messages')).not.toBeInTheDocument();

		const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(<MessageListNewMessagesButton />, { wrapper })).toThrow('inside a MessageList');
		error.mockRestore();
	});
});

describe('going to the latest', () => {
	const isOwnMessage = (message: IMessage) => message.u._id === 'alice';
	const own = createFakeMessage({ _id: 'd', ts: day(16), u: alice });
	const other = createFakeMessage({ _id: 'e', ts: day(16, 11), u: bob });

	it("goes to the bottom for the viewer's own message, from where the viewer reads (R19)", () => {
		const ref = createRef<MessageListHandle>();
		const { rerender } = render(<List ref={ref} isOwnMessage={isOwnMessage} />, { wrapper });
		act(() => ref.current?.scrollToTop());
		expect(host()).toHaveAttribute('data-anchor', 'none');

		rerender(<List ref={ref} isOwnMessage={isOwnMessage} messages={[...messages, own]} />);

		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});

	it("does not go to the bottom for someone else's message while the viewer reads away (R22)", () => {
		const ref = createRef<MessageListHandle>();
		const { rerender } = render(<List ref={ref} isOwnMessage={isOwnMessage} />, { wrapper });
		act(() => ref.current?.scrollToTop());

		rerender(<List ref={ref} isOwnMessage={isOwnMessage} messages={[...messages, other]} />);

		expect(host()).toHaveAttribute('data-anchor', 'none');
	});

	it('asks for the latest page when told to scroll to the bottom of an older window (R20)', () => {
		const onJumpToLatest = jest.fn();
		const ref = createRef<MessageListHandle>();
		render(<List ref={ref} hasNewerMessages onJumpToLatest={onJumpToLatest} />, { wrapper });

		act(() => ref.current?.scrollToBottom());

		expect(onJumpToLatest).toHaveBeenCalledTimes(1);
	});

	it('does not move by itself when the latest page cannot be asked for, now or when the messages next stop having a newer page (R20)', () => {
		const ref = createRef<MessageListHandle>();
		const { rerender } = render(<List ref={ref} hasNewerMessages />, { wrapper });

		act(() => ref.current?.scrollToBottom());
		expect(host()).toHaveAttribute('data-anchor', 'none');

		rerender(<List ref={ref} messages={[...messages, other]} />);

		expect(host()).toHaveAttribute('data-anchor', 'none');
	});

	it("does not take a page of newer messages that ends with the viewer's own message for an own message (R31)", () => {
		const onJumpToLatest = jest.fn();
		const { rerender } = render(<List hasNewerMessages onJumpToLatest={onJumpToLatest} isOwnMessage={isOwnMessage} />, { wrapper });

		rerender(
			<List
				hasNewerMessages
				isLoadingNewerMessages
				onJumpToLatest={onJumpToLatest}
				isOwnMessage={isOwnMessage}
				messages={[...messages, other, own]}
			/>,
		);

		expect(onJumpToLatest).not.toHaveBeenCalled();
	});

	// Known defect: ../../docs/specs/message-list.md#d1-an-own-message-followed-by-another-in-the-same-update-is-not-recognised
	it.skip('goes to the bottom for an own message followed by another one in the same update (R19)', () => {
		const ref = createRef<MessageListHandle>();
		const { rerender } = render(<List ref={ref} isOwnMessage={isOwnMessage} />, { wrapper });
		act(() => ref.current?.scrollToTop());

		rerender(<List ref={ref} isOwnMessage={isOwnMessage} messages={[...messages, own, other]} />);

		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});

	// Known defect: ../../docs/specs/message-list.md#d3-a-failed-jump-to-the-latest-page-leaves-the-list-waiting-for-it
	it.skip('does not go to the bottom by itself after a failed jump to the latest page (R20)', async () => {
		const onJumpToLatest = jest.fn().mockRejectedValue(new Error('offline'));
		const ref = createRef<MessageListHandle>();
		const { rerender } = render(<List ref={ref} hasNewerMessages onJumpToLatest={onJumpToLatest} />, { wrapper });
		await act(async () => ref.current?.scrollToBottom());

		rerender(<List ref={ref} onJumpToLatest={onJumpToLatest} messages={[...messages, other]} />);

		expect(host()).toHaveAttribute('data-anchor', 'none');
	});
});

describe('jumps', () => {
	it('reports a loaded target as reached, once (R41)', () => {
		const onTargetMessageReached = jest.fn();
		const { rerender } = render(<List targetMessageId='b' onTargetMessageReached={onTargetMessageReached} />, { wrapper });

		expect(onTargetMessageReached).toHaveBeenCalledWith('b');

		rerender(<List targetMessageId='b' onTargetMessageReached={onTargetMessageReached} />);
		expect(onTargetMessageReached).toHaveBeenCalledTimes(1);
	});

	it('acts on a target when it changes, and scrollToMessage does what setting it does (R46)', () => {
		const onTargetMessageReached = jest.fn();
		const ref = createRef<MessageListHandle>();
		const { rerender } = render(<List ref={ref} targetMessageId='b' onTargetMessageReached={onTargetMessageReached} />, { wrapper });
		onTargetMessageReached.mockClear();

		rerender(<List ref={ref} targetMessageId='c' onTargetMessageReached={onTargetMessageReached} />);
		expect(onTargetMessageReached).toHaveBeenLastCalledWith('c');

		rerender(<List ref={ref} targetMessageId={undefined} onTargetMessageReached={onTargetMessageReached} />);
		rerender(<List ref={ref} targetMessageId='c' onTargetMessageReached={onTargetMessageReached} />);
		expect(onTargetMessageReached).toHaveBeenCalledTimes(2);

		act(() => ref.current?.scrollToMessage('a'));
		expect(onTargetMessageReached).toHaveBeenLastCalledWith('a');
	});

	it('waits for a target that is not listed, and jumps once it is (R43)', () => {
		const onTargetMessageReached = jest.fn();
		const { rerender } = render(<List targetMessageId='z' onTargetMessageReached={onTargetMessageReached} />, { wrapper });
		expect(onTargetMessageReached).not.toHaveBeenCalled();

		rerender(
			<List
				targetMessageId='z'
				onTargetMessageReached={onTargetMessageReached}
				messages={[createFakeMessage({ _id: 'y', ts: day(10), u: bob }), createFakeMessage({ _id: 'z', ts: day(10, 11), u: bob })]}
			/>,
		);

		expect(onTargetMessageReached).toHaveBeenCalledWith('z');
	});
});

describe('highlight', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	const emphasized = () => Array.from(document.querySelectorAll('[data-emphasized="true"]')).map((node) => node.textContent);

	it('draws the target with the editing look for two seconds (R48)', () => {
		render(<List targetMessageId='b' />, { wrapper });

		expect(emphasized()).toEqual(['second']);

		act(() => jest.advanceTimersByTime(1999));
		expect(emphasized()).toEqual(['second']);

		act(() => jest.advanceTimersByTime(1));
		expect(emphasized()).toEqual([]);
	});

	it('keeps the highlight of each list apart, and a second jump replaces the first (R49)', () => {
		const { rerender } = render(
			<>
				<List aria-label='First list' targetMessageId='b' />
				<List aria-label='Second list' />
			</>,
			{ wrapper },
		);

		expect(within(screen.getByRole('list', { name: 'First list' })).getByText('second')).toHaveAttribute('data-emphasized', 'true');
		expect(within(screen.getByRole('list', { name: 'Second list' })).getByText('second')).toHaveAttribute('data-emphasized', 'false');

		rerender(
			<>
				<List aria-label='First list' targetMessageId='c' />
				<List aria-label='Second list' />
			</>,
		);

		expect(emphasized()).toEqual(['third']);
	});

	it('does not let the end of a first highlight end a second one early (R49)', () => {
		const { rerender } = render(<List targetMessageId='b' />, { wrapper });
		act(() => jest.advanceTimersByTime(1500));

		rerender(<List targetMessageId='c' />);
		act(() => jest.advanceTimersByTime(1000));

		expect(emphasized()).toEqual(['third']);
	});
});

describe('reports', () => {
	afterEach(() => jest.useRealTimers());

	it('reports nothing while the first page loads or without messages, and answers undefined (R58)', () => {
		const onVisibleMessagesChange = jest.fn();
		const ref = createRef<MessageListHandle>();
		render(<List ref={ref} messages={[]} isLoadingInitialMessages onVisibleMessagesChange={onVisibleMessagesChange} />, { wrapper });

		expect(onVisibleMessagesChange).not.toHaveBeenCalled();
		expect(ref.current?.getVisibility()).toBeUndefined();

		const onEmptyVisibleMessagesChange = jest.fn();
		render(<List aria-label='Empty list' messages={[]} onVisibleMessagesChange={onEmptyVisibleMessagesChange} />, { wrapper });
		expect(onEmptyVisibleMessagesChange).not.toHaveBeenCalled();
	});

	it('reports nothing once its messages are gone (R58)', () => {
		const onVisibleMessagesChange = jest.fn();
		const { rerender } = render(<List onVisibleMessagesChange={onVisibleMessagesChange} />, { wrapper });
		onVisibleMessagesChange.mockClear();

		rerender(<List messages={[]} onVisibleMessagesChange={onVisibleMessagesChange} />);

		expect(onVisibleMessagesChange).not.toHaveBeenCalled();
	});

	it('answers getVisibility with what the last report said (R57)', () => {
		const onVisibleMessagesChange = jest.fn();
		const ref = createRef<MessageListHandle>();
		render(<List ref={ref} onVisibleMessagesChange={onVisibleMessagesChange} />, { wrapper });

		expect(onVisibleMessagesChange).toHaveBeenCalled();
		expect(ref.current?.getVisibility()).toBe(onVisibleMessagesChange.mock.lastCall?.[0]);
	});

	it('reports its position when it unmounts, and not without messages (R59)', () => {
		jest.useFakeTimers();
		const onPositionChange = jest.fn();
		const { unmount } = render(<List onPositionChange={onPositionChange} />, { wrapper });
		act(() => jest.advanceTimersByTime(100));
		expect(onPositionChange).not.toHaveBeenCalled();
		unmount();
		expect(onPositionChange).toHaveBeenCalledTimes(1);
		expect(onPositionChange).toHaveBeenCalledWith(expect.objectContaining({ isAtBottom: true }));

		const onEmptyPositionChange = jest.fn();
		render(<List messages={[]} onPositionChange={onEmptyPositionChange} />, { wrapper }).unmount();
		expect(onEmptyPositionChange).not.toHaveBeenCalled();
	});

	it('reports no position before it has placed itself, so a list left before it landed is not stored where it never was (R59)', () => {
		const onPositionChange = jest.fn();
		const { unmount } = render(<List onPositionChange={onPositionChange} />, { wrapper });
		expect(host()).toHaveAttribute('data-phase', 'positioning');

		unmount();

		expect(onPositionChange).not.toHaveBeenCalled();
	});

	it('opens at the bottom without a position, and at its message with one (R62)', () => {
		const onPositionChange = jest.fn();
		render(<List onPositionChange={onPositionChange} />, { wrapper });
		expect(host()).toHaveAttribute('data-anchor', 'bottom');
		const saved = {
			isAtBottom: false,
			anchorMessageId: 'b',
			offsetWithinAnchor: 10,
			cacheKeys: { first: 'a', last: 'c', length: 3 },
			width: 0,
		};

		render(<List aria-label='Other list' restoredPosition={saved} />, { wrapper });
		expect(screen.getByRole('list', { name: 'Other list' }).parentElement).toHaveAttribute('data-anchor', 'message');
	});
});

describe('restoring', () => {
	it('opens at the saved position when its messages arrive after it mounted (R61)', () => {
		const saved = {
			isAtBottom: false,
			anchorMessageId: 'b',
			offsetWithinAnchor: 10,
			cacheKeys: { first: 'a', last: 'c', length: 3 },
			width: 0,
		};
		const { rerender } = render(<List messages={[]} isLoadingInitialMessages restoredPosition={saved} />, { wrapper });

		rerender(<List isLoadingInitialMessages restoredPosition={saved} />);

		expect(host()).toHaveAttribute('data-anchor', 'message');
	});

	it('applies the position given when the first messages are listed, not the one given at mount (R61, R62)', () => {
		const saved = {
			isAtBottom: false,
			anchorMessageId: 'b',
			offsetWithinAnchor: 10,
			cacheKeys: { first: 'a', last: 'c', length: 3 },
			width: 0,
		};
		const dropped = render(<List aria-label='Dropped' messages={[]} isLoadingInitialMessages restoredPosition={saved} />, { wrapper });
		dropped.rerender(<List aria-label='Dropped' isLoadingInitialMessages />);
		expect(screen.getByRole('list', { name: 'Dropped' }).parentElement).toHaveAttribute('data-anchor', 'bottom');
		dropped.unmount();

		const given = render(<List aria-label='Given' messages={[]} isLoadingInitialMessages />, { wrapper });
		given.rerender(<List aria-label='Given' isLoadingInitialMessages restoredPosition={saved} />);
		expect(screen.getByRole('list', { name: 'Given' }).parentElement).toHaveAttribute('data-anchor', 'message');
	});

	it('opens at the bottom when the saved message is not among the first messages listed (R60)', () => {
		const saved = {
			isAtBottom: false,
			anchorMessageId: 'gone',
			offsetWithinAnchor: 10,
			cacheKeys: { first: 'a', last: 'c', length: 3 },
			width: 0,
		};
		const { rerender } = render(<List messages={[]} isLoadingInitialMessages restoredPosition={saved} />, { wrapper });

		rerender(<List restoredPosition={saved} />);

		expect(host()).toHaveAttribute('data-anchor', 'bottom');
	});
});

describe('selection', () => {
	it('does not select, register or count messages (R70)', () => {
		const store = {
			subscribe: jest.fn(() => () => undefined),
			isSelecting: jest.fn(() => true),
			isSelected: jest.fn(() => false),
			toggle: jest.fn(),
		};

		render(
			<MessageSelectionContext.Provider value={store}>
				<List hasOlderMessages hasNewerMessages firstUnreadMessageId='b' header={<p>Start</p>} />
			</MessageSelectionContext.Provider>,
			{ wrapper },
		);

		expect(store.toggle).not.toHaveBeenCalled();
		expect(store.isSelected).not.toHaveBeenCalled();
		expect(store.isSelecting).not.toHaveBeenCalled();
		expect(store.subscribe).not.toHaveBeenCalled();
	});
});

describe('keyboard', () => {
	it('follows the keyboard model of a list of rows (R66)', async () => {
		render(
			<>
				<button type='button'>before</button>
				<MessageList<IMessage>
					aria-label='Message list'
					messages={messages}
					renderMessage={(row) => (
						<Message role='listitem' tabIndex={0} aria-label={row.message.u.name}>
							{row.message.msg}
						</Message>
					)}
				/>
				<button type='button'>after</button>
			</>,
			{ wrapper },
		);

		await expectListKeyboard(screen.getByRole('list'), screen.getAllByRole('listitem', { name: /Alice|Bob/ })[0]);
	});
});

describe('stories', () => {
	const composed = composeStories(stories);

	it('has a story for each behaviour of the list (R74)', () => {
		expect(Object.keys(composed)).toEqual(
			expect.arrayContaining([
				'Default',
				'ShortList',
				'Empty',
				'InfiniteOlderHistory',
				'LiveIncomingAtBottom',
				'LiveIncomingScrolledUp',
				'SendOwnMessageWhileDetached',
				'JumpToLoadedMessage',
				'JumpToUnloadedMessage',
				'JumpSurvivesLateMeasurement',
				'JumpToFirstUnread',
				'JumpToLatest',
				'LoadNewerAtBottom',
				'LateResizingContent',
				'ContainerAndComposerResize',
				'RestorePosition',
				'StartOfConversationHeader',
				'ThreadLayout',
				'LoadingStates',
				'HighlightedMessage',
				'FloatingDate',
				'FloatingDateNeverDoublesADay',
				'TypingInAFieldKeepsTheBottom',
				'ScrollKeyReleasesTheBottom',
				'DraggingTheScrollbarReleasesTheBottom',
				'FailedLoadSettles',
				'FillsATallViewport',
				'HeaderReplacesTheLoader',
				'HeaderGrowsLate',
				'LiveMessageWhileOlderLoads',
				'ReorderedMessage',
				'ScrollToTop',
				'OpensOnATarget',
				'KeepsLiveEmbedsMounted',
				'KeyboardIntoUnrenderedRows',
				'KeyboardFromAKeptMountedRow',
				'ReportsWhatIsVisible',
				'ReportsBeingAtTheBottomAfterAJump',
				'ReportsAfterAResize',
				'BottomThreshold',
				'ReportsNotBeingAtTheBottomOfAnOlderWindow',
				'RestorePositionOfAListThatMountsEmpty',
				'FirstPageLoading',
				'OlderPageOfTheSameDay',
				'FirstPageArrivesLate',
			]),
		);
	});

	test.each(Object.entries(composed))('%s has no accessibility violations (R75)', async (_name, Story) => {
		const { container } = render(<Story />);

		await act(async () => undefined);

		expect(await axe(container)).toHaveNoViolations();
	});
});
