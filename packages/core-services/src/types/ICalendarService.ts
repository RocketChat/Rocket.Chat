import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

export interface ICalendarService {
	create(data: InsertionModel<ICalendarEvent>): Promise<void>;
	list(uid: IUser['_id'], date: Date): Promise<{ data: ICalendarEvent[] }>;
	update(eventId: ICalendarEvent['_id'], data: ICalendarEvent): Promise<void>;
}
