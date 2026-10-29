import type { IDiscussionMessage, IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, createFakeSubscription, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import RoomMessageContent from './RoomMessageContent';
import { mockMessageProviders } from '../../../../../tests/utils/mockMessageProviders';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

const props = { unread: false, mention: false, all: false };

const threadMain = createFakeMessage<IThreadMainMessage>({
	_id: 'thread-main',
	msg: 'thread main',
	tcount: 2,
	tlm: new Date('2024-03-10T15:20:00.000Z'),
	replies: ['alice', 'bob'],
});

it('should show the thread metrics of a thread main message', () => {
	render(<RoomMessageContent {...props} message={threadMain} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByRole('button', { name: 'View_thread' })).toBeInTheDocument();
});

it('should hide the thread metrics where messages cannot be acted on', () => {
	render(<RoomMessageContent {...props} message={threadMain} />, {
		wrapper: mockMessageProviders({ display: { allowsInteraction: false } }).wrapper,
	});

	expect(screen.queryByRole('button', { name: 'View_thread' })).not.toBeInTheDocument();
});

it('should show that the viewer follows a thread they replied to', () => {
	render(<RoomMessageContent {...props} message={threadMain} />, {
		wrapper: mockMessageProviders({ root: mockAppRoot().withUser({ _id: 'alice', username: 'alice' } as never) }).wrapper,
	});

	expect(screen.getByTitle('Following')).toBeInTheDocument();
});

describe('broadcast', () => {
	const message = createFakeMessage({ msg: 'announcement', u: { _id: 'author', username: 'author' } });
	const broadcastConversation = () => ({
		data: { room: undefined, subscription: createFakeSubscription({ broadcast: true }) },
		isLoading: false,
		isError: false,
	});

	it('should offer to reply to a message of a broadcast room', () => {
		render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({ relatedData: { useConversation: broadcastConversation } }).wrapper,
		});

		expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
	});

	it('should not offer to reply where messages cannot be acted on', () => {
		render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({ display: { allowsInteraction: false }, relatedData: { useConversation: broadcastConversation } })
				.wrapper,
		});

		expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
	});
});

it('should render UiKit blocks through the injected renderer instead of the body', () => {
	const UiKitMessageBlock = jest.fn(() => <div>uikit block</div>);
	const blocks = [{ type: 'section', text: { type: 'plain_text', text: 'hello' } }] as IMessage['blocks'];
	const message = createFakeMessage({ _id: 'with-blocks', rid: 'room', msg: 'fallback text', blocks });

	render(<RoomMessageContent {...props} message={message} />, {
		wrapper: mockMessageProviders({ renderers: { UiKitMessageBlock } }).wrapper,
	});

	expect(screen.getByText('uikit block')).toBeInTheDocument();
	expect(UiKitMessageBlock).toHaveBeenCalledWith({ rid: 'room', mid: 'with-blocks', blocks }, undefined);
	expect(screen.queryByText('fallback text')).not.toBeInTheDocument();
});

it('should show URL previews only when embeds are enabled', () => {
	const message = createFakeMessage({
		msg: 'look',
		urls: [{ url: 'https://rocket.chat', meta: { ogTitle: 'Rocket.Chat home' } }],
	});

	const { unmount } = render(<RoomMessageContent {...props} message={message} />, { wrapper: mockMessageProviders().wrapper });
	expect(screen.queryByText('Rocket.Chat home')).not.toBeInTheDocument();
	unmount();

	render(<RoomMessageContent {...props} message={message} />, {
		wrapper: mockMessageProviders({ display: { embedsEnabled: true } }).wrapper,
	});
	expect(screen.getByText('Rocket.Chat home')).toBeInTheDocument();
});

it('should open a discussion from its metrics', () => {
	const message = createFakeMessage<IDiscussionMessage>({ msg: 'discuss', drid: 'discussion', dcount: 3, dlm: new Date() });

	render(<RoomMessageContent {...props} message={message} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByRole('button', { name: 'message_counter' })).toHaveAttribute('data-drid', 'discussion');
});

it('should not render anything for empty reactions and action links', () => {
	const message = createFakeMessage({ msg: '', md: [], reactions: {}, actionLinks: [] });

	const { container } = render(<RoomMessageContent {...props} message={message} />, { wrapper: mockMessageProviders().wrapper });

	expect(container).toBeEmptyDOMElement();
});
