import type { IIntegrationHistory } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IIntegrationHistoryModel extends IBaseModel<IIntegrationHistory> {
	removeByIntegrationId(integrationId: string): ReturnType<IBaseModel<IIntegrationHistory>['deleteMany']>;

	findOneByIntegrationIdAndHistoryId(integrationId: string, historyId: string): Promise<IIntegrationHistory | null>;
}
