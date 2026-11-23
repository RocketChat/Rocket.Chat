import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import ScheduledMessageRow from './ScheduledMessageRow';

const meta = {
	component: ScheduledMessageRow,
	args: {
		scheduledMessage: {
			_id: 's1',
			rid: 'r1',
			msg: 'Morning team! Please review the **release notes** before standup.',
			scheduledAt: '2026-10-23T12:00:00.000Z',
			status: 'pending',
		},
		onSendNow: action('onSendNow'),
		onDelete: action('onDelete'),
		onReschedule: action('onReschedule'),
		onEdit: action('onEdit'),
	},
	decorators: [(fn) => <Box maxWidth={400}>{fn()}</Box>],
} satisfies Meta<typeof ScheduledMessageRow>;

export default meta;

const Template: StoryFn<typeof ScheduledMessageRow> = (args) => <ScheduledMessageRow {...args} />;

export const Pending = Template.bind({});

export const WithFiles = Template.bind({});
WithFiles.args = {
	scheduledMessage: {
		...meta.args.scheduledMessage,
		msg: 'Here are the mockups',
		files: [
			{ _id: 'f1', name: 'mockup.png', type: 'image/png' },
			{ _id: 'f2', name: 'release-notes.pdf', type: 'application/pdf' },
		],
	},
};

export const Failed = Template.bind({});
Failed.args = {
	scheduledMessage: {
		...meta.args.scheduledMessage,
		msg: 'This one could not go out',
		status: 'failed',
		error: 'room_is_archived',
	},
};
