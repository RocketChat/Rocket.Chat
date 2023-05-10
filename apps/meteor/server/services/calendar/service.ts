import type { UpdateResult, DeleteResult } from 'mongodb';
import type { IUser, ICalendarEvent, AtLeast } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent } from '@rocket.chat/models';
import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal, api } from '@rocket.chat/core-services';

import { settings } from '../../../app/settings/server';

const defaultMinutesForNotifications = 5;

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: Omit<InsertionModel<ICalendarEvent>, 'reminderDueBy'>): Promise<ICalendarEvent['_id']> {
		const { uid, startTime, subject, description, reminderMinutesBeforeStart, meetingUrl } = data;

		const minutes = reminderMinutesBeforeStart ?? defaultMinutesForNotifications;
		const reminderDueBy = minutes ? this.getShiftedTime(startTime, -minutes) : undefined;

		const insertData: InsertionModel<ICalendarEvent> = {
			uid,
			startTime,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart: minutes,
			reminderDueBy,
		};

		return (await CalendarEvent.insertOne(insertData)).insertedId;
	}

	public async import(data: InsertionModel<ICalendarEvent>): Promise<ICalendarEvent['_id']> {
		const { externalId } = data;
		if (!externalId) {
			return this.create(data);
		}

		const { uid, startTime, subject, description, reminderMinutesBeforeStart, reminderDueBy } = data;
		const meetingUrl = data.meetingUrl ? data.meetingUrl : await this.parseDescriptionForMeetingUrl(description);

		const updateData: Omit<InsertionModel<ICalendarEvent>, 'uid'> = {
			startTime,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderDueBy,
			externalId,
		};

		const event = await this.findImportedEvent(externalId, uid);

		if (!event) {
			return (
				await CalendarEvent.insertOne({
					uid,
					...updateData,
				})
			).insertedId;
		}

		await CalendarEvent.updateEvent(event._id, updateData);

		return event._id;
	}

	public async get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOne({ _id: eventId });
	}

	public async list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]> {
		return CalendarEvent.findByUserIdAndDate(uid, date).toArray();
	}

	public async update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult> {
		const { startTime, subject, description, reminderMinutesBeforeStart, reminderDueBy } = data;
		const meetingUrl = data.meetingUrl ? data.meetingUrl : await this.parseDescriptionForMeetingUrl(description || '');

		const updateData: Partial<ICalendarEvent> = {
			startTime,
			subject,
			description,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderDueBy,
		};

		return CalendarEvent.updateEvent(eventId, updateData);
	}

	public async delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult> {
		return CalendarEvent.deleteOne({
			_id: eventId,
		});
	}

	public async sendTestNotification(): Promise<void> {
		console.log('sendTestNotification');
		return this.sendCurrentNotifications();
	}

	public async setupNextNotification(): Promise<void> {
		//
	}

	public async sendCurrentNotifications(): Promise<void> {
		const events = await CalendarEvent.findEventsToNotify(new Date(), 1440).toArray();

		// eslint-disable-next-line no-unreachable-loop
		for await (const event of events) {
			await this.sendEventNotification(event);

			break;
			// await CalendarEvent.flagNotificationSent(event._id);
		}
	}

	public async sendEventNotification(event: AtLeast<ICalendarEvent, 'uid' | 'subject' | '_id'>): Promise<void> {
		return api.broadcast('notify.calendar', event.uid, {
			title: 'New Event',
			text: event.subject,
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
		const pattern = settings.get<string>('Outlook_Calendar_MeetingUrl_Regex') || defaultPattern;

		const regex = new RegExp(pattern, 'im');
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
