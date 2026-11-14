import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { clientCallbacks } from '@rocket.chat/ui-client';
import { act, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import ThreadChat from './ThreadChat';
import { createFakeMessage, createFakeRoom } from '../../../../../../tests/mocks/data';
import type { ChatAPI } from '../../../../../lib/chats/ChatAPI';
import { ChatContext } from '../../../contexts/ChatContext';
import { RoomContext } from '../../../contexts/RoomContext';
import { useThreadMessagesQuery } from '../hooks/useThreadMessagesQuery';

jest.mock('../../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../../lib/SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../../../../../lib/onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn((message) => message) }));
jest.mock('../../../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../hooks/useThreadMessagesQuery', () => ({ useThreadMessagesQuery: jest.fn() }));
jest.mock('../../../hooks/useFirstUnreadMessageId', () => ({ useFirstUnreadMessageId: () => undefined }));
jest.mock('../../../body/hooks/useFileUploadDropTarget', () => ({
	useFileUploadDropTarget: () => [{}, { visible: false, onDismiss: jest.fn(), enabled: true }],
}));
jest.mock('../../../body/DropTargetOverlay', () => () => null);
jest.mock('../../../composer/RoomComposer/RoomComposer', () => ({ children }: { children: ReactNode }) => <div>{children}</div>);
jest.mock('../../../composer/ComposerContainer', () => () => <textarea aria-label='Thread composer' />);

// The virtualizer cannot measure anything in jsdom: the list draws every row instead
jest.mock('@rocket.chat/ui-message-list/dist/MessageList/MessageListVirtualizer', () =>
	jest.requireActual('@rocket.chat/ui-message-list/dist/MessageList/MessageListRows'),
);

let mockMounts = 0;
let mockFailure = false;
jest.mock('@rocket.chat/ui-message-list', () => {
	const actual = jest.requireActual('@rocket.chat/ui-message-list');
	const { createElement, useEffect } = jest.requireActual('react');
	return {
		...actual,
		MessageList: (props: unknown) => {
			useEffect(() => {
				mockMounts++;
			}, []);
			if (mockFailure) {
				throw new Error('the list failed');
			}
			return createElement(actual.MessageList, props);
		},
	};
});

const room = createFakeRoom({ _id: 'room-id', t: 'c' });
const mainMessage = (_id: string) => createFakeMessage<IThreadMainMessage>({ _id, rid: room._id, msg: `main ${_id}`, tcount: 1 });
const reply = (tmid: string) =>
	createFakeMessage<IThreadMessage>({ _id: `reply-of-${tmid}`, rid: room._id, tmid, msg: `reply of ${tmid}` });

const readThread = jest.fn().mockResolvedValue(null);
const chat = { messageEditing: { toPreviousMessage: jest.fn(), toNextMessage: jest.fn() } } as unknown as ChatAPI;

// No focus scope, no room body and no selection provider surround the thread, as in the conference panels
const wrapper = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('POST', '/v1/chat.readThread', readThread)
	.wrap((children: ReactNode) => (
		<ChatContext.Provider value={chat}>
			<RoomContext.Provider value={{ rid: room._id, room, subscribed: false }}>{children}</RoomContext.Provider>
		</ChatContext.Provider>
	))
	.build();

const mockQueryOf = (tmid: string) =>
	jest.mocked(useThreadMessagesQuery).mockReturnValue({
		data: { messages: [reply(tmid)], itemCount: 1 },
		isLoading: false,
		hasNextPage: false,
		isFetchingNextPage: false,
		hasPreviousPage: false,
		isFetchingPreviousPage: false,
		fetchNextPage: jest.fn(),
		fetchPreviousPage: jest.fn(),
		loadMessageAround: jest.fn(),
		jumpToRecent: jest.fn(),
	} as never);

beforeEach(() => {
	mockMounts = 0;
	mockFailure = false;
	mockQueryOf('thread-a');
});

afterEach(() => jest.clearAllMocks());

it('renders the thread list and its composer without the room around them (R1, R52)', () => {
	render(<ThreadChat mainMessage={mainMessage('thread-a')} />, { wrapper });

	expect(screen.getByRole('list', { name: 'Thread_message_list' })).toBeInTheDocument();
	expect(screen.getByText('reply of thread-a')).toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: 'Thread composer' })).toBeInTheDocument();
});

it('keeps a list that fails inside the error boundary (R1)', () => {
	mockFailure = true;
	jest.spyOn(console, 'error').mockImplementation(() => undefined);

	render(<ThreadChat mainMessage={mainMessage('thread-a')} />, { wrapper });

	expect(screen.getByText('Error_something_went_wrong')).toBeInTheDocument();
	expect(screen.getByRole('textbox', { name: 'Thread composer' })).toBeInTheDocument();
});

it('shows another thread at its own opening position, with nothing carried over (R6)', () => {
	const { rerender } = render(<ThreadChat mainMessage={mainMessage('thread-a')} />, { wrapper });
	expect(mockMounts).toBe(1);

	rerender(<ThreadChat mainMessage={{ ...mainMessage('thread-a'), tcount: 2 }} />);
	expect(mockMounts).toBe(1);

	mockQueryOf('thread-b');
	rerender(<ThreadChat mainMessage={mainMessage('thread-b')} />);

	expect(mockMounts).toBe(2);
	expect(screen.getByText('reply of thread-b')).toBeInTheDocument();
});

it('marks the thread as read when a reply of the thread arrives, and for no other message (R42)', async () => {
	render(<ThreadChat mainMessage={mainMessage('thread-a')} />, { wrapper });

	await act(async () => {
		await clientCallbacks.run('streamNewMessage', { ...reply('another-thread'), tmid: 'another-thread' });
		await clientCallbacks.run('streamNewMessage', {
			...reply('thread-a'),
			editedAt: new Date(),
			editedBy: { _id: 'bob', username: 'bob' },
		});
	});
	expect(readThread).not.toHaveBeenCalled();

	await act(async () => {
		await clientCallbacks.run('streamNewMessage', reply('thread-a'));
	});

	await waitFor(() => expect(readThread).toHaveBeenCalledWith({ tmid: 'thread-a' }));
});
