import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import SystemMessage from './SystemMessage';
import { MessageSelectionContext, createMessageSelectionStore } from '../contexts/MessageSelectionContext';

const meta = {
	title: 'Components/Message/SystemMessage',
	component: SystemMessage,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				system_message: 'system message',
				system_message_body: 'system message body',
				User_joined_the_channel: 'joined the channel',
				changed_room_description_to__room_description_: 'changed room description to: {{room_description}}',
			})
			.buildStoryDecorator(),
		(Story) => (
			<div role='list' aria-label='Messages' style={{ maxWidth: 640 }}>
				<Story />
			</div>
		),
	],
	parameters: { layout: 'padded' },
	args: {
		message: createFakeMessage({
			_id: 'system-message',
			t: 'uj',
			msg: 'alice',
			ts: new Date('2024-03-10T15:20:00.000Z'),
			u: { _id: 'alice', username: 'alice', name: 'Alice' },
		}),
	},
} satisfies Meta<typeof SystemMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RoomDescriptionChanged: Story = {
	args: {
		message: createFakeMessage({
			_id: 'system-description',
			t: 'room_changed_description',
			msg: 'Release planning',
			u: { _id: 'bob', username: 'bob', name: 'Bob' },
		}),
	},
};

export const Selecting: Story = {
	decorators: [
		(Story) => (
			<MessageSelectionContext.Provider value={createMessageSelectionStore({ isSelecting: true })}>
				<Story />
			</MessageSelectionContext.Provider>
		),
	],
};
