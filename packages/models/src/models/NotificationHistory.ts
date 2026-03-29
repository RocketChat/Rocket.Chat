import type { INotificationHistory, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { INotificationHistoryModel } from '@rocket.chat/model-typings';
import type { Collection, Db, DeleteResult, FindCursor, IndexDescription, WithId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class NotificationHistoryRaw extends BaseRaw<INotificationHistory> implements INotificationHistoryModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<INotificationHistory>>) {
		super(db, 'notification_history', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { userId: 1 } }, { key: { ts: -1 } }];
	}

	findPaginatedByUserId(
		userId: string,
		options: { limit: number; skip: number; type?: INotificationHistory['type'] },
	): { cursor: FindCursor<WithId<INotificationHistory>>; totalCount: Promise<number> } {
		const query: any = { userId };
		if (options.type) {
			query.type = options.type;
		}
		return this.findPaginated(query, { sort: { ts: -1 }, limit: options.limit, skip: options.skip });
	}

	deleteOneByIdAndUserId(_id: string, userId: string): Promise<DeleteResult> {
		return this.col.deleteOne({ _id, userId });
	}

	deleteAllByUserId(userId: string): Promise<DeleteResult> {
		return this.col.deleteMany({ userId });
	}
}