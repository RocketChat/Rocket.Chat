import type { IMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import { MessageListItem } from './MessageListItem';
import type { MessageListItemProps } from './MessageListItem';
import { createFakeMessage } from '../../../../tests/mocks/data';
import { MessagesProvider } from '../../../providers/MessagesProvider';
import { roomMessageSelection } from '../../../providers/MessagesProvider/messageSelectionFromStore';
import { selectedMessageStore } from '../providers/SelectedMessageStore';

jest.mock('../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../providers/MessagesProvider/useParentMessage', () => ({
	useParentMessage: () => ({
		data: { _id: 'main', rid: 'room', msg: 'the thread', u: { _id: 'u' } },
		isLoading: false,
		isError: false,
		isSuccess: true,
	}),
}));
jest.mock('../providers/DateListProvider', () => ({ useDateRef: () => undefined }));

const message = createFakeMessage({ _id: 'plain', rid: 'room', msg: 'a message' });
const system = createFakeMessage({ _id: 'system', rid: 'room', t: 'uj', msg: 'bob' });
const reply = createFakeMessage({ _id: 'reply', rid: 'room', tmid: 'main', msg: 'a reply' }) as IThreadMessage;

const rowProps = (target: IMessage, overrides: Partial<MessageListItemProps> = {}): MessageListItemProps => ({
	message: target,
	newDay: false,
	showUnreadDivider: false,
	sequential: false,
	visible: !target.t && !('tmid' in target && target.tmid),
	unread: false,
	mention: false,
	all: false,
	ignoredUser: false,
	system: !!target.t,
	...overrides,
});

const renderRows = (rows: MessageListItemProps[], root = mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', true)) =>
	render(
		<>
			{rows.map((props) => (
				<MessageListItem key={props.message._id} {...props} />
			))}
		</>,
		{
			wrapper: root.wrap((children: ReactNode) => <MessagesProvider selection={roomMessageSelection}>{children}</MessagesProvider>).build(),
		},
	);

afterEach(() => {
	act(() => selectedMessageStore.reset());
	selectedMessageStore.availableMessages.clear();
});

it('draws each message with its variant and its markers (message-variants R40)', () => {
	renderRows([rowProps(message, { unread: true, sequential: true }), rowProps(system), rowProps(reply)]);

	const items = screen.getAllByRole('listitem');
	expect(items.map((item) => item.getAttribute('aria-roledescription'))).toContain('message');
	expect(screen.getByRole('listitem', { name: /a message/ })).toHaveAttribute('data-unread', 'true');
	expect(screen.getByRole('listitem', { name: /a message/ })).toHaveAttribute('data-sequential', 'true');
	expect(items.map((item) => item.getAttribute('aria-roledescription'))).toContain('system_message');
	expect(screen.getByRole('link')).toHaveAttribute('aria-roledescription', 'thread_message_preview');
	expect(screen.getByRole('link')).toHaveAttribute('data-tmid', 'main');
});

it("writes the date of a new day in the format the viewer's settings set (message-variants R40)", () => {
	const onNewDay = createFakeMessage({ _id: 'new-day', rid: 'room', msg: 'a message', ts: new Date(2021, 9, 27, 12) });

	renderRows([rowProps(onNewDay, { newDay: true })], mockAppRoot().withJohnDoe().withSetting('Message_DateFormat', 'YYYY|MM|DD'));

	expect(screen.getByText('2021|10|27')).toBeInTheDocument();
});

it('reads whether avatars show from the display context (message-variants R46)', () => {
	const { unmount } = renderRows([rowProps(message)]);
	expect(screen.getByRole('figure')).toBeInTheDocument();
	unmount();

	renderRows([rowProps(message)], mockAppRoot().withJohnDoe().withUserPreference('displayAvatars', false));
	expect(screen.queryByRole('figure')).not.toBeInTheDocument();
});

describe("the room's selection", () => {
	it("draws the rows with the room's selection (message-variants R25)", () => {
		renderRows([rowProps(message), rowProps(system), rowProps(reply)]);
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

		act(() => selectedMessageStore.setIsSelecting(true));
		expect(screen.getAllByRole('checkbox')).toHaveLength(3);

		act(() => selectedMessageStore.toggle('plain'));
		expect(screen.getAllByRole('checkbox').filter((checkbox) => (checkbox as HTMLInputElement).checked)).toHaveLength(1);
	});

	it('counts the rows it renders that are not selected, and select all selects them (message-variants R26)', () => {
		const { unmount } = renderRows([rowProps(message), rowProps(system), rowProps(reply)]);
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

	it('stops counting a row that unmounts (message-variants R26)', () => {
		const { rerender } = renderRows([rowProps(message), rowProps(system)]);
		expect(selectedMessageStore.availableMessagesCount()).toBe(2);

		rerender(<MessageListItem {...rowProps(message)} />);

		expect(selectedMessageStore.availableMessagesCount()).toBe(1);
	});
});
