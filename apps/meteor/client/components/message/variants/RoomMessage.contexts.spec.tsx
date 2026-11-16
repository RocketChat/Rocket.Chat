import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import RoomMessage from './RoomMessage';
import ThreadMessage from './ThreadMessage';
import { createFakeRoom, createFakeSubscription } from '../../../../tests/mocks/data';
import { MessagesProvider } from '../../../providers/MessagesProvider';
import MessageListProvider from '../../../views/room/MessageList/providers/MessageListProvider';
import { ChatContext } from '../../../views/room/contexts/ChatContext';
import { selectedMessageStore } from '../../../views/room/providers/SelectedMessageStore';

const room = createFakeRoom({ t: 'c' });

const message: IMessage = {
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: { _id: 'userId', name: 'userName', username: 'userName' },
	msg: '**bold**',
	md: [{ type: 'PARAGRAPH', value: [{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'bold' }] }] }],
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	urls: [],
};

jest.mock('../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../lib/actionLinks', () => ({ actionLinks: { run: jest.fn() } }));
jest.mock('../../../lib/utils/fireGlobalEvent', () => ({ fireGlobalEvent: () => undefined }));
jest.mock('../../../views/room/contexts/RoomContext', () => ({
	RoomContext: jest.requireActual('react').createContext(undefined),
	useRoom: () => room,
	useRoomSubscription: () => undefined,
}));
jest.mock('../../../views/room/MessageList/hooks/useRolesByUser', () => ({ useRolesByUser: () => undefined }));
jest.mock('../../../lib/RoomManager', () => ({
	RoomManager: { getStore: jest.fn() },
	useOpenedRoom: () => undefined,
	getCollapsibleEventKey: (key: string) => `collapsibleToggled-${key}`,
}));
jest.mock('../../../views/room/hooks/useGoToRoom', () => ({ useGoToRoom: () => undefined }));
jest.mock('../../../views/room/contextualBar/Threads/hooks/useGetMessageByID', () => ({ useGetMessageByID: () => jest.fn() }));
jest.mock('../../../hooks/useAutoTranslate', () => ({
	useAutoTranslate: () => ({ autoTranslateEnabled: false, autoTranslateLanguage: '', showAutoTranslate: () => false }),
}));
jest.mock('../../../hooks/useUserRolesByScope', () => ({
	useUserRolesByScope: () => ({ workspaceRoles: [], roomRoles: [] }),
}));

const chat = {} as never;

const messageProps = { sequential: false, all: false, mention: false, unread: false, ignoredUser: false, showUserAvatar: true } as const;

it('renders the markdown of a message through the app renderer under the list provider (R34)', () => {
	render(<RoomMessage message={message} {...messageProps} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.wrap((children: ReactNode) => (
				<ChatContext.Provider value={chat}>
					<MessageListProvider>{children}</MessageListProvider>
				</ChatContext.Provider>
			))
			.build(),
	});

	expect(screen.getByText('bold').tagName).toBe('STRONG');
});

it('reacts through chat.react when a reaction is clicked under the list provider (R34)', async () => {
	const react = jest.fn().mockResolvedValue({ success: true });

	render(<RoomMessage message={{ ...message, reactions: { ':smile:': { usernames: ['alice'] } } }} {...messageProps} />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withEndpoint('POST', '/v1/chat.react', react)
			.wrap((children: ReactNode) => (
				<ChatContext.Provider value={chat}>
					<MessageListProvider>{children}</MessageListProvider>
				</ChatContext.Provider>
			))
			.build(),
	});

	await userEvent.click(screen.getByRole('button', { name: 'React_with__reaction__' }));

	await waitFor(() => expect(react).toHaveBeenCalledWith({ messageId: 'messageId', reaction: ':smile:' }));
});

it.each([
	[true, true],
	[false, false],
])(
	"shows the thread metrics of a thread's main message only where interaction is allowed, with interaction %s (R40)",
	(allowsInteraction, shown) => {
		const thread = { ...message, tcount: 2, tlm: new Date('2021-10-28T00:00:00.000Z'), replies: ['alice'] } as IMessage;

		render(<RoomMessage message={thread} {...messageProps} />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.wrap((children: ReactNode) => (
					<ChatContext.Provider value={chat}>
						<MessagesProvider allowsInteraction={allowsInteraction}>{children}</MessagesProvider>
					</ChatContext.Provider>
				))
				.build(),
		});

		expect(screen.queryByRole('button', { name: 'View_thread' }) !== null).toBe(shown);
	},
);

const attachmentsWrapper = (chatValue: unknown) =>
	mockAppRoot()
		.withJohnDoe()
		.withUserPreference('autoImageLoad', true)
		.wrap((children: ReactNode) => (
			<ChatContext.Provider value={chatValue as never}>
				<MessageListProvider>{children}</MessageListProvider>
			</ChatContext.Provider>
		))
		.build();

it('shows the attachments of a message with the package parts under the list provider (message-attachments R21)', () => {
	render(
		<RoomMessage
			message={{
				...message,
				attachments: [
					{
						type: 'file',
						title: 'diagram.png',
						title_link: '/file-upload/id/diagram.png',
						image_url: '/file-upload/id/diagram.png',
						image_alt: 'A diagram',
					},
					{ title: 'Pipeline', text: 'All checks passed.' },
				] as IMessage['attachments'],
			}}
			{...messageProps}
		/>,
		{ wrapper: attachmentsWrapper(chat) },
	);

	expect(screen.getByRole('img', { name: 'A diagram' })).toBeInTheDocument();
	expect(screen.getByText('All checks passed.')).toBeInTheDocument();
});

