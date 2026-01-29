import type { IAppLogsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, Filter, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsLogsModel extends BaseRaw<any> implements IAppLogsModel {
	constructor(db: Db) {
		super(db, 'apps_logs', undefined);
	}

	protected override modelIndexes(): IndexDescription[] {
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
					'instanceId': 1,
					'method': 1,
				},
				name: 'appId_indexed_query_v2',
			},
			// Index for queries on general logs endpoint
			{
				key: {
					'_updatedAt': -1,
					'entries.severity': 1,
					'instanceId': 1,
					'method': 1,
				},
				name: 'general_logs_index_v2',
			},
		];
	}

	async getDistinctFieldsForFilters(appId: string): Promise<{ instanceIds: string[]; methods: string[] }> {
		/**
		 * The following aggregation uses the 'appId_indexed_query_v2' index to retrieve the distinct values
		 * The execution is fully covered by the index, meaning the database should not need to scan any documents.
		 */
		const [{ instanceIds, methods }] = await this.col
			.aggregate([
				{ $match: { appId } },
				{ $group: { _id: null, instanceIds: { $addToSet: '$instanceId' }, methods: { $addToSet: '$method' } } },
			])
			.toArray();

		return { instanceIds, methods };
	}

	remove(query: Filter<any>): Promise<DeleteResult> {
		return this.col.deleteMany(query);
	}
}
