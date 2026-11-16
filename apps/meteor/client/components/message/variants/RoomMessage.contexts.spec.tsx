import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import RoomMessage from './RoomMessage';
import { createFakeRoom } from '../../../../tests/mocks/data';
import { MessagesProvider } from '../../../providers/MessagesProvider';
import MessageListProvider from '../../../views/room/MessageList/providers/MessageListProvider';
import { ChatContext } from '../../../views/room/contexts/ChatContext';

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
