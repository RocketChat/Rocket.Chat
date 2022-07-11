import type { IStats, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IStatisticsModel } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class StatisticsRaw extends BaseRaw<IStats> implements IStatisticsModel {
	constructor(db: Db, trashCollection: Collection<RocketChatRecordDeleted<IStats>>) {
		super(db, 'statistics', trashCollection);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { createdAt: -1 } }];
	}

	async findLast(): Promise<IStats> {
		const records = await this.find(
			{},
			{
				sort: {
					createdAt: -1,
				},
				limit: 1,
			},
		).toArray();
		return records?.[0];
	}
}
