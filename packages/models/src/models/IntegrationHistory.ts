import type { IIntegrationHistory } from '@rocket.chat/core-typings';
import type { IIntegrationHistoryModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription, InsertOneResult, FindOneAndUpdateOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class IntegrationHistoryRaw extends BaseRaw<IIntegrationHistory> implements IIntegrationHistoryModel {
	constructor(db: Db) {
		super(db, 'integration_history');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { 'integration._id': 1, 'integration._createdBy._id': 1 } },
			{ key: { _updatedAt: 1 }, expireAfterSeconds: 30 * 24 * 60 * 60 },
		];
	}

	removeByIntegrationId(integrationId: string): ReturnType<BaseRaw<IIntegrationHistory>['deleteMany']> {
		return this.deleteMany({ 'integration._id': integrationId });
	}

	findOneByIntegrationIdAndHistoryId(integrationId: string, historyId: string): Promise<IIntegrationHistory | null> {
		return this.findOne({ 'integration._id': integrationId, '_id': historyId });
	}

	async create(integrationHistory: IIntegrationHistory): Promise<InsertOneResult<IIntegrationHistory>> {
		return this.insertOne({ ...integrationHistory, _createdAt: new Date() });
	}

	async updateById(
		_id: IIntegrationHistory['_id'],
		data: Partial<IIntegrationHistory>,
		options?: FindOneAndUpdateOptions,
	): Promise<IIntegrationHistory | null> {
		return this.findOneAndUpdate({ _id }, { $set: data }, { returnDocument: 'after', ...options });
	}
}
