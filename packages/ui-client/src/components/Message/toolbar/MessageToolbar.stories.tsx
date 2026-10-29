import { createFakeMessage, createFakeRoom, createFakeSubscription, mockAppRoot } from '@rocket.chat/mock-providers';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

import MessageToolbar from './MessageToolbar';
import type { MessageActionConfig } from '../contexts/MessageAction';
import type { MessageToolbarContextValue } from '../contexts/MessageToolbarContext';
import { MessageToolbarContext, messageToolbarDefaultValue } from '../contexts/MessageToolbarContext';

const room = createFakeRoom({ _id: 'room', name: 'general', t: 'c' });

const subscription = createFakeSubscription({ rid: room._id });

const message = createFakeMessage({
	_id: 'toolbar-message',
	rid: room._id,
	msg: 'Has anyone looked at the release notes yet?',
	u: { _id: 'alice', username: 'alice', name: 'Alice' },
});

const noop = () => undefined;

const menuActions: MessageActionConfig[] = [
	{ id: 'delete-message', icon: 'trash', label: 'Delete', order: 10, group: 'menu', type: 'management', variant: 'danger', action: noop },
	{ id: 'edit-message', icon: 'edit', label: 'Edit', order: 1, group: 'menu', type: 'management', action: noop },
	{ id: 'pin-message', icon: 'pin', label: 'Pin', order: 2, group: 'menu', type: 'interaction', action: noop },
	{ id: 'star-message', icon: 'star', label: 'Star', order: 3, group: 'menu', type: 'interaction', action: noop },
	{ id: 'permalink', icon: 'permalink', label: 'Copy_link', order: 5, group: 'menu', type: 'duplication', action: noop },
	{ id: 'copy', icon: 'copy', label: 'Copy_text', order: 6, group: 'menu', type: 'duplication', action: noop },
	{
		id: 'app-translate',
		icon: 'language',
		label: 'Translate with app' as TranslationKey,
		order: 0,
		group: 'menu',
		type: 'apps',
		action: noop,
	},
];

const aiActions: MessageActionConfig[] = [
	{ id: 'app-summarize', icon: 'stars', label: 'Summarize' as TranslationKey, order: 0, group: 'menu', type: 'apps', action: noop },
];

const withToolbar =
	(value: Partial<MessageToolbarContextValue>): Decorator =>
	(Story) => (
		<MessageToolbarContext.Provider value={{ ...messageToolbarDefaultValue, useQuickReactions: () => ['+1', 'smile', 'tada'], ...value }}>
			<Story />
		</MessageToolbarContext.Provider>
	);

const meta = {
	title: 'Components/Message/MessageToolbar',
	component: MessageToolbar,
	decorators: [
		withToolbar({}),
		mockAppRoot()
			.withJohnDoe()
			.withSetting('Threads_enabled', true)
			.withTranslations('en', 'core', {
				Message_actions: 'Message actions',
				More: 'More',
				AI_Actions: 'AI actions',
				Add_Reaction: 'Add reaction',
				Quote: 'Quote',
				Reply_in_thread: 'Reply in thread',
				Forward_message: 'Forward message',
				Jump_to_message: 'Jump to message',
				Apps: 'Apps',
				Unavailable: 'Unavailable',
				Action_not_available_encrypted_content: '{{action}} not available on encrypted content',
				Delete: 'Delete',
				Edit: 'Edit',
				Pin: 'Pin',
				Star: 'Star',
				Copy_link: 'Copy link',
				Copy_text: 'Copy text',
			})
			.buildStoryDecorator(),
	],
	parameters: { layout: 'padded' },
	args: { message, room, subscription, onChangeMenuVisibility: noop },
} satisfies Meta<typeof MessageToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Message: Story = { args: { messageContext: 'message' } };

export const MessageMobile: Story = { args: { messageContext: 'message-mobile' } };

export const Threads: Story = { args: { messageContext: 'threads' } };

export const Videoconf: Story = { args: { messageContext: 'videoconf' } };

export const VideoconfThreads: Story = { args: { messageContext: 'videoconf-threads' } };

export const Pinned: Story = { args: { messageContext: 'pinned' } };

export const Direct: Story = { args: { messageContext: 'direct' } };

export const Starred: Story = { args: { messageContext: 'starred' } };

export const Mentions: Story = { args: { messageContext: 'mentions' } };

export const Federated: Story = { args: { messageContext: 'federated' } };

export const Search: Story = { args: { messageContext: 'search' } };

export const WithMenuActions: Story = {
	args: { messageContext: 'message' },
	decorators: [withToolbar({ useMenuActions: () => menuActions })],
};

export const WithAiActions: Story = {
	args: { messageContext: 'message' },
	decorators: [withToolbar({ useMenuActions: () => menuActions, useAiActions: () => aiActions })],
};

export const EncryptedMessage: Story = {
	args: { messageContext: 'message', message: { ...message, t: 'e2e', e2e: 'pending' } },
	decorators: [withToolbar({ useMenuActions: () => menuActions })],
};
