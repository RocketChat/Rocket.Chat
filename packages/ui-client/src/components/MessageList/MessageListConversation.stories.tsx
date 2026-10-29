import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import ConversationPlayground from './stories/conversation/ConversationPlayground';
import { getViewport, waitForListSettled } from './stories/playHelpers';

const meta = {
	title: 'Components/MessageList/Conversation',
	component: ConversationPlayground,
	decorators: [
		mockAppRoot()
			.withSetting('Message_GroupingPeriod', 300)
			.withTranslations('en', 'core', {
				message: 'message',
				message_body: 'message body',
				system_message: 'system message',
				thread_message: 'thread message',
				thread_message_preview: 'thread message preview',
				Message_Ignored: 'Message ignored',
				User_joined_the_channel: 'joined the channel',
				Unread_Messages: 'Unread messages',
				New_messages: 'New messages',
				Jump_to_recent_messages: 'Jump to recent messages',
			})
			.buildStoryDecorator(),
	],
	parameters: { layout: 'padded' },
	args: { layout: 'room' },
} satisfies Meta<typeof ConversationPlayground>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A room: system messages, thread previews, reactions, files, edits, an ignored author, all from the real variants. */
export const Room: Story = {
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		const list = within(getViewport(canvasElement));
		await expect(list.getAllByRole('listitem').length).toBeGreaterThan(5);
	},
};

/** A thread: the main message first, then the replies grouped by author. */
export const Thread: Story = {
	args: { layout: 'thread' },
};

/** B18: selection mode puts a checkbox on every message. */
export const SelectionMode: Story = {
	args: { isSelecting: true },
	play: async ({ canvasElement }) => {
		await waitForListSettled(canvasElement);
		await expect(within(getViewport(canvasElement)).getAllByRole('checkbox').length).toBeGreaterThan(0);
	},
};

export const HiddenAvatars: Story = {
	args: { display: { showAvatars: false } },
};

/** Read-only places, such as audits, show messages without toolbars or thread metrics. */
export const ReadOnly: Story = {
	args: { display: { allowsInteraction: false } },
};

export const WithReadReceipts: Story = {
	args: { display: { readReceipts: { enabled: true, storeUsers: false } } },
};
