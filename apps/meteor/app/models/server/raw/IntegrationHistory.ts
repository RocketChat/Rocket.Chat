import type { IIntegrationHistory } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class IntegrationHistoryRaw extends BaseRaw<IIntegrationHistory> {
	removeByIntegrationId(integrationId: string): ReturnType<BaseRaw<IIntegrationHistory>['deleteMany']> {
		return this.deleteMany({ 'integration._id': integrationId });
	}

	findOneByIntegrationIdAndHistoryId(integrationId: string, historyId: string): Promise<IIntegrationHistory | null> {
		return this.findOne({ 'integration._id': integrationId, '_id': historyId });
	}
}
