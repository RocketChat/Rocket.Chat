import type { IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import RoomMessage from './RoomMessage';
import SystemMessage from './SystemMessage';
import ThreadMessage from './ThreadMessage';
import ThreadMessagePreview from './ThreadMessagePreview';
import { MessageRelatedDataContext, messageRelatedDataDefaultValue } from '../contexts/MessageRelatedDataContext';

const alice = { _id: 'alice', username: 'alice', name: 'Alice' };
const bob = { _id: 'bob', username: 'bob', name: 'Bob' };

const main = createFakeMessage({ _id: 'thread-main', msg: 'Has anyone looked at the release notes yet?', u: alice });
const reply = createFakeMessage<IThreadMessage>({ _id: 'thread-reply', tmid: main._id, msg: 'I will take a look this afternoon.', u: bob });
const joined = createFakeMessage({ _id: 'joined', t: 'uj', msg: 'bob', u: bob });

const relatedData = { ...messageRelatedDataDefaultValue, useParentMessage: () => ({ data: main, isLoading: false, isError: false }) };

/** The four variants one under the other, as a conversation shows them. */
const Variants = () => (
	<div role='list' aria-label='Messages' style={{ maxWidth: 640 }}>
		<RoomMessage message={main} sequential={false} unread={false} mention={false} all={false} />
		<SystemMessage message={joined} />
		<ThreadMessage message={reply} sequential={false} unread={false} />
		<div role='listitem'>
			<ThreadMessagePreview message={reply} sequential={false} />
		</div>
	</div>
);

const meta = {
	title: 'Components/Message/Variants',
	component: Variants,
	decorators: [
		(Story) => (
			<MessageRelatedDataContext.Provider value={relatedData}>
				<Story />
			</MessageRelatedDataContext.Provider>
		),
		mockAppRoot()
			.withTranslations('en', 'core', {
				message: 'message',
				message_body: 'message body',
				system_message: 'system message',
				system_message_body: 'system message body',
				thread_message: 'thread message',
				thread_message_preview: 'thread message preview',
				User_joined_the_channel: 'joined the channel',
			})
			.buildStoryDecorator(),
	],
	parameters: { layout: 'padded' },
} satisfies Meta<typeof Variants>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Stacked: Story = {};
