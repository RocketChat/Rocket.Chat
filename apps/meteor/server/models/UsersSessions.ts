import type { IUserSession } from '@rocket.chat/core-typings';
import type { IUsersSessionsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db } from '../database/utils';

export class UsersSessions extends ModelClass<IUserSession> implements IUsersSessionsModel {
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
registerModel('IUsersSessionsModel', new UsersSessions(col, trashCollection, { preventSetUpdatedAt: true }) as IUsersSessionsModel);
