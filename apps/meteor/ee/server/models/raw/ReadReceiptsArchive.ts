import type { IReadReceipt, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import { BaseRaw, readSecondaryPreferred } from '@rocket.chat/models';
import type { Collection, FindCursor, Db, IndexDescription, DeleteResult } from 'mongodb';

export class ReadReceiptsArchiveRaw extends BaseRaw<IReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IReadReceipt>>) {
		super(db, 'read_receipts_archive', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { messageId: 1 } }, { key: { userId: 1 } }, { key: { roomId: 1 } }, { key: { ts: -1 } }];
	}

	findByMessageId(messageId: string): FindCursor<IReadReceipt> {
		// Pass read preference directly to the find query to prefer reading from secondary replicas
		return this.find({ messageId }, { readPreference: readSecondaryPreferred() });
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

	findOlderThan(date: Date): FindCursor<IReadReceipt> {
		// Pass read preference directly to the find query to prefer reading from secondary replicas
		return this.find({ ts: { $lt: date } }, { readPreference: readSecondaryPreferred() });
	}
}
