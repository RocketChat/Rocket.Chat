import type { IMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import ThreadMessagePreview from './ThreadMessagePreview';
import { MessageRelatedDataContext, messageRelatedDataDefaultValue } from '../contexts/MessageRelatedDataContext';

const parent = createFakeMessage({
	_id: 'thread-main',
	msg: 'Has anyone looked at the release notes yet?',
	u: { _id: 'alice', username: 'alice', name: 'Alice' },
});

const withParent = (message: IMessage | undefined, isLoading = false) => ({
	...messageRelatedDataDefaultValue,
	useParentMessage: () => ({ data: message, isLoading, isError: false }),
});

const meta = {
	title: 'Components/Message/ThreadMessagePreview',
	component: ThreadMessagePreview,
	decorators: [
		(Story) => (
			<MessageRelatedDataContext.Provider value={withParent(parent)}>
				<Story />
			</MessageRelatedDataContext.Provider>
		),
		mockAppRoot().withTranslations('en', 'core', { thread_message_preview: 'thread message preview' }).buildStoryDecorator(),
		(Story) => (
			<div style={{ maxWidth: 640 }}>
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
			u: { _id: 'bob', username: 'bob', name: 'Bob' },
		}),
		sequential: false,
	},
} satisfies Meta<typeof ThreadMessagePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sequential: Story = {
	args: { sequential: true },
};

export const LoadingThread: Story = {
	decorators: [
		(Story) => (
			<MessageRelatedDataContext.Provider value={withParent(undefined, true)}>
				<Story />
			</MessageRelatedDataContext.Provider>
		),
	],
};
