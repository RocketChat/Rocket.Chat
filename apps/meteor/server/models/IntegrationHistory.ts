import { IndexSpecification } from 'mongodb';
import type { IIntegrationHistory } from '@rocket.chat/core-typings';
import type { IIntegrationHistoryModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class IntegrationHistory extends ModelClass<IIntegrationHistory> implements IIntegrationHistoryModel {
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

const col = db.collection(`${prefix}integration_history`);
registerModel('IIntegrationHistoryModel', new IntegrationHistory(col, trashCollection) as IIntegrationHistoryModel);
