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
	findOverlappingEvents(eventId: ICalendarEvent['_id'], uid: IUser['_id'], startTime: Date, endTime: Date): FindCursor<ICalendarEvent>;
	findEligibleEventsForCancelation(uid: IUser['_id'], endTime: Date): FindCursor<ICalendarEvent>;
	findEventsToScheduleNow(now: Date, endTime: Date): FindCursor<ICalendarEvent>;
	findNextFutureEvent(startTime: Date): Promise<ICalendarEvent | null>;
	findInProgressEvents(now: Date): FindCursor<ICalendarEvent>;
	findEventsStartingNow({ now, offset }: { now: Date; offset?: number }): FindCursor<ICalendarEvent>;
	findEventsEndingNow({ now, offset }: { now: Date; offset?: number }): FindCursor<ICalendarEvent>;
}
