import type { IMessage, IThreadMessage, ISubscription } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ThreadMessageContent from './ThreadMessageContent';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';
import type { MessageRelatedDataContextValue } from '../../contexts/MessageRelatedDataContext';

it('draws its parts in order and no metrics (R34)', () => {
	const message = createFakeMessage<IThreadMessage>({
		_id: 'reply',
		tmid: 'thread-main',
		rid: 'room',
		msg: 'the body',
		md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'the body' }] }],
		urls: [{ url: 'https://rocket.chat', meta: { ogTitle: 'Rocket.Chat home' } }],
		reactions: { ':smile:': { usernames: ['alice'] } },
		location: { type: 'Point', coordinates: [1, 2] },
		attachments: [
			{ text: 'quoted text', author_name: 'bob', author_icon: '', message_link: '/channel/general?msg=quoted' } as never,
			{ title: 'a title', description: 'the attachment', title_link: '/file' } as never,
		],
		tcount: 3,
		tlm: new Date(),
		replies: ['alice'],
		drid: 'discussion',
		dcount: 2,
		dlm: new Date(),
	} as Partial<IThreadMessage>);

	const { container } = render(<ThreadMessageContent message={message} />, {
		wrapper: mockMessageProviders({ display: { embedsEnabled: true } }).wrapper,
	});

	const text = container.textContent ?? '';
	const order = ['quoted text', 'the body', 'a title', 'Rocket.Chat home', ':smile:', 'Shared_Location'].map((part) => text.indexOf(part));
	expect(order.every((position) => position >= 0)).toBe(true);
	expect(order).toEqual([...order].sort((a, b) => a - b));
	expect(screen.queryByRole('button', { name: 'View_thread' })).not.toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'message_counter' })).not.toBeInTheDocument();
});

it('renders UiKit blocks before the attachments, in place of the body (R34)', () => {
	const UiKitMessageBlock = () => <div>uikit block</div>;
	const blocks = [{ type: 'section', text: { type: 'plain_text', text: 'hello' } }] as IMessage['blocks'];
	const message = createFakeMessage<IThreadMessage>({ tmid: 'main', msg: 'fallback text', blocks });

	render(<ThreadMessageContent message={message} />, { wrapper: mockMessageProviders({ renderers: { UiKitMessageBlock } }).wrapper });

	expect(screen.getByText('uikit block')).toBeInTheDocument();
	expect(screen.queryByText('fallback text')).not.toBeInTheDocument();
});

describe('the broadcast reply', () => {
	const message = createFakeMessage<IThreadMessage>({ tmid: 'main', msg: 'announcement', u: { _id: 'author', username: 'author' } });
	const conversation: MessageRelatedDataContextValue['useConversation'] = (_message, { select }) => {
		const data = { room: undefined, subscription: { _id: 'subscription', rid: 'room', t: 'c', broadcast: true } as ISubscription };
		return { data: (select ? select(data) : data) as never, isLoading: false, isError: false };
	};

	it('is offered for a message of someone else in a broadcast room, only where interaction is allowed (R38)', () => {
		const { unmount } = render(<ThreadMessageContent message={message} />, {
			wrapper: mockMessageProviders({ relatedData: { useConversation: conversation } }).wrapper,
		});
		expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument();
		unmount();

		render(<ThreadMessageContent message={message} />, {
			wrapper: mockMessageProviders({ display: { allowsInteraction: false }, relatedData: { useConversation: conversation } }).wrapper,
		});
		expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
	});

	it('is not offered for the viewer own message (R38)', () => {
		render(<ThreadMessageContent message={message} />, {
			wrapper: mockMessageProviders({
				root: mockAppRoot().withUser({ _id: 'author', username: 'author' } as never),
				relatedData: { useConversation: conversation },
			}).wrapper,
		});

		expect(screen.queryByRole('button', { name: 'Reply' })).not.toBeInTheDocument();
	});
});

it('draws no 0 for empty action links and reactions (R38)', () => {
	const message = createFakeMessage<IThreadMessage>({ tmid: 'main', msg: '', md: [], reactions: {}, actionLinks: [] });

	const { container } = render(<ThreadMessageContent message={message} />, { wrapper: mockMessageProviders().wrapper });

	expect(container).toBeEmptyDOMElement();
});

it('gives the body no id, as the row of a thread message is not named by it and the room may show the same message (R34)', () => {
	const message = createFakeMessage<IThreadMessage>({
		_id: 'reply',
		tmid: 'main',
		msg: 'the body',
		md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'the body' }] }],
	});

	render(<ThreadMessageContent message={message} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByText('the body')).not.toHaveAttribute('id');
	expect(document.getElementById('reply-content')).not.toBeInTheDocument();
});
