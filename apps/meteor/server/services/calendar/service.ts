import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal, api } from '@rocket.chat/core-services';
import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent, Users } from '@rocket.chat/models';
import type { UpdateResult, DeleteResult } from 'mongodb';

import { applyStatusChange } from './statusEvents/applyStatusChange';
import { cancelUpcomingStatusChanges } from './statusEvents/cancelUpcomingStatusChanges';
import { removeCronJobs } from './statusEvents/removeCronJobs';
import { getShiftedTime } from './utils/getShiftedTime';
import { settings } from '../../../app/settings/server';
import { getUserPreference } from '../../../app/utils/server/lib/getUserPreference';

const logger = new Logger('Calendar');

const defaultMinutesForNotifications = 5;

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: Omit<InsertionModel<ICalendarEvent>, 'reminderTime' | 'notificationSent'>): Promise<ICalendarEvent['_id']> {
		const { uid, startTime, endTime, subject, description, reminderMinutesBeforeStart, meetingUrl, busy } = data;
		const minutes = reminderMinutesBeforeStart ?? defaultMinutesForNotifications;
		const reminderTime = minutes ? getShiftedTime(startTime, -minutes) : undefined;

		const insertData: InsertionModel<ICalendarEvent> = {
			uid,
			startTime,
			...(endTime && { endTime }),
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart: minutes,
			reminderTime,
			notificationSent: false,
			...(busy !== undefined && { busy }),
		};

		const insertResult = await CalendarEvent.insertOne(insertData);
		await this.setupNextNotification();
		if (busy !== false) {
			await this.setupNextStatusChange();
		}

		return insertResult.insertedId;
	}

	public async import(data: Omit<InsertionModel<ICalendarEvent>, 'notificationSent'>): Promise<ICalendarEvent['_id']> {
		const { externalId } = data;
		if (!externalId) {
			return this.create(data);
		}

		const { uid, startTime, endTime, subject, description, reminderMinutesBeforeStart, busy } = data;
		const meetingUrl = data.meetingUrl ? data.meetingUrl : await this.parseDescriptionForMeetingUrl(description);
		const reminderTime = reminderMinutesBeforeStart ? getShiftedTime(startTime, -reminderMinutesBeforeStart) : undefined;

		const updateData: Omit<InsertionModel<ICalendarEvent>, 'uid' | 'notificationSent'> = {
			startTime,
			...(endTime && { endTime }),
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderTime,
			externalId,
			...(busy !== undefined && { busy }),
		};

		const event = await this.findImportedEvent(externalId, uid);

		if (!event) {
			const insertResult = await CalendarEvent.insertOne({
				uid,
				notificationSent: false,
				...updateData,
			});

			await this.setupNextNotification();
			if (busy !== false) {
				await this.setupNextStatusChange();
			}

			return insertResult.insertedId;
		}

		const updateResult = await CalendarEvent.updateEvent(event._id, updateData);
		if (updateResult.modifiedCount > 0) {
			await this.setupNextNotification();
			if (busy !== false) {
				await this.setupNextStatusChange();
			}
		}

		return event._id;
	}

	public async get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOne({ _id: eventId });
	}

	public async list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]> {
		return CalendarEvent.findByUserIdAndDate(uid, date).toArray();
	}

	public async update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult | null> {
		const event = await this.get(eventId);
		if (!event) {
			return null;
		}

		const { startTime, endTime, subject, description, reminderMinutesBeforeStart, busy } = data;

		const meetingUrl = await this.getMeetingUrl(data);
		const reminderTime = reminderMinutesBeforeStart && startTime ? getShiftedTime(startTime, -reminderMinutesBeforeStart) : undefined;

		const updateData: Partial<ICalendarEvent> = {
			startTime,
			...(endTime && { endTime }),
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderTime,
			...(busy !== undefined && { busy }),
		};

		const updateResult = await CalendarEvent.updateEvent(eventId, updateData);

		if (updateResult.modifiedCount > 0) {
			await this.setupNextNotification();

			if (startTime || endTime) {
				await removeCronJobs(eventId, event.uid);
				const isBusy = busy !== undefined ? busy : event.busy !== false;
				if (isBusy) {
					await this.setupNextStatusChange();
				}
			}
		}

		return updateResult;
	}

	public async delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult> {
		const event = await this.get(eventId);
		if (event) {
			await removeCronJobs(eventId, event.uid);
		}

		const result = await CalendarEvent.deleteOne({
			_id: eventId,
		});

		if (result.deletedCount > 0) {
			await this.setupNextStatusChange();
		}

		return result;
	}

	public async setupNextNotification(): Promise<void> {
		return this.doSetupNextNotification(false);
	}

	public async setupNextStatusChange(): Promise<void> {
		return this.doSetupNextStatusChange();
	}

	public async cancelUpcomingStatusChanges(uid: IUser['_id'], endTime = new Date()): Promise<void> {
		return cancelUpcomingStatusChanges(uid, endTime);
	}

	private async getMeetingUrl(eventData: Partial<ICalendarEvent>): Promise<string | undefined> {
		if (eventData.meetingUrl !== undefined) {
			return eventData.meetingUrl;
		}

		if (eventData.description !== undefined) {
			return this.parseDescriptionForMeetingUrl(eventData.description);
		}

		return undefined;
	}

	private async doSetupNextNotification(isRecursive: boolean): Promise<void> {
		const date = await CalendarEvent.findNextNotificationDate();
		if (!date) {
			if (await cronJobs.has('calendar-reminders')) {
				await cronJobs.remove('calendar-reminders');
			}
			return;
		}

		date.setSeconds(0);
		if (!isRecursive && date.valueOf() < Date.now()) {
			return this.sendCurrentNotifications(date);
		}

		await cronJobs.addAtTimestamp('calendar-reminders', date, async () => this.sendCurrentNotifications(date));
	}

	private async doSetupNextStatusChange(): Promise<void> {
		// This method is called in the following moments:
		// 1. When a new busy event is created or imported
		// 2. When a busy event is updated (time/busy status changes)
		// 3. When a busy event is deleted
		// 4. When a status change job executes and completes
		// 5. When an event ends and the status is restored
		// 6. From Outlook Calendar integration (ee/server/configuration/outlookCalendar.ts)

		const busyStatusEnabled = settings.get<boolean>('Calendar_BusyStatus_Enabled');
		if (!busyStatusEnabled) {
			const schedulerJobId = 'calendar-status-scheduler';
			if (await cronJobs.has(schedulerJobId)) {
				await cronJobs.remove(schedulerJobId);
			}
			return;
		}

		const schedulerJobId = 'calendar-status-scheduler';
		if (await cronJobs.has(schedulerJobId)) {
			await cronJobs.remove(schedulerJobId);
		}

		const now = new Date();
		const nextStartEvent = await CalendarEvent.findNextFutureEvent(now);
		const inProgressEvents = await CalendarEvent.findInProgressEvents(now).toArray();
		const eventsWithEndTime = inProgressEvents.filter((event) => event.endTime && event.busy !== false);
		if (eventsWithEndTime.length === 0 && !nextStartEvent) {
			return;
		}

		let nextEndTime: Date | null = null;
		if (eventsWithEndTime.length > 0 && eventsWithEndTime[0].endTime) {
			nextEndTime = eventsWithEndTime.reduce((earliest, event) => {
				if (!event.endTime) return earliest;
				return event.endTime.getTime() < earliest.getTime() ? event.endTime : earliest;
			}, eventsWithEndTime[0].endTime);
		}

		let nextProcessTime: Date;
		if (nextStartEvent && nextEndTime) {
			nextProcessTime = nextStartEvent.startTime.getTime() < nextEndTime.getTime() ? nextStartEvent.startTime : nextEndTime;
		} else if (nextStartEvent) {
			nextProcessTime = nextStartEvent.startTime;
		} else if (nextEndTime) {
			nextProcessTime = nextEndTime;
		} else {
			// This should never happen due to the earlier check, but just in case
			return;
		}

		await cronJobs.addAtTimestamp(schedulerJobId, nextProcessTime, async () => this.processStatusChangesAtTime());
	}

	private async processStatusChangesAtTime(): Promise<void> {
		const processTime = new Date();

		const eventsStartingNow = await CalendarEvent.findEventsStartingNow({ now: processTime, offset: 5000 }).toArray();
		for await (const event of eventsStartingNow) {
			if (event.busy === false) {
				continue;
			}
			await this.processEventStart(event);
		}

		const eventsEndingNow = await CalendarEvent.findEventsEndingNow({ now: processTime, offset: 5000 }).toArray();
		for await (const event of eventsEndingNow) {
			if (event.busy === false) {
				continue;
			}
			await this.processEventEnd(event);
		}

		await this.doSetupNextStatusChange();
	}

	private async processEventStart(event: ICalendarEvent): Promise<void> {
		if (!event.endTime) {
			return;
		}

		const user = await Users.findOneById(event.uid, { projection: { status: 1 } });
		if (!user || user.status === UserStatus.OFFLINE) {
			return;
		}

		if (user.status) {
			await CalendarEvent.updateEvent(event._id, { previousStatus: user.status });
		}

		await applyStatusChange({
			eventId: event._id,
			uid: event.uid,
			startTime: event.startTime,
			endTime: event.endTime,
			status: UserStatus.BUSY,
		});
	}

	private async processEventEnd(event: ICalendarEvent): Promise<void> {
		if (!event.endTime) {
			return;
		}

		const user = await Users.findOneById(event.uid, { projection: { status: 1 } });
		if (!user) {
			return;
		}

		// Only restore status if:
		// 1. The current status is BUSY (meaning it was set by our system, not manually changed by user)
		// 2. We have a previousStatus stored from before the event started

		if (user.status === UserStatus.BUSY && event.previousStatus && event.previousStatus !== user.status) {
			await applyStatusChange({
				eventId: event._id,
				uid: event.uid,
				startTime: event.startTime,
				endTime: event.endTime,
				status: event.previousStatus,
			});
		} else {
			logger.debug(`Not restoring status for user ${event.uid}: current=${user.status}, stored=${event.previousStatus}`);
		}
	}

	private async sendCurrentNotifications(date: Date): Promise<void> {
		const events = await CalendarEvent.findEventsToNotify(date, 1).toArray();
		for await (const event of events) {
			await this.sendEventNotification(event);
			await CalendarEvent.flagNotificationSent(event._id);
		}

		await this.doSetupNextNotification(true);
	}

	private async sendEventNotification(event: ICalendarEvent): Promise<void> {
		if (!(await getUserPreference(event.uid, 'notifyCalendarEvents'))) {
			return;
		}

		return api.broadcast('notify.calendar', event.uid, {
			title: event.subject,
			text: event.startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', dayPeriod: 'narrow' }),
			payload: {
				_id: event._id,
			},
		});
	}

	private async findImportedEvent(
		externalId: Required<ICalendarEvent>['externalId'],
		uid: ICalendarEvent['uid'],
	): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOneByExternalIdAndUserId(externalId, uid);
	}

	private async parseDescriptionForMeetingUrl(description: string): Promise<string | undefined> {
		if (!description) {
			return;
		}

		const defaultPattern = '(?:[?&]callUrl=([^\n&<]+))|(?:(?:%3F)|(?:%26))callUrl(?:%3D)((?:(?:[^\n&<](?!%26)))+[^\n&<]?)';
		const pattern = (settings.get<string>('Calendar_MeetingUrl_Regex') || defaultPattern).trim();

		if (!pattern) {
			return;
		}

		const regex: RegExp | undefined = (() => {
			try {
				return new RegExp(pattern, 'im');
			} catch {
				logger.error('Failed to parse regular expression for meeting url.');
			}
		})();

		if (!regex) {
			return;
		}

		const results = description.match(regex);
		if (!results) {
			return;
		}

		const [, ...urls] = results;
		for (const encodedUrl of urls) {
			if (!encodedUrl) {
				continue;
			}

			let url = encodedUrl;
			while (!url.includes('://')) {
				const decodedUrl = decodeURIComponent(url);
				if (decodedUrl === url) {
					break;
				}

				url = decodedUrl;
			}

			if (url.includes('://')) {
				return url;
			}
		}

		return undefined;
	}
}
