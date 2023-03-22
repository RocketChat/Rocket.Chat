import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

export interface ICalendarService {
	create(data: InsertionModel<ICalendarEvent>): Promise<InsertOneResult<ICalendarEvent>>;
	get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null>;
	list(uid: IUser['_id'], date: Date): Promise<{ data: ICalendarEvent[] }>;
	update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult>;
	delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult>;
}
