import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';

import { generateCronJobId } from './generateCronJobId';

export async function removeCronJobs(eventId: ICalendarEvent['_id'], uid: IUser['_id']): Promise<void> {
	const statusChangeJobId = generateCronJobId(eventId, uid, 'status');
	const reminderJobId = generateCronJobId(eventId, uid, 'reminder');

	if (await cronJobs.has(statusChangeJobId)) {
		await cronJobs.remove(statusChangeJobId);
	}

	if (await cronJobs.has(reminderJobId)) {
		await cronJobs.remove(reminderJobId);
	}
}
