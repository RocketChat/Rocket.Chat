import type { IUser, IMessage, ReadReceipt, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Collection, FindCursor, Db, IndexDescription, DeleteResult, Filter, UpdateResult, Document } from 'mongodb';

import { otrSystemMessages } from '../../../../app/otr/lib/constants';

export class ReadReceiptsRaw extends BaseRaw<ReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ReadReceipt>>) {
		super(db, 'read_receipts', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }, { key: { userId: 1 } }];
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

	removeOTRReceiptsUntilDate(roomId: string, until: Date): Promise<DeleteResult> {
		const query = {
			roomId,
			t: {
				$in: [
					'otr',
					otrSystemMessages.USER_JOINED_OTR,
					otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH,
					otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY,
				],
			},
			ts: { $lte: until },
		};
		return this.col.deleteMany(query);
	}

	async removeByIdPinnedTimestampLimitAndUsers(
		roomId: string,
		ignorePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Filter<IMessage>['ts'],
		users: IUser['_id'][],
		ignoreThreads: boolean,
	): Promise<DeleteResult> {
		const query: Filter<ReadReceipt> = {
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
