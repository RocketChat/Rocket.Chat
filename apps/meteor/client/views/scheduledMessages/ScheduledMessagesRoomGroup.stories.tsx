import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import ScheduledMessagesRoomGroup from './ScheduledMessagesRoomGroup';

const u = { _id: 'u1', username: 'alice', name: 'Alice Doe' };

export default {
	component: ScheduledMessagesRoomGroup,
	args: {
		rid: 'r1',
		scheduledMessages: [
			{
				_id: 's1',
				rid: 'r1',
				roomName: 'release-team',
				roomType: 'c',
				msg: 'Morning team! Please review the **release notes** before standup.',
				scheduledAt: '2026-10-23T12:00:00.000Z',
				status: 'pending',
				u,
				_updatedAt: '2026-10-22T12:00:00.000Z',
			},
			{
				_id: 's2',
				rid: 'r1',
				roomName: 'release-team',
				roomType: 'c',
				msg: 'Here are the mockups',
				files: [
					{ _id: 'f1', name: 'mockup.png', type: 'image/png' },
					{ _id: 'f2', name: 'release-notes.pdf', type: 'application/pdf' },
				],
				scheduledAt: '2026-10-24T12:00:00.000Z',
				status: 'pending',
				u,
				_updatedAt: '2026-10-22T12:00:00.000Z',
			},
			{
				_id: 's3',
				rid: 'r1',
				roomName: 'release-team',
				roomType: 'c',
				msg: 'This one could not go out',
				scheduledAt: '2026-10-22T12:00:00.000Z',
				status: 'failed',
				error: 'room_is_archived',
				u,
				_updatedAt: '2026-10-22T12:00:00.000Z',
			},
		],
		actions: {
			sendNow: action('sendNow'),
			confirmDelete: action('confirmDelete'),
			reschedule: action('reschedule'),
			isPending: false,
		},
	},
	decorators: [(fn) => <Box padding='x24'>{fn()}</Box>],
} satisfies Meta<typeof ScheduledMessagesRoomGroup>;

export const Default: StoryFn<typeof ScheduledMessagesRoomGroup> = (args) => <ScheduledMessagesRoomGroup {...args} />;
