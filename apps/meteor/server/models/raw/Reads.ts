import type { Reads, IUser, IMessage, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ReadsRaw extends BaseRaw<Reads> implements IReadsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<Reads>>) {
		super(db, 'reads', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { tmid: 1, userId: 1 }, unique: true }, { key: { tmid: 1 } }];
	}

	async findOneByUserIdAndThreadId(userId: IUser['_id'], tmid: IMessage['_id']): Promise<Reads | null> {
		return this.findOne({ userId, tmid });
	}

	getMinimumLastSeenByThreadId(tmid: IMessage['_id']): Promise<Reads | null> {
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
}
