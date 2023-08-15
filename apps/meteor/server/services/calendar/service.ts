import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal, api } from '@rocket.chat/core-services';
import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent } from '@rocket.chat/models';
import type { UpdateResult, DeleteResult } from 'mongodb';

import { settings } from '../../../app/settings/server';
import { getUserPreference } from '../../../app/utils/server/lib/getUserPreference';

const logger = new Logger('Calendar');

const defaultMinutesForNotifications = 5;

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: Omit<InsertionModel<ICalendarEvent>, 'reminderTime' | 'notificationSent'>): Promise<ICalendarEvent['_id']> {
		const { uid, startTime, subject, description, reminderMinutesBeforeStart, meetingUrl } = data;

		const minutes = reminderMinutesBeforeStart ?? defaultMinutesForNotifications;
		const reminderTime = minutes ? this.getShiftedTime(startTime, -minutes) : undefined;

		const insertData: InsertionModel<ICalendarEvent> = {
			uid,
			startTime,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart: minutes,
			reminderTime,
			notificationSent: false,
		};

		const insertResult = await CalendarEvent.insertOne(insertData);
		await this.setupNextNotification();

		return insertResult.insertedId;
	}

	public async import(data: Omit<InsertionModel<ICalendarEvent>, 'notificationSent'>): Promise<ICalendarEvent['_id']> {
		const { externalId } = data;
		if (!externalId) {
			return this.create(data);
		}

		const { uid, startTime, subject, description, reminderMinutesBeforeStart } = data;
		const meetingUrl = data.meetingUrl ? data.meetingUrl : await this.parseDescriptionForMeetingUrl(description);
		const reminderTime = reminderMinutesBeforeStart ? this.getShiftedTime(startTime, -reminderMinutesBeforeStart) : undefined;

		const updateData: Omit<InsertionModel<ICalendarEvent>, 'uid' | 'notificationSent'> = {
			startTime,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderTime,
			externalId,
		};

		const event = await this.findImportedEvent(externalId, uid);

		if (!event) {
			const insertResult = await CalendarEvent.insertOne({
				uid,
				notificationSent: false,
				...updateData,
			});

			await this.setupNextNotification();
			return insertResult.insertedId;
		}

		const updateResult = await CalendarEvent.updateEvent(event._id, updateData);
		if (updateResult.modifiedCount > 0) {
			await this.setupNextNotification();
		}

		return event._id;
	}

	public async get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOne({ _id: eventId });
	}

	public async list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]> {
		return CalendarEvent.findByUserIdAndDate(uid, date).toArray();
	}

	public async update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult> {
		const { startTime, subject, description, reminderMinutesBeforeStart } = data;
		const meetingUrl = data.meetingUrl ? data.meetingUrl : await this.parseDescriptionForMeetingUrl(description || '');
		const reminderTime = reminderMinutesBeforeStart && startTime ? this.getShiftedTime(startTime, -reminderMinutesBeforeStart) : undefined;

		const updateData: Partial<ICalendarEvent> = {
			startTime,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderTime,
		};

		const updateResult = await CalendarEvent.updateEvent(eventId, updateData);

		if (updateResult.modifiedCount > 0) {
			await this.setupNextNotification();
		}

		return updateResult;
	}

	public async delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult> {
		return CalendarEvent.deleteOne({
			_id: eventId,
		});
	}

	public async setupNextNotification(): Promise<void> {
		return this.doSetupNextNotification(false);
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

	public async sendCurrentNotifications(date: Date): Promise<void> {
		const events = await CalendarEvent.findEventsToNotify(date, 1).toArray();

		for await (const event of events) {
			await this.sendEventNotification(event);

			await CalendarEvent.flagNotificationSent(event._id);
		}

		await this.doSetupNextNotification(true);
	}

	public async sendEventNotification(event: ICalendarEvent): Promise<void> {
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

	public async findImportedEvent(
		externalId: Required<ICalendarEvent>['externalId'],
		uid: ICalendarEvent['uid'],
	): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOneByExternalIdAndUserId(externalId, uid);
	}

	public async parseDescriptionForMeetingUrl(description: string): Promise<string | undefined> {
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

	private getShiftedTime(time: Date, minutes: number): Date {
		const newTime = new Date(time.valueOf());
		newTime.setMinutes(newTime.getMinutes() + minutes);
		return newTime;
	}
}
