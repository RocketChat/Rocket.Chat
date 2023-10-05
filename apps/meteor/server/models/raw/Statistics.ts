import type { IStats } from '@rocket.chat/core-typings';
import type { IStatisticsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class StatisticsRaw extends BaseRaw<IStats> implements IStatisticsModel {
	constructor(db: Db) {
		super(db, 'statistics');
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

	async findMaxMonthlyPeakConnections(): Promise<Pick<IStats, 'dailyPeakConnections' | 'createdAt'> | undefined> {
		const oneMonthAgo = new Date();
		oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
		oneMonthAgo.setHours(0, 0, 0, 0);

		const record = await this.findOne(
			{
				createdAt: { $gte: oneMonthAgo },
			},
			{
				sort: {
					dailyPeakConnections: -1,
				},
				projection: {
					dailyPeakConnections: 1,
					createdAt: 1,
				},
			},
		);
		return record ?? undefined;
	}
}
