import type { IReadReceipt } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { FindCursor, Db, IndexDescription, DeleteResult } from 'mongodb';

export class ReadReceiptsRaw extends BaseRaw<IReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db) {
		super(db, 'read_receipts');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [
			// Unique index removed to increase performance. Uniqueness in now handled via composite value of _id
			// TODO: Drop existent index on database migration of 9.0
			// { key: { roomId: 1, userId: 1, messageId: 1 }, unique: true },
			{ key: { messageId: 1 } },
			{ key: { userId: 1 } },
			{ key: { roomId: 1 } },
			{ key: { ts: -1 } },
		];
	}

	findByMessageId(messageId: string): FindCursor<IReadReceipt> {
		return this.find({ messageId });
	}

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

	findOlderThan(date: Date): FindCursor<IReadReceipt> {
		return this.find({ ts: { $lt: date } });
	}
}
