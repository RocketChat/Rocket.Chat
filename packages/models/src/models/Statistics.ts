import type { IStats } from '@rocket.chat/core-typings';
import type { IStatisticsModel } from '@rocket.chat/model-typings';
import type { IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class StatisticsRaw extends BaseRaw<IStats> implements IStatisticsModel {
	constructor() {
		super('statistics');
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

	async findMonthlyPeakConnections() {
		const oneMonthAgo = new Date();
		oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
		oneMonthAgo.setHours(0, 0, 0, 0);

		return this.findOne<Pick<IStats, 'dailyPeakConnections' | 'createdAt'>>(
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
	}
}
