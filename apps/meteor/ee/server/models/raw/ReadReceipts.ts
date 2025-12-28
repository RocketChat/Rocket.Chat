import type { IUser, IMessage, IReadReceipt, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Collection, FindCursor, Db, IndexDescription, DeleteResult, Filter, UpdateResult, Document } from 'mongodb';

export class ReadReceiptsRaw extends BaseRaw<IReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IReadReceipt>>) {
		super(db, 'read_receipts', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }, { key: { userId: 1 } }];
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

	async removeByIdPinnedTimestampLimitAndUsers(
		roomId: string,
		ignorePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Filter<IMessage>['ts'],
		users: IUser['_id'][],
		ignoreThreads: boolean,
	): Promise<DeleteResult> {
		const query: Filter<IReadReceipt> = {
			roomId,
			ts,
		};

		if (ignorePinned) {
			query.pinned = { $ne: true };
		}

		if (ignoreDiscussion) {
			query.drid = { $exists: false };
		}

		if (ignoreThreads) {
			query.tmid = { $exists: false };
		}

		if (users.length) {
			query.userId = { $in: users };
		}

		return this.deleteMany(query);
	}

	setPinnedByMessageId(messageId: string, pinned = true): Promise<Document | UpdateResult> {
		return this.updateMany({ messageId }, { $set: { pinned } });
	}

	setAsThreadById(messageId: string): Promise<Document | UpdateResult> {
		return this.updateMany({ messageId }, { $set: { tmid: messageId } });
	}
}
