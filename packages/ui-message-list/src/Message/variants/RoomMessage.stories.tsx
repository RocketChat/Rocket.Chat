import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import RoomMessage from './RoomMessage';
import { MessageRowStateContext } from '../../MessageList/MessageRowStateContext';
import { MessageDisplayContext, messageDisplayDefaultValue } from '../contexts/MessageDisplayContext';
import { MessageEditingContext } from '../contexts/MessageEditingContext';
import { MessageSelectionContext, createMessageSelectionStore } from '../contexts/MessageSelectionContext';

const author = { _id: 'alice', username: 'alice', name: 'Alice' };

const message = createFakeMessage({
	_id: 'room-message',
	msg: 'Has anyone looked at the release notes yet?',
	ts: new Date('2024-03-10T15:20:00.000Z'),
	u: author,
});

const selectionStore = (selectedIds: string[]) => {
	const store = createMessageSelectionStore({ isSelecting: true });
	selectedIds.forEach((id) => store.toggle(id));
	return store;
};

const meta = {
	title: 'Components/Message/RoomMessage',
	component: RoomMessage,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				message: 'message',
				message_body: 'message body',
				Message_Ignored: 'Message ignored',
				Message_could_not_be_displayed: 'This message could not be displayed',
				E2E_message_encrypted_placeholder: 'This message is end-to-end encrypted and cannot be read yet',
				Message_viewed: 'Message viewed',
				Message_sent: 'Message sent',
			})
			.buildStoryDecorator(),
		(Story) => (
			<div role='list' aria-label='Messages' style={{ maxWidth: 640 }}>
				<Story />
			</div>
		),
	],
	parameters: { layout: 'padded' },
	args: { message, sequential: false, unread: false, mention: false, all: false },
} satisfies Meta<typeof RoomMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sequential: Story = {
	args: { sequential: true },
};

export const Pending: Story = {
	args: { message: { ...message, temp: true } },
};

export const BeingEdited: Story = {
	decorators: [
		(Story) => (
			<MessageEditingContext.Provider value={message._id}>
				<Story />
			</MessageEditingContext.Provider>
		),
	],
};

export const Highlighted: Story = {
	decorators: [
		(Story) => (
			<MessageRowStateContext.Provider value={{ isHighlighted: (id) => id === message._id }}>
				<Story />
			</MessageRowStateContext.Provider>
		),
	],
};

export const Selecting: Story = {
	decorators: [
		(Story) => (
			<MessageSelectionContext.Provider value={selectionStore([])}>
				<Story />
			</MessageSelectionContext.Provider>
		),
	],
};

export const Selected: Story = {
	decorators: [
		(Story) => (
			<MessageSelectionContext.Provider value={selectionStore([message._id])}>
				<Story />
			</MessageSelectionContext.Provider>
		),
	],
};

export const IgnoredAuthor: Story = {
	args: { ignoredUser: true },
};

export const IgnoredMessage: Story = {
	args: { message: { ...message, ignored: true } },
};

export const EncryptedPending: Story = {
	args: { message: { ...message, t: 'e2e', e2e: 'pending', msg: 'ciphertext' } },
};

export const Edited: Story = {
	args: {
		message: {
			...message,
			editedAt: new Date('2024-03-10T15:25:00.000Z'),
			editedBy: { _id: author._id, username: author.username },
		} as IMessage,
	},
};

export const PinnedAndPrivate: Story = {
	args: { message: { ...message, pinned: true, private: true } },
};

export const WithThreadUnreadMarkers: Story = {
	args: { unread: true, mention: true },
};

export const WithReadReceipt: Story = {
	decorators: [
		(Story) => (
			<MessageDisplayContext.Provider value={{ ...messageDisplayDefaultValue, readReceipts: { enabled: true, storeUsers: false } }}>
				<Story />
			</MessageDisplayContext.Provider>
		),
	],
};

export const WithoutAvatars: Story = {
	decorators: [
		(Story) => (
			<MessageDisplayContext.Provider value={{ ...messageDisplayDefaultValue, showAvatars: false }}>
				<Story />
			</MessageDisplayContext.Provider>
		),
	],
};
