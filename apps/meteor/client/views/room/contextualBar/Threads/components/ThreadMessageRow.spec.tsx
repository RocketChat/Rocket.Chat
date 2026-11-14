import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ThreadMessageRow from './ThreadMessageRow';
import { createFakeMessage } from '../../../../../../tests/mocks/data';
import { MessagesProvider } from '../../../../../providers/MessagesProvider';
import { MessageMarkers } from '../../../../../providers/MessagesProvider/MessageMarkers';
import { selectedMessageStore } from '../../../providers/SelectedMessageStore';

jest.mock('../../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));

const reply = createFakeMessage({
	_id: 'reply',
	rid: 'room',
	tmid: 'main',
	msg: 'a reply',
	u: { _id: 'bob', username: 'bob', name: 'Bob' },
}) as IThreadMessage;
const system = createFakeMessage({ _id: 'joined', rid: 'room', tmid: 'main', t: 'uj', msg: 'bob' }) as IThreadMessage;
const main = createFakeMessage({ _id: 'main', rid: 'room', msg: 'the main message', tcount: 1 }) as IThreadMainMessage;

const renderRow = (
	message: IThreadMessage | IThreadMainMessage,
	props: { isFirstUnread?: boolean; ignored?: string[] } = {},
	root = mockAppRoot().withJohnDoe(),
) =>
	render(<ThreadMessageRow message={message} isSequential={false} isFirstUnread={props.isFirstUnread ?? false} />, {
		wrapper: root
			.wrap((children: ReactNode) => (
				<MessagesProvider>
					<MessageMarkers subscription={props.ignored ? ({ rid: 'room', ignored: props.ignored } as never) : undefined}>
						{children}
					</MessageMarkers>
				</MessagesProvider>
			))
			.build(),
	});

afterEach(() => act(() => selectedMessageStore.reset()));

it('draws a system message and any other message, the main one included, with the variant of its type (R2)', () => {
	const { unmount } = renderRow(reply);
	expect(screen.getByRole('listitem')).toHaveAttribute('aria-roledescription', 'thread_message');
	unmount();

	const mainRow = renderRow(main);
	expect(screen.getByRole('listitem')).toHaveAttribute('aria-roledescription', 'thread_message');
	mainRow.unmount();

	renderRow(system);
	expect(screen.getByRole('listitem')).toHaveAttribute('aria-roledescription', 'system_message');
});

it('marks the first unread message (R2, message-variants R41)', () => {
	renderRow(reply, { isFirstUnread: true });

	expect(screen.getByRole('listitem')).toHaveAttribute('data-unread', 'true');
});

it('passes ignoredUser for an author ignored in the subscription and for an ignored message (R2, message-variants R28)', () => {
	const ignoredAuthor = renderRow(reply, { ignored: ['bob'] });
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
	ignoredAuthor.unmount();

	const ignoredMessage = renderRow({ ...reply, ignored: true } as IThreadMessage);
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
	ignoredMessage.unmount();

	renderRow(reply);
	expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
});

it("keeps the messages of the thread out of the room's selection, whatever state it is in (message-variants R24, R44)", () => {
	act(() => selectedMessageStore.setIsSelecting(true));
	const { unmount } = renderRow(reply);
	unmount();
	renderRow(system);

	expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
	expect(selectedMessageStore.availableMessagesCount()).toBe(0);
	expect(selectedMessageStore.getSelectedMessages()).toEqual([]);
});

it('reads whether avatars show from the display context (message-variants R46)', () => {
	const { unmount } = renderRow(reply, {}, mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true));
	expect(screen.getByRole('figure')).toBeInTheDocument();
	unmount();

	renderRow(reply, {}, mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', false));
	expect(screen.queryByRole('figure')).not.toBeInTheDocument();
});
