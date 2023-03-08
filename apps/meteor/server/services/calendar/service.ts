import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent } from '@rocket.chat/models';
import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: InsertionModel<ICalendarEvent>): Promise<void> {
		CalendarEvent.insertOne(data);
	}

	public async list(uid: IUser['_id'], _date: Date): Promise<{ data: ICalendarEvent[] }> {
		// #ToDo
		const data = await CalendarEvent.find({ uid }).toArray();

		return {
			data,
		};
	}

	public async update(_eventId: ICalendarEvent['_id'], _data: ICalendarEvent): Promise<void> {
		// #ToDo
	}
}
