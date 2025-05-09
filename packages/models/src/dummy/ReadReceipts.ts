import type { IUser, IMessage, ReadReceipt } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import type { FindCursor, DeleteResult, Filter, UpdateResult, Document } from 'mongodb';

import { BaseDummy } from './BaseDummy';

export class ReadReceiptsDummy extends BaseDummy<ReadReceipt> implements IReadReceiptsModel {
	constructor() {
		super('read_receipts');
	}

	findByMessageId(_messageId: string): FindCursor<ReadReceipt> {
		return this.find({});
	}

	removeByUserId(_userId: string): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByRoomId(_roomId: string): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByRoomIds(_roomIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByMessageId(_messageId: string): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByMessageIds(_messageIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeOTRReceiptsUntilDate(_roomId: string, _until: Date): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	async removeByIdPinnedTimestampLimitAndUsers(
		_roomId: string,
		_ignorePinned: boolean,
		_ignoreDiscussion: boolean,
		_ts: Filter<IMessage>['ts'],
		_users: IUser['_id'][],
		_ignoreThreads: boolean,
	): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	setPinnedByMessageId(_messageId: string, _pinned = true): Promise<Document | UpdateResult> {
		return this.updateMany({}, {});
	}

	setAsThreadById(_messageId: string): Promise<Document | UpdateResult> {
		return this.updateMany({}, {});
	}
}
