import type { UpdateResult, DeleteResult } from 'mongodb';
import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent } from '@rocket.chat/models';
import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal, api } from '@rocket.chat/core-services';

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: InsertionModel<ICalendarEvent>): Promise<ICalendarEvent['_id']> {
		return (await CalendarEvent.insertOne(data)).insertedId;
	}

	public async import(data: InsertionModel<ICalendarEvent>): Promise<ICalendarEvent['_id']> {
		const { externalId, startTime, uid, subject, description, meetingUrl, reminderMinutesBeforeStart, reminderDueBy } = data;

		if (externalId) {
			const event = await this.findImportedEvent(externalId, uid);

			if (event) {
				await this.update(event._id, {
					startTime,
					subject,
					description,
					meetingUrl,
					reminderMinutesBeforeStart,
					reminderDueBy,
				});
				return event._id;
			}
		}

		if (!data.meetingUrl && data.description) {
			data.meetingUrl = await this.parseDescriptionForMeetingUrl(data.description);
		}
		console.log(data);

		return this.create(data);
	}

	public async get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOne({ _id: eventId });
	}

	public async list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]> {
		return CalendarEvent.findByUserIdAndDate(uid, date).toArray();
	}

	public async update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult> {
		if (!data.meetingUrl && data.description) {
			data.meetingUrl = await this.parseDescriptionForMeetingUrl(data.description);
		}

		return CalendarEvent.updateEvent(eventId, data);
	}

	public async delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult> {
		return CalendarEvent.deleteOne({
			_id: eventId,
		});
	}

	public async setupNextNotification(): Promise<void> {
		//
	}

	public async sendCurrentNotifications(): Promise<void> {
		const events = await CalendarEvent.findEventsToNotify(new Date(), 5).toArray();

		for await (const event of events) {
			await this.sendEventNotification(event);

			await CalendarEvent.flagNotificationSent(event._id);
		}
	}

	public async sendEventNotification(event: ICalendarEvent): Promise<void> {
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

		console.log('parsing ', description);

		const regex = /(?:[\?\&]callUrl=([^\n\&\<]+))|(?:(?:%3F)|(?:%26))callUrl(?:%3D)((?:(?:[^\n\&\<](?!%26)))+[^\n\&\<]?)/im;
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
				console.log('decoding ', encodedUrl);
				const decodedUrl = decodeURIComponent(url);
				if (decodedUrl === url) {
					break;
				}

				url = decodedUrl;
			}

			if (url.includes('://')) {
				console.log('found ', url);
				return url;
			}
			console.log('skipping this one');
		}

		return undefined;
	}
}
