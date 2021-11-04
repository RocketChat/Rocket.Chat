import { Collection } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IStatistic } from '../../../../definition/IStatistic';

type T = IStatistic;

export class StatisticsRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndex({ createdAt: -1 });
	}

	async findLast(): Promise<T> {
		const options = {
			sort: {
				createdAt: -1,
			},
			limit: 1,
		};
		const records = await this.find({}, options).toArray();
		return records && records[0];
	}
}
