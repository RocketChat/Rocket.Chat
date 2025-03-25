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

	async findLastStatsToken(): Promise<IStats['statsToken']> {
		const records = await this.find(
			{
				statsToken: { $exists: true },
			},
			{
				sort: {
					createdAt: -1,
				},
				projection: {
					statsToken: 1,
				},
				limit: 1,
			},
		).toArray();
		return records?.[0]?.statsToken;
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

	async findInstallationDates() {
		return this.col
			.aggregate<Pick<IStats, 'version' | 'installedAt'>>([
				{
					$group: {
						_id: '$version',
						installedAt: { $min: '$installedAt' },
					},
				},
				{
					$project: {
						_id: 0,
						version: '$_id',
						installedAt: 1,
					},
				},
				{
					$sort: { installedAt: 1 },
				},
			])
			.toArray();
	}
}
