import type { IIntegrationHistory } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class IntegrationHistoryRaw extends BaseRaw<IIntegrationHistory> {
	protected modelIndexes(): IndexSpecification[] {
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
}
