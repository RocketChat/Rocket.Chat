import type { AppsPersistenceRecord, IAppsPersistenceModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsPersistenceModel extends BaseRaw<AppsPersistenceRecord> implements IAppsPersistenceModel {
	constructor(db: Db) {
		super(db, 'apps_persistence');
	}

	protected override modelIndexes(): IndexDescription[] {
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
	remove(query: Filter<AppsPersistenceRecord>): Promise<DeleteResult> {
		return this.col.deleteMany(query);
	}
}
