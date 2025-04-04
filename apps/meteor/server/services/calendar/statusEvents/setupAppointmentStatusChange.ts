import type { ICalendarEvent, IUser, UserStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';

import { applyStatusChange } from './applyStatusChange';
import { generateCronJobId } from './generateCronJobId';
import { handleOverlappingEvents } from './handleOverlappingEvents';
import { settings } from '../../../../app/settings/server';

export async function setupAppointmentStatusChange(
	eventId: ICalendarEvent['_id'],
	uid: IUser['_id'],
	startTime: Date,
	endTime?: Date,
	status?: UserStatus,
	shouldScheduleRemoval?: boolean,
): Promise<void> {
	const hasBusyStatusSetting = settings.get<boolean>('Calendar_BusyStatus_Enabled');
	if (!endTime || !hasBusyStatusSetting) {
		return;
	}

	if (shouldScheduleRemoval) {
		const { shouldProceed } = await handleOverlappingEvents(eventId, uid, startTime, endTime, status);
		if (!shouldProceed) {
			return;
		}
	}

	const scheduledTime = shouldScheduleRemoval ? startTime : endTime;
	const cronJobId = generateCronJobId(eventId, uid, 'status');

	if (await cronJobs.has(cronJobId)) {
		await cronJobs.remove(cronJobId);
	}

	await cronJobs.addAtTimestamp(cronJobId, scheduledTime, async () => {
		await applyStatusChange({ eventId, uid, startTime, endTime, status, shouldScheduleRemoval });

		if (!shouldScheduleRemoval) {
			if (await cronJobs.has('calendar-next-status-change')) {
				await cronJobs.remove('calendar-next-status-change');
			}
		}
	});
}
