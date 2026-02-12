import type { IReadReceipt, IUser, IMessage, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Collection, FindCursor, Db, IndexDescription, Filter, DeleteResult, UpdateResult, Document } from 'mongodb';

export class ReadReceiptsArchiveRaw extends BaseRaw<IReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IReadReceipt>>) {
		super(db, 'read_receipts_archive', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true },
			{ key: { messageId: 1 } },
			{ key: { userId: 1 } },
			{ key: { ts: 1 } },
		];
	}

	findByMessageId(messageId: string): FindCursor<IReadReceipt> {
		return this.find({ messageId });
	}

	// Archive doesn't need all the delete methods from hot storage
	// But we implement them to satisfy the interface
	removeByUserId(userId: string): Promise<DeleteResult> {
		return this.deleteMany({ userId });
	}

	removeByRoomId(roomId: string): Promise<DeleteResult> {
		return this.deleteMany({ roomId });
	}

	removeByRoomIds(roomIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ roomId: { $in: roomIds } });
	}

	removeByMessageId(messageId: string): Promise<DeleteResult> {
		return this.deleteMany({ messageId });
	}

	removeByMessageIds(messageIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({ messageId: { $in: messageIds } });
	}

	async removeByIdPinnedTimestampLimitAndUsers(
		_roomId: string,
		_ignorePinned: boolean,
		_ignoreDiscussion: boolean,
		_ts: Filter<IMessage>['ts'],
		_users: IUser['_id'][],
		_ignoreThreads: boolean,
	): Promise<DeleteResult> {
		// Not needed for archive, but required by interface
		return { acknowledged: true, deletedCount: 0 };
	}

	setPinnedByMessageId(messageId: string, pinned = true): Promise<Document | UpdateResult> {
		return this.updateMany({ messageId }, { $set: { pinned } });
	}

	setAsThreadById(messageId: string): Promise<Document | UpdateResult> {
		return this.updateMany({ messageId }, { $set: { tmid: messageId } });
	}

	findOlderThan(date: Date): FindCursor<IReadReceipt> {
		return this.find({ ts: { $lt: date } });
	}
}
