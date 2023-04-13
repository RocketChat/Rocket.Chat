import type { FindCursor, IndexDescription, Collection, Db, UpdateResult } from 'mongodb';
import type { ICalendarEvent, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICalendarEventModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class CalendarEventRaw extends BaseRaw<ICalendarEvent> implements ICalendarEventModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICalendarEvent>>) {
		super(db, 'calendar_event', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { startTime: -1, uid: 1 }, unique: false }];
	}

	public findByUserIdAndDate(uid: IUser['_id'], date: Date): FindCursor<ICalendarEvent> {
		const startTime = new Date(date.toISOString());
		startTime.setHours(0, 0, 0, 0);

		const finalTime = new Date(date.valueOf());
		finalTime.setDate(finalTime.getDate() + 1);

		return this.find(
			{
				uid,
				startTime: { $gte: startTime, $lt: finalTime },
			},
			{
				sort: { startTime: 1 },
			},
		);
	}

	public async updateEvent(
		eventId: ICalendarEvent['_id'],
		{ subject, description, startTime }: Partial<ICalendarEvent>,
	): Promise<UpdateResult> {
		return this.updateOne(
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

	public async findNextNotificationDate(): Promise<Date | null> {
		const nextEvent = await this.findOne<Pick<ICalendarEvent, 'startTime'>>(
			{
				startTime: {
					$gt: new Date(),
				},
				$or: [{ notificationSent: false }, { notificationSent: { $exists: false } }],
			},
			{
				sort: {
					startTime: 1,
				},
				projection: {
					startTime: 1,
				},
			},
		);

		return nextEvent?.startTime || null;
	}

	public findEventsToNotify(notificationTime: Date, minutes: number): FindCursor<ICalendarEvent> {
		// Find all the events between now and +minutes that have not been notified yet
		const maxDate = new Date(notificationTime.toISOString());
		maxDate.setMinutes(maxDate.getMinutes() + minutes);

		return this.find(
			{
				startTime: {
					$gte: notificationTime,
					$lt: maxDate,
				},
				$or: [{ notificationSent: false }, { notificationSent: { $exists: false } }],
			},
			{
				sort: {
					startTime: 1,
				},
			},
		);
	}

	public async flagNotificationSent(eventId: ICalendarEvent['_id']): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: eventId,
			},
			{
				$set: {
					notificationSent: true,
				},
			},
		);
	}
}
