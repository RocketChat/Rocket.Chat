import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsPersistenceModel extends BaseRaw<any> implements IAppsPersistenceModel {
	constructor(db: Db) {
		super(db, 'apps_persistence');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					appId: 1,
					associations: 1,
				},
			},
		];
	}

	// Bypass trash collection
	remove(query: Filter<any>): Promise<DeleteResult> {
		return this.col.deleteMany(query);
	}
}
