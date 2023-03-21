import type { FindCursor, IndexDescription, Collection, Db } from 'mongodb';
import type { ICalendarEvent, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ICalendarEventModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class CalendarEventRaw extends BaseRaw<ICalendarEvent> implements ICalendarEventModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ICalendarEvent>>) {
		super(db, 'calendar_event', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, startTime: 1 }, unique: false }];
	}

	public findByUserIdAndDate(uid: IUser['_id'], date: Date): FindCursor<ICalendarEvent> {
		const minDate = new Date(date.toDateString());
		const maxDate = new Date(date.toDateString());
		maxDate.setDate(maxDate.getDate() + 1);

		return this.find(
			{
				uid,
				startTime: {
					$gte: minDate,
					$lt: maxDate,
				},
			},
			{
				sort: { startTime: 1 },
			},
		);
	}
}
