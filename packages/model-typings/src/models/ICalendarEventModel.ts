import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICalendarEventModel extends IBaseModel<ICalendarEvent> {
	findByUserIdAndDate(uid: IUser['_id'], date: Date): FindCursor<ICalendarEvent>;
	updateEvent(eventId: ICalendarEvent['_id'], eventData: Partial<ICalendarEvent>): Promise<UpdateResult>;
	findNextNotificationDate(): Promise<Date | null>;
	findEventsToNotify(notificationTime: Date, minutes: number): FindCursor<ICalendarEvent>;
	flagNotificationSent(eventId: ICalendarEvent['_id']): Promise<UpdateResult>;
	findOneByExternalIdAndUserId(
		externalId: Required<ICalendarEvent>['externalId'],
		uid: ICalendarEvent['uid'],
	): Promise<ICalendarEvent | null>;
}
