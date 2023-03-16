import type { IUser, ReadReceipt, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription, DeleteResult, Filter, UpdateResult, Document } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class ReadReceiptsRaw extends BaseRaw<ReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ReadReceipt>>) {
		super(db, 'read_receipts', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];
	}

	findByMessageId(messageId: string): FindCursor<ReadReceipt> {
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

	removeByRoomIdAndTypesUntilDate(roomId: string, types: string[], until: Date): Promise<DeleteResult> {
		const query = {
			roomId,
			t: {
				$in: types,
			},
			ts: { $lte: until },
		};
		return this.deleteMany(query);
	}

	async removeByIdPinnedTimestampLimitAndUsers(
		roomId: string,
		ignorePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Date,
		users: IUser['username'][],
		ignoreThreads: boolean,
	): Promise<DeleteResult> {
		const query: Filter<any> = {
			roomId,
			ts,
		};

		if (ignorePinned) {
			query.pinned = { $ne: true };
		}

		if (ignoreDiscussion) {
			query.drid = { $exists: 0 };
		}

		if (ignoreThreads) {
			query.tmid = { $exists: 0 };
			query.tcount = { $exists: 0 };
		}

		if (users.length) {
			const uids = await Users.findByUsernames(users, { projection: { _id: 1 } })
				.map((user: IUser) => user._id)
				.toArray();
			query.userId = { $in: uids };
		}

		return this.deleteMany(query);
	}

	setPinnedByMessageId(messageId: string, pinned: boolean): Promise<Document | UpdateResult> {
		return this.updateMany({ messageId }, { $set: { pinned } });
	}

	incrementThreadMessagesCountById(messageId: string, inc = 1): Promise<Document | UpdateResult> {
		return this.updateMany({ messageId }, { $inc: { tcount: inc } });
	}

	unsetThreadMessagesCountById(messageId: string): Promise<Document | UpdateResult> {
		return this.updateMany({ messageId }, { $unset: { tcount: 1 } });
	}
}
