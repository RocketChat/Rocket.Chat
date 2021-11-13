import { BaseRaw, IndexSpecification } from './BaseRaw';
import { IStatistic } from '../../../../definition/IStatistic';

type T = IStatistic;

export class StatisticsRaw extends BaseRaw<T> {
	protected indexes: IndexSpecification[] = [
		{ key: { createdAt: -1 } },
	]

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
