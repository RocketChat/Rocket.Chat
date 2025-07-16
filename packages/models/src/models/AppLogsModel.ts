import type { IAppLogsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsLogsModel extends BaseRaw<any> implements IAppLogsModel {
	constructor(db: Db) {
		super(db, 'apps_logs', undefined);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			// This index is used to expire logs after 30 days
			{
				key: {
					_updatedAt: 1,
				},
				expireAfterSeconds: 60 * 60 * 24 * 30,
			},
			// Index for specific queries from the logs screen (most common)
			{
				key: {
					'appId': 1,
					'_updatedAt': -1,
					'entries.severity': 1,
					'method': 1,
				},
				name: 'appId_indexed_query',
			},
			// Index for queries on general logs endpoint
			{
				key: {
					'_updatedAt': -1,
					'entries.severity': 1,
					'method': 1,
				},
				name: 'general_logs_index',
			},
		];
	}

	remove(query: Filter<any>): Promise<DeleteResult> {
		return this.col.deleteMany(query);
	}
}
