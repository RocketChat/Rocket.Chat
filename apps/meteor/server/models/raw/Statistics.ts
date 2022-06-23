import type { IStats, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IStatisticsModel } from '@rocket.chat/model-typings';
import { getCollectionName } from '@rocket.chat/models';
import type { Collection, Db, IndexSpecification } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class StatisticsRaw extends BaseRaw<IStats> implements IStatisticsModel {
	constructor(db: Db, trashCollection: Collection<RocketChatRecordDeleted<IStats>>) {
		super(db, getCollectionName('statistics'), trashCollection);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { createdAt: -1 } }];
	}

	async findLast(): Promise<IStats> {
		const options = {
			sort: {
				createdAt: -1,
			},
			limit: 1,
		};
		const records = await this.find({}, options).toArray();
		return records?.[0];
	}
}
