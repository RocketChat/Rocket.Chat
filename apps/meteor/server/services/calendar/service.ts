import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { IUser, ICalendarEvent } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { CalendarEvent } from '@rocket.chat/models';
import type { ICalendarService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

export class CalendarService extends ServiceClassInternal implements ICalendarService {
	protected name = 'calendar';

	public async create(data: InsertionModel<ICalendarEvent>): Promise<InsertOneResult<ICalendarEvent>> {
		return CalendarEvent.insertOne(data);
	}

	public async get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null> {
		return CalendarEvent.findOne({ _id: eventId });
	}

	public async list(uid: IUser['_id'], _date: Date): Promise<{ data: ICalendarEvent[] }> {
		// #ToDo
		const data = await CalendarEvent.find({ uid }).toArray();

		return {
			data,
		};
	}

	public async update(eventId: ICalendarEvent['_id'], { subject, description, startTime }: Partial<ICalendarEvent>): Promise<UpdateResult> {
		return CalendarEvent.updateOne(
			{ _id: eventId },
			{
				$set: {
					...(subject !== undefined ? { subject } : {}),
					...(description !== undefined ? { description } : {}),
					...(startTime ? { startTime } : {}),
				},
			},
		);
	}

	public async delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult> {
		return CalendarEvent.deleteOne({
			_id: eventId,
		});
	}
}
