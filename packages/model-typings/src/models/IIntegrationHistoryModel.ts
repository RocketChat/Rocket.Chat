import type { IIntegrationHistory } from '@rocket.chat/core-typings';
import type { FindOneAndUpdateOptions, InsertOneResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IIntegrationHistoryModel extends IBaseModel<IIntegrationHistory> {
	removeByIntegrationId(integrationId: string): ReturnType<IBaseModel<IIntegrationHistory>['deleteMany']>;
	findOneByIntegrationIdAndHistoryId(integrationId: string, historyId: string): Promise<IIntegrationHistory | null>;
	create(integrationHistory: IIntegrationHistory): Promise<InsertOneResult<IIntegrationHistory>>;
	updateById(
		_id: IIntegrationHistory['_id'],
		data: Partial<IIntegrationHistory>,
		options?: FindOneAndUpdateOptions,
	): Promise<IIntegrationHistory | null>;
}
