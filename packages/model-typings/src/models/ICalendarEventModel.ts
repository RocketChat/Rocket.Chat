import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export type ImportedCalendarEvent = Omit<InsertionModel<ICalendarEvent>, 'notificationSent' | 'externalId'> & { externalId: string };

export type CalendarBulkUpsertResult = { matchedCount: number; modifiedCount: number; upsertedCount: number };

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
	findNextFutureEvent(startTime: Date): Promise<Pick<ICalendarEvent, '_id' | 'startTime'> | null>;
	findEventsStartingNow({
		now,
		offset,
	}: {
		now: Date;
		offset?: number;
	}): FindCursor<Pick<ICalendarEvent, '_id' | 'uid' | 'startTime' | 'endTime'>>;
	bulkUpsertImported(events: ImportedCalendarEvent[]): Promise<CalendarBulkUpsertResult>;
	reopenNotifications(uid: IUser['_id'], externalIds: string[]): Promise<UpdateResult>;
	deleteUnfinishedByExternalIdsAndUserId(uid: IUser['_id'], externalIds: string[], now: Date): Promise<DeleteResult>;
	deleteImportedOutsideSet(uid: IUser['_id'], start: Date, end: Date, keepExternalIds: string[]): Promise<DeleteResult>;
}
