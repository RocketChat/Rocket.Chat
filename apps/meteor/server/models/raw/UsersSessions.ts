import type { IUserSession } from '@rocket.chat/core-typings';
import type { IUsersSessionsModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class UsersSessionsRaw extends ModelClass<IUserSession> implements IUsersSessionsModel {
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
