import type { IStats } from '@rocket.chat/core-typings';
import type { IStatisticsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class StatisticsRaw extends BaseRaw<IStats> implements IStatisticsModel {
	constructor(db: Db) {
		super(db, 'statistics');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { createdAt: -1 } },
			{
				key: { createdAt: -1, cloudToken: 1 },
				partialFilterExpression: { cloudToken: { $exists: true } },
			},
		];
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

	async findLastSentWithCloudToken(): Promise<IStats> {
		const records = await this.find(
			{
				cloudToken: { $exists: true },
			},
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
