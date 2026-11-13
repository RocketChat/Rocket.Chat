import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RoomMessage from './RoomMessage';
import { selectedMessageStore } from '../../../views/room/providers/SelectedMessagesProvider';
import { MessageListContext, messageListContextDefaultValue } from '../list/MessageListContext';

const message: IMessage = {
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: {
		_id: 'userId',
		name: 'userName',
		username: 'userName',
	},
	msg: 'message body',
	md: [
		{
			type: 'PARAGRAPH',
			value: [
				{
					type: 'PLAIN_TEXT',
					value: 'message body',
				},
			],
		},
	],
	rid: 'roomId',
	_id: 'messageId',
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
	urls: [],
};

it('should show normal message', () => {
	render(
		<RoomMessage
			message={message}
			sequential={false}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={false}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByRole('figure')).toBeInTheDocument();
	expect(screen.getByText('message body')).toBeInTheDocument();
	expect(screen.queryByRole('button', { name: 'Message_Ignored' })).not.toBeInTheDocument();
});

it.each([
	['an ignored user', { ignoredUser: true }, message],
	['an ignored message', { ignoredUser: false }, { ...message, ignored: true }],
])('should hide the content of %s until the user asks to see it', async (_case, props, ignoredMessage) => {
	render(
		<RoomMessage message={ignoredMessage} sequential={false} all={false} mention={false} unread={false} showUserAvatar={true} {...props} />,
		{ wrapper: mockAppRoot().build() },
	);

	expect(screen.getByRole('figure')).toBeInTheDocument();
	expect(screen.queryByText('message body')).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));

	expect(screen.getByText('message body')).toBeInTheDocument();
});

it('should show read receipt', () => {
	render(
		<RoomMessage
			message={message}
			sequential={false}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={false}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot()
				.wrap((children) => (
					<MessageListContext.Provider value={{ ...messageListContextDefaultValue, readReceipts: { enabled: true, storeUsers: false } }}>
						{children}
					</MessageListContext.Provider>
				))
				.build(),
		},
	);

	expect(screen.getByRole('status', { name: 'Message_viewed' })).toBeInTheDocument();
});

it('should not show read receipt if receipt is disabled', () => {
	render(
		<RoomMessage
			message={message}
			sequential={false}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={false}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot()
				.wrap((children) => (
					<MessageListContext.Provider value={{ ...messageListContextDefaultValue, readReceipts: { enabled: false, storeUsers: false } }}>
						{children}
					</MessageListContext.Provider>
				))
				.build(),
		},
	);

	expect(screen.queryByRole('status', { name: 'Message_viewed' })).not.toBeInTheDocument();
});

it('should show a placeholder instead of failing when the message content cannot be rendered', () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	const malformed = { ...message, actionLinks: [null] } as unknown as IMessage;

	render(
		<RoomMessage
			message={malformed}
			sequential={false}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={false}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByRole('figure')).toBeInTheDocument();
	expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();
});

it('should name a sequential message after its placeholder', () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	const malformed = { ...message, actionLinks: [null] } as unknown as IMessage;

	render(
		<RoomMessage
			message={malformed}
			sequential={true}
			all={false}
			mention={false}
			unread={false}
			ignoredUser={false}
			showUserAvatar={true}
		/>,
		{
			wrapper: mockAppRoot().build(),
		},
	);

	expect(screen.getByRole('listitem', { name: 'Message_could_not_be_displayed' })).toBeInTheDocument();
});

it('should render the content again once the message is fixed', () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);
	const malformed = { ...message, actionLinks: [null] } as unknown as IMessage;
	const props = { sequential: false, all: false, mention: false, unread: false, ignoredUser: false, showUserAvatar: true };

	const { rerender } = render(<RoomMessage message={malformed} {...props} />, { wrapper: mockAppRoot().build() });
	expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();

	rerender(<RoomMessage message={{ ...message }} {...props} />);

	expect(screen.queryByText('Message_could_not_be_displayed')).not.toBeInTheDocument();
	expect(screen.getByText('message body')).toBeInTheDocument();
});

describe('selecting messages', () => {
	const renderMessage = () =>
		render(<RoomMessage message={message} sequential={false} all={false} mention={false} unread={false} showUserAvatar={true} />, {
			wrapper: mockAppRoot().build(),
		});

	afterEach(() => {
		selectedMessageStore.reset();
	});

	describe('while selecting', () => {
		beforeEach(() => {
			selectedMessageStore.setIsSelecting(true);
		});

		it('should select the message on a click', async () => {
			renderMessage();

			await userEvent.click(screen.getByRole('listitem'));

			expect(selectedMessageStore.isSelected(message._id)).toBe(true);
		});

		it.each(['Space', 'Enter'])('should select the message with the %s key', (code) => {
			renderMessage();

			fireEvent.keyDown(screen.getByRole('listitem'), { code });

			expect(selectedMessageStore.isSelected(message._id)).toBe(true);
		});

		it('should ignore other keys', () => {
			renderMessage();

			fireEvent.keyDown(screen.getByRole('listitem'), { code: 'KeyA' });

			expect(selectedMessageStore.isSelected(message._id)).toBe(false);
		});

		it('should replace the avatar with a checkbox', () => {
			renderMessage();

			expect(screen.getByRole('checkbox')).toBeInTheDocument();
		});
	});

	it('should not select the message outside selection', async () => {
		renderMessage();

		await userEvent.click(screen.getByRole('listitem'));
		fireEvent.keyDown(screen.getByRole('listitem'), { code: 'Enter' });

		expect(selectedMessageStore.isSelected(message._id)).toBe(false);
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
	});
});
