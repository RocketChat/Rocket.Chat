import type { IndexSpecification } from 'mongodb';
import type { IStats } from '@rocket.chat/core-typings';
import type { IStatisticsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class Statistics extends ModelClass<IStats> implements IStatisticsModel {
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

const col = db.collection(`${prefix}statistics`);
registerModel('IStatisticsModel', new Statistics(col, trashCollection) as IStatisticsModel);
