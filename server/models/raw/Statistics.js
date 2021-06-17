import { BaseRaw } from './BaseRaw';

export class StatisticsRaw extends BaseRaw {
	async findLast() {
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
