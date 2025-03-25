import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal, api } from '@rocket.chat/core-services';
import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent } from '@rocket.chat/models';
import type { UpdateResult, DeleteResult } from 'mongodb';

import { cancelUpcomingStatusChanges } from './statusEvents/cancelUpcomingStatusChanges';
import { removeCronJobs } from './statusEvents/removeCronJobs';
import { setupAppointmentStatusChange } from './statusEvents/setupAppointmentStatusChange';
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
			await setupAppointmentStatusChange(insertResult.insertedId, uid, startTime, endTime, UserStatus.BUSY, true);
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
				await setupAppointmentStatusChange(insertResult.insertedId, uid, startTime, endTime, UserStatus.BUSY, true);
			}
			return insertResult.insertedId;
		}

		const updateResult = await CalendarEvent.updateEvent(event._id, updateData);
		if (updateResult.modifiedCount > 0) {
			await this.setupNextNotification();
			if (busy !== false) {
				await setupAppointmentStatusChange(event._id, uid, startTime, endTime, UserStatus.BUSY, true);
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
					const effectiveStartTime = startTime || event.startTime;
					const effectiveEndTime = endTime || event.endTime;

					// Only proceed if we have both valid start and end times
					if (effectiveStartTime && effectiveEndTime) {
						await setupAppointmentStatusChange(eventId, event.uid, effectiveStartTime, effectiveEndTime, UserStatus.BUSY, true);
					}
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

		return CalendarEvent.deleteOne({
			_id: eventId,
		});
	}

	public async setupNextNotification(): Promise<void> {
		return this.doSetupNextNotification(false);
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
