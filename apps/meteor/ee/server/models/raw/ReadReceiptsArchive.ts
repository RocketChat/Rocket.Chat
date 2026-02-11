import type { IReadReceipt, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Collection, FindCursor, Db, IndexDescription } from 'mongodb';

export class ReadReceiptsArchiveRaw extends BaseRaw<IReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IReadReceipt>>) {
		super(db, 'read_receipts_archive', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }, { key: { userId: 1 } }, { key: { ts: 1 } }];
	}

	findByMessageId(messageId: string): FindCursor<IReadReceipt> {
		return this.find({ messageId });
	}

	// Archive doesn't need all the delete methods from hot storage
	// But we implement them to satisfy the interface
	async removeByUserId(userId: string) {
		return this.deleteMany({ userId });
	}

	async removeByRoomId(roomId: string) {
		return this.deleteMany({ roomId });
	}

	async removeByRoomIds(roomIds: string[]) {
		return this.deleteMany({ roomId: { $in: roomIds } });
	}

	async removeByMessageId(messageId: string) {
		return this.deleteMany({ messageId });
	}

	async removeByMessageIds(messageIds: string[]) {
		return this.deleteMany({ messageId: { $in: messageIds } });
	}

	async removeByIdPinnedTimestampLimitAndUsers() {
		// Not needed for archive, but required by interface
		return { acknowledged: true, deletedCount: 0 };
	}

	async setPinnedByMessageId(messageId: string, pinned = true) {
		return this.updateMany({ messageId }, { $set: { pinned } });
	}

	async setAsThreadById(messageId: string) {
		return this.updateMany({ messageId }, { $set: { tmid: messageId } });
	}

	findOlderThan(date: Date): FindCursor<IReadReceipt> {
		return this.find({ ts: { $lt: date } });
	}
}