it('sends the message of an action button of an attachment through the open chat (message-attachments R21)', async () => {
	const sendMessage = jest.fn().mockResolvedValue(undefined);

	render(
		<RoomMessage
			message={{
				...message,
				attachments: [
					{ actions: [{ type: 'button', text: 'Retry', msg: '/retry 42', msg_in_chat_window: true }] },
				] as IMessage['attachments'],
			}}
			{...messageProps}
		/>,
		{ wrapper: attachmentsWrapper({ flows: { sendMessage } }) },
	);

	await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

	await waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ text: '/retry 42' }));
});

describe('the toolbar', () => {
	const subscription = createFakeSubscription({ rid: room._id, t: 'c' });
	const conversationChat = {
		data: { findRoom: async () => room, findSubscription: async () => subscription, canDeleteMessage: async () => true },
	} as never;

	beforeAll(() => {
		window.DISABLE_ANIMATION = true;
		global.IntersectionObserver = class {
			observe = jest.fn();

			disconnect = jest.fn();
		} as never;
	});

	const toolbarWrapper = () =>
		mockAppRoot()
			.withJohnDoe()
			.withSetting('Threads_enabled', true)
			.wrap((children: ReactNode) => <ChatContext.Provider value={conversationChat}>{children}</ChatContext.Provider>)
			.build();

	const inPlace = (children: ReactNode) => (
		<MessagesProvider room={room} subscription={subscription}>
			{children}
		</MessagesProvider>
	);

	const inlineButtons = async () =>
		within(await screen.findByRole('toolbar', { name: 'Message_actions' }))
			.getAllByRole('button')
			.map((button) => button.getAttribute('aria-label') ?? button.getAttribute('title'));

	it("shows the package's toolbar for a message of the room, for the place it is shown in (message-toolbar R25)", async () => {
		render(inPlace(<RoomMessage message={message} {...messageProps} />), { wrapper: toolbarWrapper() });

		expect(await inlineButtons()).toEqual(['Add_Reaction', 'Quote', 'Reply_in_thread', 'Forward_message', 'More']);
	});

	it('shows the toolbar of the place the message is given (message-toolbar R25)', async () => {
		render(inPlace(<RoomMessage message={message} context='pinned' {...messageProps} />), { wrapper: toolbarWrapper() });

		expect(await inlineButtons()).toEqual(['Jump_to_message', 'More']);
	});

	it("shows the package's toolbar for the message of a thread (message-toolbar R25)", async () => {
		render(inPlace(<ThreadMessage message={{ ...message, tmid: 'threadId' }} sequential={false} unread={false} showUserAvatar />), {
			wrapper: toolbarWrapper(),
		});

		expect(await inlineButtons()).toEqual(['Add_Reaction', 'Quote', 'Forward_message', 'Jump_to_message', 'More']);
	});

	it('shows the toolbar of a call in a thread (message-toolbar R25)', async () => {
		render(
			inPlace(
				<ThreadMessage
					message={{ ...message, tmid: 'threadId', t: 'videoconf' } as never}
					sequential={false}
					unread={false}
					showUserAvatar
				/>,
			),
			{ wrapper: toolbarWrapper() },
		);

		expect(await inlineButtons()).toEqual(['Add_Reaction', 'Jump_to_message', 'More']);
	});

	it.each<[string, Partial<IMessage>]>([
		['a private message', { private: true }],
		['an end-to-end encrypted message that is still pending', { t: 'e2e', e2e: 'pending' }],
	])('shows no toolbar on %s (message-toolbar R25)', async (_name, overrides) => {
		const { rerender } = render(inPlace(<RoomMessage message={message} {...messageProps} />), { wrapper: toolbarWrapper() });
		expect(await screen.findByRole('toolbar', { name: 'Message_actions' })).toBeInTheDocument();

		rerender(inPlace(<RoomMessage message={{ ...message, ...overrides }} {...messageProps} />));

		expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
	});

	it('shows no toolbar while messages are being selected (message-toolbar R25)', async () => {
		render(inPlace(<RoomMessage message={message} {...messageProps} />), { wrapper: toolbarWrapper() });
		expect(await screen.findByRole('toolbar', { name: 'Message_actions' })).toBeInTheDocument();

		act(() => selectedMessageStore.setIsSelecting(true));

		expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
		act(() => selectedMessageStore.setIsSelecting(false));
	});

	it('shows no toolbar where interaction is off (message-toolbar R26)', async () => {
		render(
			<>
				<MessagesProvider room={room} subscription={subscription}>
					<RoomMessage message={{ ...message, _id: 'interactive' }} {...messageProps} />
				</MessagesProvider>
				<MessagesProvider room={room} subscription={subscription} allowsInteraction={false}>
					<RoomMessage message={{ ...message, _id: 'read-only' }} {...messageProps} />
				</MessagesProvider>
			</>,
			{ wrapper: toolbarWrapper() },
		);
		expect(await screen.findByRole('toolbar', { name: 'Message_actions' })).toBeInTheDocument();

		expect(screen.getAllByRole('toolbar')).toHaveLength(1);
		// oxlint-disable-next-line testing-library/no-node-access
		expect(screen.getByRole('toolbar')).toBe(within(document.getElementById('interactive') as HTMLElement).getByRole('toolbar'));
	});
});
