import type { IMessage, ISubscription, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ThreadMessage } from '@rocket.chat/ui-message-list';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { MessageMarkers } from './MessageMarkers';
import RoomMessageRow from './RoomMessageRow';
import { createFakeMessage, createFakeRoom, createFakeSubscription } from '../../../../../tests/mocks/data';
import { MessagesProvider } from '../../../../providers/MessagesProvider';
import { roomMessageSelection } from '../../../../providers/MessagesProvider/messageSelectionFromStore';
import { Subscriptions } from '../../../../stores';
import { selectedMessageStore } from '../../providers/SelectedMessageStore';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../../providers/MessagesProvider/useParentMessage', () => ({
	useParentMessage: () => ({
		data: { _id: 'main', rid: 'room', msg: 'the thread', u: { _id: 'u' } },
		isLoading: false,
		isError: false,
		isSuccess: true,
	}),
}));
const mockRoomMessage = jest.fn();
const mockThreadMessagePreview = jest.fn();
jest.mock('@rocket.chat/ui-message-list', () => {
	const actual = jest.requireActual('@rocket.chat/ui-message-list');
	const { createElement } = jest.requireActual('react');
	// The real variants, seen through the props the row gives them
	return {
		...actual,
		RoomMessage: (props: unknown) => {
			mockRoomMessage(props);
			return createElement(actual.RoomMessage, props);
		},
		ThreadMessagePreview: (props: unknown) => {
			mockThreadMessagePreview(props);
			return createElement(actual.ThreadMessagePreview, props);
		},
	};
});

const message = createFakeMessage({ _id: 'plain', rid: 'room', msg: 'a message', u: { _id: 'author', username: 'author' } });
const system = createFakeMessage({ _id: 'system', rid: 'room', t: 'uj', msg: 'bob' });
const reply = createFakeMessage({ _id: 'reply', rid: 'room', tmid: 'main', msg: 'a reply' }) as IThreadMessage;

const room = createFakeRoom({ _id: 'room', t: 'c' });
const flags = { isSequential: false, startsNewDay: false, isFirstUnread: false };
const wrapper = mockAppRoot()
	.withJohnDoe()
	.withUserPreference('displayAvatars', true)
	.wrap((children: ReactNode) => (
		<MessagesProvider room={room} selection={roomMessageSelection}>
			{children}
		</MessagesProvider>
	))
	.build();

const row = (target: IMessage, overrides: Partial<typeof flags> = {}) => <RoomMessageRow message={target} {...flags} {...overrides} />;
const inList = (subscription: ISubscription | undefined, ...rows: ReactNode[]) => (
	<MessageMarkers subscription={subscription}>{rows}</MessageMarkers>
);

afterEach(() => {
	act(() => {
		selectedMessageStore.reset();
		Subscriptions.state.replaceAll([]);
	});
	selectedMessageStore.availableMessages.clear();
	mockRoomMessage.mockClear();
	mockThreadMessagePreview.mockClear();
});

it('draws a system message once, a thread reply as a preview and the rest as room messages (R2, message-variants R40)', () => {
	render(
		<>
			{row(message)}
			{row(system)}
			{row(reply)}
		</>,
		{ wrapper },
	);

	const roles = screen.getAllByRole('listitem').map((item) => item.getAttribute('aria-roledescription'));
	expect(roles.filter((role) => role === 'message')).toHaveLength(1);
	expect(roles.filter((role) => role === 'system_message')).toHaveLength(1);
	expect(screen.getAllByRole('link').filter((link) => link.getAttribute('aria-roledescription') === 'thread_message_preview')).toHaveLength(
		1,
	);
});

it("passes the subscription's markers and ignored authors to the room message (R3)", () => {
	const subscription = createFakeSubscription({
		rid: 'room',
		tunread: ['plain'],
		tunreadUser: ['plain'],
		tunreadGroup: ['other'],
		ignored: ['author'],
	});

	render(inList(subscription, row(message)), { wrapper });

	expect(mockRoomMessage).toHaveBeenLastCalledWith(expect.objectContaining({ unread: true, mention: true, all: false, ignoredUser: true }));
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
});

