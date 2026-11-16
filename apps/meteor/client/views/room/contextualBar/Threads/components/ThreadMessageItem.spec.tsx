import type { IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ThreadMessageItem } from './ThreadMessageItem';
import { createFakeMessage } from '../../../../../../tests/mocks/data';
import { MessagesProvider } from '../../../../../providers/MessagesProvider';
import { selectedMessageStore } from '../../../providers/SelectedMessageStore';

jest.mock('../../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../providers/DateListProvider', () => ({ useDateRef: () => undefined }));
let mockSubscription: { ignored?: string[] } | undefined;
jest.mock('../../../contexts/RoomContext', () => ({ useRoomSubscription: () => mockSubscription }));

const reply = createFakeMessage({
	_id: 'reply',
	rid: 'room',
	tmid: 'main',
	msg: 'a reply',
	u: { _id: 'bob', username: 'bob', name: 'Bob' },
}) as IThreadMessage;
const system = createFakeMessage({ _id: 'joined', rid: 'room', tmid: 'main', t: 'uj', msg: 'bob' }) as IThreadMessage;

const renderItem = (
	message: IThreadMessage | IThreadMainMessage,
	props: { firstUnread?: boolean; system?: boolean } = {},
	root = mockAppRoot().withJohnDoe(),
) =>
	render(
		<ThreadMessageItem
			message={message}
			previous={message}
			sequential={false}
			shouldShowAsSequential={false}
			firstUnread={props.firstUnread ?? false}
			system={props.system ?? false}
		/>,
		{ wrapper: root.wrap((children: ReactNode) => <MessagesProvider>{children}</MessagesProvider>).build() },
	);

beforeEach(() => {
	mockSubscription = undefined;
});

afterEach(() => act(() => selectedMessageStore.reset()));

it('draws a thread message or a system message, and the first unread one marked (message-variants R41)', () => {
	const { unmount } = renderItem(reply, { firstUnread: true });
	const message = screen.getAllByRole('listitem').find((item) => item.getAttribute('aria-roledescription') === 'thread_message');
	expect(message).toHaveAttribute('data-unread', 'true');
	expect(screen.getAllByRole('listitem')).toHaveLength(2);
	unmount();

	renderItem(system, { system: true });
	expect(screen.getByRole('listitem')).toHaveAttribute('aria-roledescription', 'system_message');
});

it('passes ignoredUser for an author ignored in the subscription and for an ignored message (message-variants R28)', () => {
	mockSubscription = { ignored: ['bob'] };
	const ignoredAuthor = renderItem(reply);
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
	ignoredAuthor.unmount();

	mockSubscription = undefined;
	const ignoredMessage = renderItem({ ...reply, ignored: true } as IThreadMessage);
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
	ignoredMessage.unmount();

	renderItem(reply);
	expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
});

it("keeps the messages of the thread out of the room's selection, whatever state it is in (message-variants R24)", () => {
	act(() => selectedMessageStore.setIsSelecting(true));
	const { unmount } = renderItem(reply);
	unmount();
	renderItem(system, { system: true });

	expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
	expect(selectedMessageStore.availableMessagesCount()).toBe(0);
	expect(selectedMessageStore.getSelectedMessages()).toEqual([]);
});

it('reads whether avatars show from the display context (message-variants R46)', () => {
	const { unmount } = renderItem(reply, {}, mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true));
	expect(screen.getByRole('figure')).toBeInTheDocument();
	unmount();

	renderItem(reply, {}, mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', false));
	expect(screen.queryByRole('figure')).not.toBeInTheDocument();
});
