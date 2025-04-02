import type { ICalendarEvent, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICalendarEventModel } from '@rocket.chat/model-typings';
import type { FindCursor, IndexDescription, Collection, Db, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CalendarEventRaw extends BaseRaw<ICalendarEvent> implements ICalendarEventModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICalendarEvent>>) {
		super(db, 'calendar_event', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: { startTime: -1, uid: 1, externalId: 1 },
			},
			{
				key: { reminderTime: -1, notificationSent: 1 },
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
		{
			subject,
			description,
			startTime,
			endTime,
			meetingUrl,
			reminderMinutesBeforeStart,
			reminderTime,
			previousStatus,
			busy,
		}: Partial<ICalendarEvent>,
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
					...(previousStatus ? { previousStatus } : {}),
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

	public findEligibleEventsForCancelation(uid: IUser['_id'], endTime: Date): FindCursor<ICalendarEvent> {
		return this.find({
			uid,
			startTime: { $exists: true, $lte: endTime },
			endTime: { $exists: true, $gte: endTime },
		});
	}

	public findEventsToScheduleNow(now: Date, endTime: Date): FindCursor<ICalendarEvent> {
		return this.find(
			{
				startTime: { $gte: now, $lt: endTime },
				busy: { $ne: false },
				endTime: { $exists: true },
			},
			{
				sort: { startTime: 1 },
				projection: {
					_id: 1,
					uid: 1,
					startTime: 1,
					endTime: 1,
				},
			},
		);
	}

	public async findNextFutureEvent(startTime: Date): Promise<ICalendarEvent | null> {
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

	public findEventsStartingNow({ now, offset = 1000 }: { now: Date; offset?: number }): FindCursor<ICalendarEvent> {
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

	public findEventsEndingNow({ now, offset = 1000 }: { now: Date; offset?: number }): FindCursor<ICalendarEvent> {
		return this.find(
			{
				endTime: {
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
					previousStatus: 1,
				},
			},
		);
	}

	public findInProgressEvents(now: Date): FindCursor<ICalendarEvent> {
		return this.find(
			{
				startTime: { $lt: now },
				endTime: { $gt: now },
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
}
