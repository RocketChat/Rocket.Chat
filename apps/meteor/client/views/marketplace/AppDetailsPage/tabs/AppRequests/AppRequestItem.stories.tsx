import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryObj } from '@storybook/react';

import AppRequestItem from './AppRequestItem';

export default {
	component: AppRequestItem,
	decorators: [mockAppRoot().withPermission('manage-apps').buildStoryDecorator()],
	args: {
		name: 'Ada Lovelace',
		username: 'ada.lovelace',
		createdDate: '2024-03-01T12:00:00.000Z',
		message: 'We need this app to sync our on-call schedule with the incident room.',
	},
} satisfies Meta<typeof AppRequestItem>;

type Story = StoryObj<typeof AppRequestItem>;

export const Seen: Story = {
	args: { seen: true },
};

export const Unseen: Story = {
	args: { seen: false },
};

export const LongMessage: Story = {
	args: {
		seen: false,
		message:
			'We need this app to sync our on-call schedule with the incident room, so the engineer on duty is added to the channel as soon as an alert fires and removed when their shift ends. It would also help to post the handover notes there.',
	},
};
