import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ScheduledMessagesIndicator from './ScheduledMessagesIndicator';

const appRoot = (items: { rid: string; status: 'pending' | 'failed' }[]) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('Message_Scheduling_Enabled', true)
		.withPermission('schedule-message')
		.withTranslations('en', 'core', {
			Scheduled_messages_in_room_one: '{{count}} scheduled message in this room',
			Scheduled_messages_in_room_other: '{{count}} scheduled messages in this room',
			Scheduled_messages_failed_one: '{{count}} scheduled message failed',
			Scheduled_messages_failed_other: '{{count}} scheduled messages failed',
		})
		.withEndpoint('GET', '/v1/scheduledMessages.list', () => ({
			scheduledMessages: items.map((item, i) => ({ _id: `s${i}`, msg: 'm', scheduledAt: '2026-10-22T12:00:00.000Z', ...item })) as never,
			total: items.length,
			offset: 0,
			count: items.length,
		}))
		.build();

describe('ScheduledMessagesIndicator', () => {
	it('marks a room that holds scheduled messages', async () => {
		render(<ScheduledMessagesIndicator rid='r1' />, {
			wrapper: appRoot([
				{ rid: 'r1', status: 'pending' },
				{ rid: 'r2', status: 'pending' },
			]),
		});

		expect(await screen.findByTitle('1 scheduled message in this room')).toBeInTheDocument();
	});

	it('warns when a scheduled message of the room failed', async () => {
		render(<ScheduledMessagesIndicator rid='r1' />, { wrapper: appRoot([{ rid: 'r1', status: 'failed' }]) });

		expect(await screen.findByTitle('1 scheduled message failed')).toBeInTheDocument();
	});
});
