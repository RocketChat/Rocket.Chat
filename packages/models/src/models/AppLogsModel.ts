import type { IAppLogsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsLogsModel extends BaseRaw<any> implements IAppLogsModel {
	constructor(db: Db) {
		super(db, 'apps_logs', undefined, { _updatedAtIndexOptions: { expireAfterSeconds: 60 * 60 * 24 * 30 } });
	}

	remove(query: Filter<any>): Promise<DeleteResult> {
		return this.col.deleteMany(query);
	}

	async resetTTLIndex(expireAfterSeconds: number): Promise<void> {
		if (await this.col.indexExists('_updatedAt_1')) {
			await this.col.dropIndex('_updatedAt_1');
		}
		await this.col.createIndex({ _updatedAt: 1 }, { expireAfterSeconds });
	}
}
