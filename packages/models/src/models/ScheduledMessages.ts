import type { Collection, Db, FindCursor, IndexDescription } from 'mongodb';
import type { IScheduledMessage, RocketChatRecordDeleted } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class ScheduledMessagesRaw extends BaseRaw<IScheduledMessage> {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IScheduledMessage>>) {
		super(db, 'scheduled_message', trash);
	}

	/**
	 * Defines database indexes supporting scheduled message queries.
	 */
	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { status: 1, deliverAt: 1 } }];
	}

	/**
	 * Finds all pending scheduled messages whose delivery time has passed.
	 *
	 * @returns A MongoDB find cursor for due scheduled messages.
	 */
	findDueMessages(): FindCursor<IScheduledMessage> {
		return this.find({
			status: 'pending',
			deliverAt: { $lte: new Date() },
		});
	}
}
