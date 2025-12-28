import type { IIntegration, IIntegrationHistory } from '@rocket.chat/core-typings';
import type { FindOneAndUpdateOptions, InsertOneResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IIntegrationHistoryModel extends IBaseModel<IIntegrationHistory> {
	removeByIntegrationId(integrationId: IIntegration['_id']): ReturnType<IBaseModel<IIntegrationHistory>['deleteMany']>;
	findOneByIntegrationIdAndHistoryId(
		integrationId: IIntegration['_id'],
		historyId: IIntegrationHistory['_id'],
	): Promise<IIntegrationHistory | null>;
	create(integrationHistory: IIntegrationHistory): Promise<InsertOneResult<IIntegrationHistory>>;
	updateById(
		_id: IIntegrationHistory['_id'],
		data: Partial<IIntegrationHistory>,
		options?: FindOneAndUpdateOptions,
	): Promise<IIntegrationHistory | null>;
}
