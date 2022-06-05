import type { IUserSession } from '@rocket.chat/core-typings';
import type { IUserSessionsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db } from '../database/utils';

export class UsersSessions extends ModelClass<IUserSession> implements IUserSessionsModel {
	clearConnectionsFromInstanceId(instanceId: string[]): ReturnType<ModelClass<IUserSession>['updateMany']> {
		return this.col.updateMany(
			{},
			{
				$pull: {
					connections: {
						instanceId: {
							$nin: instanceId,
						},
					},
				},
			},
		);
	}
}

const col = db.collection('usersSessions');
registerModel('IUserSessionsModel', new UsersSessions(col, trashCollection, { preventSetUpdatedAt: true }) as IUserSessionsModel);
