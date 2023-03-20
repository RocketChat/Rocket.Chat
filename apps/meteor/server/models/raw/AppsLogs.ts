import type { ILoggerStorageEntry } from '@rocket.chat/core-typings';
import type { IAppsLogsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsLogsRaw extends BaseRaw<ILoggerStorageEntry> implements IAppsLogsModel {
	constructor(db: Db) {
		super(db, 'apps_logs');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { _updatedAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 }];
	}

	remove(query: Filter<any>): Promise<DeleteResult> {
		return this.col.deleteMany(query);
	}

	async resetTTLIndex(expireAfterSeconds: number): Promise<void> {
		await this.col.dropIndex('_updatedAt_1');
		await this.col.createIndex({ _updatedAt: 1 }, { expireAfterSeconds });
	}
}
