import type { IDataMigrationRecord } from '@rocket.chat/core-typings';
import type { IDataMigrationsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class DataMigrationsRaw extends BaseRaw<IDataMigrationRecord> implements IDataMigrationsModel {
	constructor(db: Db) {
		super(db, 'data_migrations', undefined, {
			collectionNameResolver(name) {
				return name;
			},
		});
	}
}
