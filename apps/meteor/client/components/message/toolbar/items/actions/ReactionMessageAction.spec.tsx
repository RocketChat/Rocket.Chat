import { mockAppRoot } from '@rocket.chat/mock-providers';
import { EmojiPickerContext } from '@rocket.chat/ui-emoji-picker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ContextType } from 'react';

import ReactionMessageAction from './ReactionMessageAction';
import { createFakeMessage, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../../../tests/mocks/data';
import { roomCoordinator } from '../../../../../lib/rooms/roomCoordinator';
import { ChatContext } from '../../../../../views/room/contexts/ChatContext';

jest.mock('../../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { readOnly: jest.fn() },
}));

const readOnly = jest.mocked(roomCoordinator.readOnly);

const setReaction = jest.fn();
const addRecentEmoji = jest.fn();
const openEmojiPicker = jest.fn();

const chat = { emojiPicker: { open: openEmojiPicker } } as unknown as ContextType<typeof ChatContext>;

const emojiPicker = {
	addRecentEmoji,
	handlePreview: jest.fn(),
	handleRemovePreview: jest.fn(),
	quickReactions: ['smile', 'heart', 'rocket', 'tada'].map((emoji) => ({ emoji, image: '<span>emoji</span>' })),
} as unknown as ContextType<typeof EmojiPickerContext>;

const defaultProps = () => ({
	message: createFakeMessage({ _id: 'message-id' }),
	room: createFakeRoom({ t: 'c' }),
	subscription: createFakeSubscription(),
});

const wrapperWith = (
	{ chatValue, loggedIn = true }: { chatValue?: ContextType<typeof ChatContext>; loggedIn?: boolean } = { chatValue: chat },
) => {
	const root = mockAppRoot()
		.withEndpoint('POST', '/v1/chat.react', setReaction)
		.wrap((children) => (
			<EmojiPickerContext.Provider value={emojiPicker}>
				<ChatContext.Provider value={chatValue}>{children}</ChatContext.Provider>
			</EmojiPickerContext.Provider>
		));
	if (loggedIn) {
		root.withUser(createFakeUser());
	}

	return root.build();
};

const renderAction = (props: Partial<ComponentProps<typeof ReactionMessageAction>> = {}, options?: Parameters<typeof wrapperWith>[0]) =>
	render(<ReactionMessageAction {...defaultProps()} {...props} />, { wrapper: wrapperWith(options) });

describe('ReactionMessageAction', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		readOnly.mockReturnValue(false);
	});

	it('should show three quick reactions and the reaction button', () => {
		renderAction();

		expect(screen.getByTitle('smile')).toBeInTheDocument();
		expect(screen.getByTitle('rocket')).toBeInTheDocument();
		expect(screen.queryByTitle('tada')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Add_Reaction' })).toBeInTheDocument();
	});

	it('should react to the message and remember the emoji', async () => {
		renderAction();

		await userEvent.click(screen.getByTitle('heart'));

		expect(setReaction).toHaveBeenCalledWith({ emoji: ':heart:', messageId: 'message-id' });
		expect(addRecentEmoji).toHaveBeenCalledWith('heart');
	});

	it('should react with the emoji chosen in the picker', async () => {
		const onChangeMenuVisibility = jest.fn();
		renderAction({ onChangeMenuVisibility });

		await userEvent.click(screen.getByRole('button', { name: 'Add_Reaction' }));
		const [, onPick, onClose] = openEmojiPicker.mock.calls[0];
		onPick('thumbsup');
		onClose();

		expect(setReaction).toHaveBeenCalledWith({ emoji: ':thumbsup:', messageId: 'message-id' });
		expect(onChangeMenuVisibility.mock.calls).toEqual([[true], [false]]);
	});

	it('should keep a click on the reaction button from reaching the message', async () => {
		const onMessageClick = jest.fn();
		render(
			<div role='presentation' onClick={onMessageClick}>
				<ReactionMessageAction {...defaultProps()} />
			</div>,
			{ wrapper: wrapperWith() },
		);

		await userEvent.click(screen.getByRole('button', { name: 'Add_Reaction' }));

		expect(onMessageClick).not.toHaveBeenCalled();
	});

	it.each([
		['an omnichannel room', { room: createFakeRoom({ t: 'l' }) }],
		['a user who is not in the room', { subscription: undefined }],
		['a private message', { message: createFakeMessage({ private: true }) }],
		['a room federated by a removed protocol', { room: createFakeRoom({ t: 'c', federated: true }) }],
	])('should show nothing for %s', (_case, props) => {
		const { container } = renderAction(props as Partial<ComponentProps<typeof ReactionMessageAction>>);

		expect(container).toBeEmptyDOMElement();
	});

	it('should show nothing outside a chat', () => {
		const { container } = renderAction({}, {});

		expect(container).toBeEmptyDOMElement();
	});

	it('should show nothing to a visitor who is not logged in', () => {
		const { container } = renderAction({}, { chatValue: chat, loggedIn: false });

		expect(container).toBeEmptyDOMElement();
	});

	it('should show nothing in a read-only room', () => {
		readOnly.mockReturnValue(true);

		const { container } = renderAction();

		expect(container).toBeEmptyDOMElement();
	});

	it('should allow reactions in a read-only room that accepts them', () => {
		readOnly.mockReturnValue(true);

		renderAction({ room: createFakeRoom({ t: 'c', reactWhenReadOnly: true }) });

		expect(screen.getByRole('button', { name: 'Add_Reaction' })).toBeInTheDocument();
	});
});