it('wraps a thread preview in a list item with its data and does not group it on a new day (R4)', () => {
	const { rerender } = render(row(reply, { isSequential: true, isFirstUnread: true }), { wrapper });

	const preview = screen.getByRole('link');
	expect(preview.closest('[role=listitem]')).toBeInTheDocument();
	expect(preview).toHaveAttribute('data-mid', 'reply');
	expect(preview).toHaveAttribute('data-tmid', 'main');
	expect(preview).toHaveAttribute('data-unread', 'true');
	expect(preview).toHaveAttribute('data-sequential', 'true');
	expect(mockThreadMessagePreview).toHaveBeenLastCalledWith(expect.objectContaining({ sequential: true }));

	rerender(row(reply, { isSequential: true, startsNewDay: true }));

	expect(mockThreadMessagePreview).toHaveBeenLastCalledWith(expect.objectContaining({ sequential: false }));
});

describe("the room's selection", () => {
	it('registers a rendered row for Select all while it is not selected (R46, message-variants R26)', () => {
		const { unmount } = render(
			<>
				{row(message)}
				{row(system)}
				{row(reply)}
			</>,
			{ wrapper },
		);
		expect(selectedMessageStore.availableMessagesCount()).toBe(3);

		act(() => selectedMessageStore.toggle('plain'));
		expect(selectedMessageStore.availableMessagesCount()).toBe(2);

		act(() => selectedMessageStore.toggleAll(Array.from(selectedMessageStore.availableMessages)));
		expect(selectedMessageStore.getSelectedMessages().sort()).toEqual(['plain', 'reply', 'system']);
		expect(selectedMessageStore.availableMessagesCount()).toBe(0);

		unmount();
		act(() => selectedMessageStore.clearStore());
		expect(selectedMessageStore.availableMessagesCount()).toBe(0);
	});

	it('stops counting a row that unmounts (R46, message-variants R26)', () => {
		const { rerender } = render(
			<>
				{row(message)}
				{row(system)}
			</>,
			{ wrapper },
		);
		expect(selectedMessageStore.availableMessagesCount()).toBe(2);

		rerender(row(message));

		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
	});

	it("does not count the messages of a thread next to the room's rows (R47)", () => {
		render(
			<>
				{row(message)}
				<ThreadMessage message={reply} unread={false} sequential={false} />
			</>,
			{ wrapper },
		);

		expect(Array.from(selectedMessageStore.availableMessages)).toEqual(['plain']);
	});
});

it("draws the rows with the room's selection (R3, message-variants R25)", () => {
	render(
		<>
			{row(message)}
			{row(system)}
			{row(reply)}
		</>,
		{ wrapper },
	);
	expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

	act(() => selectedMessageStore.setIsSelecting(true));
	expect(screen.getAllByRole('checkbox')).toHaveLength(3);

	act(() => selectedMessageStore.toggle('plain'));
	expect(screen.getAllByRole('checkbox').filter((checkbox) => (checkbox as HTMLInputElement).checked)).toHaveLength(1);
});

it('reads whether avatars show from the display context (R2, message-variants R46)', () => {
	const { unmount } = render(row(message), { wrapper });
	expect(screen.getByRole('figure')).toBeInTheDocument();
	unmount();

	render(row(message), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withUserPreference('displayAvatars', false)
			.wrap((children: ReactNode) => (
				<MessagesProvider room={room} selection={roomMessageSelection}>
					{children}
				</MessagesProvider>
			))
			.build(),
	});
	expect(screen.queryByRole('figure')).not.toBeInTheDocument();
});

describe('what a change of the subscription costs the rows', () => {
	const subscription = createFakeSubscription({ rid: 'room', tunread: [] });

	it('renders a row again only when what it shows about its own message changes (R52)', () => {
		const { rerender } = render(inList(subscription, row(message)), { wrapper });
		const rendered = mockRoomMessage.mock.calls.length;

		rerender(inList({ ...subscription, ls: new Date(), unread: 3, tunread: ['another'] }, row(message)));
		expect(mockRoomMessage.mock.calls).toHaveLength(rendered);

		rerender(inList({ ...subscription, tunread: ['another', 'plain'] }, row(message)));
		expect(mockRoomMessage.mock.calls.length).toBeGreaterThan(rendered);
		expect(mockRoomMessage).toHaveBeenLastCalledWith(expect.objectContaining({ unread: true }));
	});

	it('costs mounted rows nothing when a subscription of another room changes (R52)', () => {
		const find = jest.spyOn(Subscriptions.state, 'find');
		render(inList(subscription, row(message), row(reply)), { wrapper });
		const rendered = mockRoomMessage.mock.calls.length;
		find.mockClear();

		act(() => {
			Subscriptions.state.store(createFakeSubscription({ rid: 'another-room', unread: 1, tunread: ['plain'] }));
		});

		expect(find).not.toHaveBeenCalled();
		expect(mockRoomMessage.mock.calls).toHaveLength(rendered);
		find.mockRestore();
	});
});
