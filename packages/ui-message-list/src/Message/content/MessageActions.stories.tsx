import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import MessageActions from './MessageActions';

const message = createFakeMessage({ _id: 'message-with-action-links' });

const meta = {
	title: 'Components/Message/Content/MessageActions',
	component: MessageActions,
	decorators: [mockAppRoot().withTranslations('en', 'core', { Join_call: 'Join call' }).buildStoryDecorator()],
	parameters: { layout: 'padded' },
	args: {
		message,
		actions: [
			{ icon: 'video', i18nLabel: 'Join_call', methodId: 'joinJitsiCall' },
			{ icon: 'phone', label: 'Call back', methodId: 'callBack' },
		],
	},
} satisfies Meta<typeof MessageActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Centered: Story = {};

export const AlignedToStart: Story = {
	args: {
		actions: [{ icon: 'video', label: 'Join call', methodId: 'joinJitsiCall', actionLinksAlignment: 'flex-start' }],
	},
};
