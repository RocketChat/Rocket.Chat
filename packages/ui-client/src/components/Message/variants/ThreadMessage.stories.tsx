import type { IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import ThreadMessage from './ThreadMessage';

const meta = {
	title: 'Components/Message/ThreadMessage',
	component: ThreadMessage,
	decorators: [
		mockAppRoot()
			.withTranslations('en', 'core', {
				thread_message: 'thread message',
				message_body: 'message body',
				Message_Ignored: 'Message ignored',
			})
			.buildStoryDecorator(),
		(Story) => (
			<div role='list' aria-label='Thread messages' style={{ maxWidth: 400 }}>
				<Story />
			</div>
		),
	],
	parameters: { layout: 'padded' },
	args: {
		message: createFakeMessage<IThreadMessage>({
			_id: 'thread-reply',
			tmid: 'thread-main',
			msg: 'I will take a look this afternoon.',
			ts: new Date('2024-03-10T15:20:00.000Z'),
			u: { _id: 'bob', username: 'bob', name: 'Bob' },
		}),
		sequential: false,
		unread: false,
	},
} satisfies Meta<typeof ThreadMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sequential: Story = {
	args: { sequential: true },
};

export const IgnoredAuthor: Story = {
	args: { ignoredUser: true },
};
