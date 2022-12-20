import type { Reads, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ReadsRaw extends BaseRaw<Reads> implements IReadsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<Reads>>) {
		super(db, 'reads', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { tmid: 1, userId: 1 }, unique: true }, { key: { tmid: 1 } }];
	}

	findOneByUserIdAndThreadId(userId: string, tmid: string): Promise<Reads | null> {
		return this.findOne({ userId, tmid });
	}

	getMinimumLastSeenByThreadId(tmid: string): Promise<Reads | null> {
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
}
