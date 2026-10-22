import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import ScheduledMessageRow from './ScheduledMessageRow';

export default {
	component: ScheduledMessageRow,
	args: {
		scheduledMessage: {
			_id: 's1',
			msg: 'Morning team! Please review the **release notes** before standup.',
			scheduledAt: '2026-10-23T12:00:00.000Z',
			status: 'pending',
			u: { _id: 'u1', username: 'alice', name: 'Alice Doe' },
		},
		onSendNow: action('onSendNow'),
		onDelete: action('onDelete'),
		onReschedule: action('onReschedule'),
		onEdit: action('onEdit'),
	},
	decorators: [(fn) => <Box maxWidth={400}>{fn()}</Box>],
} satisfies Meta<typeof ScheduledMessageRow>;

const Template: StoryFn<typeof ScheduledMessageRow> = (args) => <ScheduledMessageRow {...args} />;

export const Pending = Template.bind({});

export const WithFiles = Template.bind({});
WithFiles.args = {
	scheduledMessage: {
		_id: 's2',
		msg: 'Here are the mockups',
		scheduledAt: '2026-10-23T12:00:00.000Z',
		status: 'pending',
		files: [
			{ _id: 'f1', name: 'mockup.png', type: 'image/png' },
			{ _id: 'f2', name: 'release-notes.pdf', type: 'application/pdf' },
		],
		u: { _id: 'u1', username: 'alice', name: 'Alice Doe' },
	},
};

export const Failed = Template.bind({});
Failed.args = {
	scheduledMessage: {
		_id: 's3',
		msg: 'This one could not go out',
		scheduledAt: '2026-10-22T12:00:00.000Z',
		status: 'failed',
		error: 'room_is_archived',
		u: { _id: 'u1', username: 'alice', name: 'Alice Doe' },
	},
};
