import type { IDiscussionMessage, IMessage, ISubscription, IThreadMainMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import RoomMessageContent from './RoomMessageContent';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';

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

describe('the thread metrics', () => {
	it('shows the metrics of a thread main message with the unread, mention and all markers, only where interaction is allowed (R31)', () => {
		const { unmount } = render(<RoomMessageContent {...props} unread mention message={threadMain} />, {
			wrapper: mockMessageProviders().wrapper,
		});
		expect(screen.getByRole('button', { name: 'View_thread' })).toBeInTheDocument();
		expect(screen.getByTitle('Mentions_you')).toBeInTheDocument();
		unmount();

		const all = render(<RoomMessageContent {...props} unread all message={threadMain} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByTitle('mention-all')).toBeInTheDocument();
		all.unmount();

		render(<RoomMessageContent {...props} message={threadMain} />, {
			wrapper: mockMessageProviders({ display: { allowsInteraction: false } }).wrapper,
		});
		expect(screen.queryByRole('button', { name: 'View_thread' })).not.toBeInTheDocument();
	});

	it('shows that the viewer follows a thread they replied to (R31)', () => {
		render(<RoomMessageContent {...props} message={threadMain} />, {
			wrapper: mockMessageProviders({ root: mockAppRoot().withUser({ _id: 'alice', username: 'alice' } as never) }).wrapper,
		});

		expect(screen.getByTitle('Following')).toBeInTheDocument();
	});
});

describe('the broadcast reply', () => {
	const message = createFakeMessage({ msg: 'announcement', u: { _id: 'author', username: 'author' } });
	const conversation = (broadcast: boolean) => () => ({
		data: {
			room: undefined,
			subscription: { _id: 'subscription', rid: 'room', t: 'c', ...(broadcast && { broadcast: true }) } as ISubscription,
		},
		isLoading: false,
		isError: false,
	});

	it('is offered for a message of someone else in a broadcast room the viewer is subscribed to (R38)', () => {
		render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({ relatedData: { useConversation: conversation(true) } }).wrapper,
		});

		expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
	});

	it('is not offered where messages cannot be acted on, in another kind of room, or for the viewer own message (R38)', () => {
		const off = render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({ display: { allowsInteraction: false }, relatedData: { useConversation: conversation(true) } })
				.wrapper,
		});
		expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
		off.unmount();

		const other = render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({ relatedData: { useConversation: conversation(false) } }).wrapper,
		});
		expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
		other.unmount();

		render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({
				root: mockAppRoot().withUser({ _id: 'author', username: 'author' } as never),
				relatedData: { useConversation: conversation(true) },
			}).wrapper,
		});
		expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
	});
});

describe('the parts, in order', () => {
	it('draws its parts in order, each only when it applies (R33)', () => {
		const message = createFakeMessage<IDiscussionMessage>({
			_id: 'full',
			rid: 'room',
			msg: 'the body',
			md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'the body' }] }],
			urls: [{ url: 'https://rocket.chat', meta: { ogTitle: 'Rocket.Chat home' } }],
			reactions: { ':smile:': { usernames: ['alice'] } },
			location: { type: 'Point', coordinates: [1, 2] },
			actionLinks: [{ icon: 'add-user', label: 'Action', i18nLabel: 'Action' as never, method_id: 'method', params: '' }],
			drid: 'discussion',
			dcount: 3,
			dlm: new Date(),
			attachments: [
				{ text: 'quoted', message_link: 'link', author_name: 'alice' } as never,
				{ title: 'a title', description: 'the attachment', title_link: '/file' } as never,
			],
		});
		const { container } = render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({ display: { embedsEnabled: true } }).wrapper,
		});

		const text = container.textContent ?? '';
		const order = ['quoted', 'the body', 'a title', 'Rocket.Chat home', 'Action', ':smile:', 'message_counter', 'Shared_Location'].map(
			(part) => text.indexOf(part),
		);
		expect(order.every((position) => position >= 0)).toBe(true);
		expect(order).toEqual([...order].sort((a, b) => a - b));
		expect(screen.getByRole('button', { name: 'Add_Reaction' })).toBeInTheDocument();
	});

	it('renders UiKit blocks through the renderer instead of the body (R33)', () => {
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

	it('shows URL previews only when embeds are enabled (R33)', () => {
		const message = createFakeMessage({ msg: 'look', urls: [{ url: 'https://rocket.chat', meta: { ogTitle: 'Rocket.Chat home' } }] });

		const { unmount } = render(<RoomMessageContent {...props} message={message} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.queryByText('Rocket.Chat home')).not.toBeInTheDocument();
		unmount();

		render(<RoomMessageContent {...props} message={message} />, {
			wrapper: mockMessageProviders({ display: { embedsEnabled: true } }).wrapper,
		});
		expect(screen.getByText('Rocket.Chat home')).toBeInTheDocument();
	});

	it('gives the body the id its row is named by, and highlights the search text (R33)', () => {
		const message = createFakeMessage({
			_id: 'body',
			msg: 'find me',
			md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'find me' }] }],
		});
		const Markup = jest.fn(() => <span>marked up</span>);

		render(<RoomMessageContent {...props} message={message} searchText='find' />, {
			wrapper: mockMessageProviders({ renderers: { Markup } }).wrapper,
		});

		expect(Markup).toHaveBeenCalledWith(expect.objectContaining({ searchText: 'find' }), undefined);
		expect(document.getElementById('body-content')).toBeInTheDocument();
	});

	it('opens a discussion from its metrics (R33)', () => {
		const message = createFakeMessage<IDiscussionMessage>({ msg: 'discuss', drid: 'discussion', dcount: 3, dlm: new Date() });

		render(<RoomMessageContent {...props} message={message} />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByRole('button', { name: 'message_counter' })).toHaveAttribute('data-drid', 'discussion');
	});

	it('draws no 0 for empty action links and reactions (R38)', () => {
		const message = createFakeMessage({ msg: '', md: [], reactions: {}, actionLinks: [] });

		const { container } = render(<RoomMessageContent {...props} message={message} />, { wrapper: mockMessageProviders().wrapper });

		expect(container).toBeEmptyDOMElement();
	});
});
