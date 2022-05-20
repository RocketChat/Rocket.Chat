import type { IStats } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class StatisticsRaw extends BaseRaw<IStats> {
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
