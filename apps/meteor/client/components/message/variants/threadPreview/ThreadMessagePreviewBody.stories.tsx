import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { StoryObj, Meta } from '@storybook/react';
import type { ComponentProps } from 'react';

import ThreadMessagePreviewBody from './ThreadMessagePreviewBody';

export default {
	component: ThreadMessagePreviewBody,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [mockAppRoot().withSetting('UI_Use_Real_Name', true).withJohnDoe().buildStoryDecorator()],
	args: {
		message: {
			_id: 'message-id',
			ts: new Date(),
			msg: 'This is a message',
			u: {
				_id: 'user-id',
				username: 'username',
			},
			rid: 'room-id',
			_updatedAt: new Date(),
		},
	},
} satisfies Meta<typeof ThreadMessagePreviewBody>;

export const Default: StoryObj<ComponentProps<typeof ThreadMessagePreviewBody>> = {};
