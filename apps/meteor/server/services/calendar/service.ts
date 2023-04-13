import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent } from '@rocket.chat/models';
import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal, api } from '@rocket.chat/core-services';

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: InsertionModel<ICalendarEvent>): Promise<InsertOneResult<ICalendarEvent>> {
		return CalendarEvent.insertOne(data);
	}

	public async get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOne({ _id: eventId });
	}

	public async list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]> {
		return CalendarEvent.findByUserIdAndDate(uid, date).toArray();
	}

	public async update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult> {
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
}
