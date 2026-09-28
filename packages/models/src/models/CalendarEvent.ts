import type { ICalendarEvent, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { CalendarBulkUpsertResult, ICalendarEventModel, ImportedCalendarEvent } from '@rocket.chat/model-typings';
import type { DeleteResult, FindCursor, IndexDescription, Collection, Db, UpdateResult } from 'mongodb';
import { ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CalendarEventRaw extends BaseRaw<ICalendarEvent> implements ICalendarEventModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICalendarEvent>>) {
		super(db, 'calendar_event', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{
				key: { startTime: -1, uid: 1, externalId: 1 },
			},
			{
				key: { reminderTime: -1, notificationSent: 1 },
			},
			{
				key: { uid: 1, externalId: 1 },
			},
		];
	}

	public async findOneByExternalIdAndUserId(
		externalId: Required<ICalendarEvent>['externalId'],
		uid: ICalendarEvent['uid'],
	): Promise<ICalendarEvent | null> {
		return this.findOne({
			externalId,
			uid,
		});
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
		{ subject, description, startTime, endTime, meetingUrl, reminderMinutesBeforeStart, reminderTime, busy }: Partial<ICalendarEvent>,
	): Promise<UpdateResult> {
		return this.updateOne(
			{ _id: eventId },
			{
				$set: {
					...(subject !== undefined ? { subject } : {}),
					...(description !== undefined ? { description } : {}),
					...(startTime ? { startTime } : {}),
					...(endTime && { endTime }),
					...(meetingUrl !== undefined ? { meetingUrl } : {}),
					...(reminderMinutesBeforeStart ? { reminderMinutesBeforeStart } : {}),
					...(reminderTime ? { reminderTime } : {}),
					...(typeof busy === 'boolean' && { busy }),
				},
			},
		);
	}

	public async findNextNotificationDate(): Promise<Date | null> {
		const nextEvent = await this.findOne<Pick<ICalendarEvent, 'reminderTime'>>(
			{
				reminderTime: {
					$gt: new Date(),
				},
				notificationSent: false,
			},
			{
				sort: {
					reminderTime: 1,
				},
				projection: {
					reminderTime: 1,
				},
			},
		);

		return nextEvent?.reminderTime || null;
	}

	public findEventsToNotify(notificationTime: Date, minutes: number): FindCursor<ICalendarEvent> {
		// Find all the events between notificationTime and +minutes that have not been notified yet
		const maxDate = new Date(notificationTime.toISOString());
		maxDate.setMinutes(maxDate.getMinutes() + minutes);

		return this.find(
			{
				reminderTime: {
					$gte: notificationTime,
					$lt: maxDate,
				},
				notificationSent: false,
			},
			{
				sort: {
					reminderTime: 1,
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

	public findOverlappingEvents(
		eventId: ICalendarEvent['_id'],
		uid: IUser['_id'],
		startTime: Date,
		endTime: Date,
	): FindCursor<ICalendarEvent> {
		return this.find({
			_id: { $ne: eventId }, // Exclude current event
			uid,
			busy: { $ne: false },
			$or: [
				// Event starts during our event
				{ startTime: { $gte: startTime, $lt: endTime } },
				// Event ends during our event
				{ endTime: { $gt: startTime, $lte: endTime } },
				// Event completely contains our event
				{ startTime: { $lte: startTime }, endTime: { $gte: endTime } },
			],
		});
	}

	public async findNextFutureEvent(startTime: Date): Promise<Pick<ICalendarEvent, '_id' | 'startTime'> | null> {
		return this.findOne(
			{
				startTime: { $gte: startTime },
				busy: { $ne: false },
				endTime: { $exists: true },
			},
			{
				sort: { startTime: 1 },
				projection: {
					startTime: 1,
				},
			},
		);
	}

	public findEventsStartingNow({
		now,
		offset = 1000,
	}: {
		now: Date;
		offset?: number;
	}): FindCursor<Pick<ICalendarEvent, '_id' | 'uid' | 'startTime' | 'endTime'>> {
		return this.find(
			{
				startTime: {
					$gte: new Date(now.getTime() - offset),
					$lt: new Date(now.getTime() + offset),
				},
				busy: { $ne: false },
			},
			{
				projection: {
					_id: 1,
					uid: 1,
					startTime: 1,
					endTime: 1,
				},
			},
		);
	}

	/**
	 * Through `this.col`, so the string `_id` and `_updatedAt` that `BaseRaw` adds are set by hand. Mongo
	 * would supply an ObjectId, which no lookup by string id would ever match.
	 */
	public async bulkUpsertImported(events: ImportedCalendarEvent[]): Promise<CalendarBulkUpsertResult> {
		if (!events.length) {
			return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
		}

		const now = new Date();

		const result = await this.col.bulkWrite(
			events.map(({ uid, externalId, ...fields }) => ({
				updateOne: {
					filter: { uid, externalId },
					update: {
						$set: { ...fields, _updatedAt: now },
						$setOnInsert: { _id: new ObjectId().toHexString(), uid, externalId, notificationSent: false },
					},
					upsert: true,
				},
			})),
			{ ordered: false },
		);

		return {
			matchedCount: result.matchedCount,
			modifiedCount: result.modifiedCount,
			upsertedCount: result.upsertedCount,
		};
	}

	public reopenNotifications(uid: IUser['_id'], externalIds: string[]): Promise<UpdateResult> {
		return this.col.updateMany(
			{ uid, externalId: { $in: externalIds }, notificationSent: true, reminderTime: { $gt: new Date() } },
			{ $set: { notificationSent: false, _updatedAt: new Date() } },
		);
	}

	public deleteUnfinishedByExternalIdsAndUserId(uid: IUser['_id'], externalIds: string[], notBefore: Date): Promise<DeleteResult> {
		return this.deleteMany({
			uid,
			externalId: { $in: externalIds },
			$or: [{ endTime: { $gt: notBefore } }, { endTime: { $exists: false }, startTime: { $gt: notBefore } }],
		});
	}

	public deleteImportedOutsideSet(uid: IUser['_id'], start: Date, end: Date, keepExternalIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({
			uid,
			externalId: { $type: 'string', $nin: keepExternalIds },
			startTime: { $lt: end },
			$or: [{ endTime: { $gt: start } }, { endTime: { $exists: false }, startTime: { $gt: start } }],
		});
	}
}
