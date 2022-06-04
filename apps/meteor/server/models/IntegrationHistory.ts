import { IndexSpecification } from 'mongodb';
import type { IIntegrationHistory } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class IntegrationHistory extends ModelClass<IIntegrationHistory> {
	protected modelIndexes(): IndexSpecification[] {
		return [
			{ key: { 'integration._id': 1, 'integration._createdBy._id': 1 } },
			{ key: { _updatedAt: 1 }, expireAfterSeconds: 30 * 24 * 60 * 60 },
		];
	}

	removeByIntegrationId(integrationId: string): ReturnType<ModelClass<IIntegrationHistory>['deleteMany']> {
		return this.deleteMany({ 'integration._id': integrationId });
	}

	findOneByIntegrationIdAndHistoryId(integrationId: string, historyId: string): Promise<IIntegrationHistory | null> {
		return this.findOne({ 'integration._id': integrationId, '_id': historyId });
	}
}
