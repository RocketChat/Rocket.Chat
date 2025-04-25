import type { UserStatus, IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { CalendarEvent } from '@rocket.chat/models';

import { applyStatusChange } from './applyStatusChange';
import { generateCronJobId } from './generateCronJobId';

export async function handleOverlappingEvents(
	eventId: ICalendarEvent['_id'],
	uid: IUser['_id'],
	startTime: Date,
	endTime: Date,
	status?: UserStatus,
): Promise<{ shouldProceed: boolean }> {
	const overlappingEvents = await CalendarEvent.findOverlappingEvents(eventId, uid, startTime, endTime).toArray();

	if (overlappingEvents.length === 0) {
		return { shouldProceed: true };
	}

	const allEvents = [...overlappingEvents, { endTime, startTime }];

	const latestEndingEvent = allEvents.reduce<{ endTime: Date | null; startTime: Date | null }>(
		(latest, event) => {
			if (!event.endTime) return latest;
			if (!latest.endTime || event.endTime > latest.endTime) {
				return { endTime: event.endTime, startTime: event.startTime };
			}
			return latest;
		},
		{ endTime: null, startTime: null },
	);

	// If this event doesn't have the latest end time, don't schedule removal
	// because another event will handle it
	if (latestEndingEvent.endTime && latestEndingEvent.endTime.getTime() !== endTime.getTime()) {
		const scheduledTime = startTime;
		const cronJobId = generateCronJobId(eventId, uid, 'status');

		if (await cronJobs.has(cronJobId)) {
			await cronJobs.remove(cronJobId);
		}

		await cronJobs.addAtTimestamp(cronJobId, scheduledTime, async () =>
			applyStatusChange({ eventId, uid, startTime, endTime, status, shouldScheduleRemoval: false }),
		);
		return { shouldProceed: false };
	}

	// For any existing events that end before this one, remove their status removal jobs
	for await (const event of overlappingEvents) {
		if (event.endTime && event.endTime < endTime) {
			const eventCronJobId = generateCronJobId(event._id, uid, 'status');
			if (await cronJobs.has(eventCronJobId)) {
				await cronJobs.remove(eventCronJobId);
			}
		}
	}

	return { shouldProceed: true };
}
