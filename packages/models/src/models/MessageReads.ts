import type { MessageReads, IUser, IMessage, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IMessageReadsModel } from '@rocket.chat/model-typings';
import type { Collection, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class MessageReadsRaw extends BaseRaw<MessageReads> implements IMessageReadsModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<MessageReads>>) {
		super('message_reads', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { tmid: 1, userId: 1 }, unique: true }, { key: { ls: 1 } }];
	}

	async findOneByUserIdAndThreadId(userId: IUser['_id'], tmid: IMessage['_id']): Promise<MessageReads | null> {
		return this.findOne({ userId, tmid });
	}

	getMinimumLastSeenByThreadId(tmid: IMessage['_id']): Promise<MessageReads | null> {
		return this.findOne(
			{
				tmid,
			},
			{
				sort: {
					ls: 1,
				},
			},
		);
	}

	updateReadTimestampByUserIdAndThreadId(userId: IUser['_id'], tmid: IMessage['_id']): Promise<UpdateResult> {
		const query = {
			userId,
			tmid,
		};

		const update = {
			$set: {
				ls: new Date(),
			},
		};

		return this.updateOne(query, update, { upsert: true });
	}

	async countByThreadAndUserIds(tmid: IMessage['_id'], userIds: IUser['_id'][]): Promise<number> {
		const query = {
			tmid,
			userId: { $in: userIds },
		};
		return this.col.countDocuments(query);
	}

	async countByThreadId(tmid: IMessage['_id']): Promise<number> {
		const query = {
			tmid,
		};
		return this.col.countDocuments(query);
	}
}
