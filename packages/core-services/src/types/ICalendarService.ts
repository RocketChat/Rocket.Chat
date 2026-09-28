import type { ICalendarEvent, IUser } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';
import type { UpdateResult, DeleteResult } from 'mongodb';

export type CalendarBatchResult = {
	changed: boolean;
	upserted: number;
	modified: number;
	deleted: number;
	skipped: number;
};

/** Mirrors the `delete` gate. Without it a refresh may set or extend a claim but never end one. */
export type CalendarPresenceRefreshOptions = { removedEvents?: boolean };

/** `deferSideEffects` suppresses the workspace-global reschedulers and the presence refresh, so a caller running a batch can do them once at the end. */
export type CalendarBatchOptions = { deferSideEffects?: boolean };

export interface ICalendarService {
	create(data: Omit<InsertionModel<ICalendarEvent>, 'reminderTime' | 'notificationSent'>): Promise<ICalendarEvent['_id']>;
	import(data: Omit<InsertionModel<ICalendarEvent>, 'notificationSent'>): Promise<ICalendarEvent['_id']>;
	get(eventId: ICalendarEvent['_id']): Promise<ICalendarEvent | null>;
	list(uid: IUser['_id'], date: Date): Promise<ICalendarEvent[]>;
	update(eventId: ICalendarEvent['_id'], data: Partial<ICalendarEvent>): Promise<UpdateResult | null>;
	delete(eventId: ICalendarEvent['_id']): Promise<DeleteResult>;
	setupNextNotification(): Promise<void>;
	setupNextStatusChange(): Promise<void>;
	importMany(
		events: Omit<InsertionModel<ICalendarEvent>, 'notificationSent'>[],
		options?: CalendarBatchOptions,
	): Promise<CalendarBatchResult>;
	deleteImported(uid: IUser['_id'], externalIds: string[], notBefore: Date, options?: CalendarBatchOptions): Promise<CalendarBatchResult>;
	pruneImportedWindow(
		uid: IUser['_id'],
		timeWindow: { start: Date; end: Date },
		keepExternalIds: string[],
		options?: CalendarBatchOptions,
	): Promise<CalendarBatchResult>;
	refreshBusyPresence(uid: IUser['_id'], options?: CalendarPresenceRefreshOptions): Promise<void>;
}
