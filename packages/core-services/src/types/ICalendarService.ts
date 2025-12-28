import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import type { UpdateResult, DeleteResult } from 'mongodb';

export interface ICalendarService {
	create(data: Omit<InsertionModel<ICalendarEvent>, 'reminderTime' | 'notificationSent'>): Promise<ICalendarEvent['_id']>;
	import(data: Omit<InsertionModel<ICalendarEvent>, 'notificationSent'>): Promise<ICalendarEvent['_id']>;
	get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null>;
	list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]>;
	update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult | null>;
	delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult>;
	setupNextNotification(): Promise<void>;
	setupNextStatusChange(): Promise<void>;
	cancelUpcomingStatusChanges(uid: IUser['_id'], endTime?: Date): Promise<void>;
}
