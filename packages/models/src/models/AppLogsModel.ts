import type { IAppLogsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsLogsModel extends BaseRaw<any> implements IAppLogsModel {
	constructor(
		db: Db,
		private readonly expireAfterSeconds: number = 60 * 60 * 24 * 30,
	) {
		super(db, 'apps_logs', undefined);
	}

	protected modelIndexes() {
		return [
			{
				key: {
					_updatedAt: 1,
				},
				expireAfterSeconds: this.expireAfterSeconds,
			},
		];
	}

	remove(query: Filter<any>): Promise<DeleteResult> {
		return this.col.deleteMany(query);
	}
}
