import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { CalendarEvent, Users } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';

export class StatusEventManager {
	public generateCronJobId(eventId: ICalendarEvent['_id'], uid: IUser['_id'], eventType: 'status' | 'reminder'): string {
		if (!eventId || !uid || !eventType || (eventType !== 'status' && eventType !== 'reminder')) {
			throw new Error('Missing required parameters. Please provide eventId, uid and eventType (status or reminder)');
		}

		if (eventType === 'status') {
			return `calendar-presence-status-${eventId}-${uid}`;
		}

		return `calendar-reminder-${eventId}-${uid}`;
	}

	public async removeCronJobs(eventId: ICalendarEvent['_id'], uid: IUser['_id']): Promise<void> {
		const statusChangeJobId = this.generateCronJobId(eventId, uid, 'status');
		const reminderJobId = this.generateCronJobId(eventId, uid, 'reminder');

		if (await cronJobs.has(statusChangeJobId)) {
			await cronJobs.remove(statusChangeJobId);
		}

		if (await cronJobs.has(reminderJobId)) {
			await cronJobs.remove(reminderJobId);
		}
	}

	public async handleOverlappingEvents(
		eventId: ICalendarEvent['_id'],
		uid: IUser['_id'],
		startTime: Date,
		endTime: Date,
		status?: UserStatus,
	): Promise<{ shouldProceed: boolean }> {
		const overlappingEvents = await CalendarEvent.find({
			_id: { $ne: eventId }, // Exclude current event
			uid,
			$or: [
				// Event starts during our event
				{ startTime: { $gte: startTime, $lt: endTime } },
				// Event ends during our event
				{ endTime: { $gt: startTime, $lte: endTime } },
				// Event completely contains our event
				{ startTime: { $lte: startTime }, endTime: { $gte: endTime } },
			],
		}).toArray();

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
			const cronJobId = this.generateCronJobId(eventId, uid, 'status');

			if (await cronJobs.has(cronJobId)) {
				await cronJobs.remove(cronJobId);
			}

			await cronJobs.addAtTimestamp(cronJobId, scheduledTime, async () =>
				this.applyStatusChange(eventId, uid, startTime, endTime, status, false),
			);
			return { shouldProceed: false };
		}

		// For any existing events that end before this one, remove their status removal jobs
		for await (const event of overlappingEvents) {
			if (event.endTime && event.endTime < endTime) {
				const eventCronJobId = this.generateCronJobId(event._id, uid, 'status');
				if (await cronJobs.has(eventCronJobId)) {
					await cronJobs.remove(eventCronJobId);
				}
			}
		}

		return { shouldProceed: true };
	}

	public async setupAppointmentStatusChange(
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
			const { shouldProceed } = await this.handleOverlappingEvents(eventId, uid, startTime, endTime, status);
			if (!shouldProceed) {
				return;
			}
		}

		const scheduledTime = shouldScheduleRemoval ? startTime : endTime;
		const cronJobId = this.generateCronJobId(eventId, uid, 'status');

		if (await cronJobs.has(cronJobId)) {
			await cronJobs.remove(cronJobId);
		}

		await cronJobs.addAtTimestamp(cronJobId, scheduledTime, async () =>
			this.applyStatusChange(eventId, uid, startTime, endTime, status, shouldScheduleRemoval),
		);
	}

	public async applyStatusChange(
		eventId: ICalendarEvent['_id'],
		uid: IUser['_id'],
		startTime: Date,
		endTime?: Date,
		status?: UserStatus,
		shouldScheduleRemoval?: boolean,
	): Promise<void> {
		const user = await Users.findOneById(uid, { projection: { roles: 1, username: 1, name: 1, status: 1 } });
		if (!user || user.status === UserStatus.OFFLINE) {
			return;
		}

		const newStatus = status ?? UserStatus.BUSY;
		const previousStatus = user.status;

		await Users.updateOne(
			{ _id: uid },
			{
				$set: {
					status: newStatus,
					statusDefault: newStatus,
				},
			},
		);

		await api.broadcast('presence.status', {
			user: {
				status: newStatus,
				_id: uid,
				roles: user.roles,
				username: user.username,
				name: user.name,
			},
			previousStatus,
		});

		if (shouldScheduleRemoval && endTime) {
			await this.setupAppointmentStatusChange(eventId, uid, startTime, endTime, previousStatus, false);
		}
	}

	public async cancelUpcomingStatusChanges(uid: IUser['_id'], endTime = new Date()): Promise<void> {
		const hasBusyStatusSetting = settings.get<boolean>('Calendar_BusyStatus_Enabled');
		if (!hasBusyStatusSetting) {
			return;
		}

		const events = await CalendarEvent.find({
			uid,
			startTime: { $exists: true, $lte: endTime },
			endTime: { $exists: true, $gte: endTime },
		}).toArray();

		for await (const event of events) {
			const statusChangeJobId = this.generateCronJobId(event._id, event.uid, 'status');
			if (await cronJobs.has(statusChangeJobId)) {
				await cronJobs.remove(statusChangeJobId);
			}
		}
	}

	public getShiftedTime(time: Date, minutes: number): Date {
		const newTime = new Date(time.valueOf());
		newTime.setMinutes(newTime.getMinutes() + minutes);
		return newTime;
	}
}

export const statusEventManager = new StatusEventManager();
