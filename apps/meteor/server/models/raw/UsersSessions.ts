import type { IUserSession } from '@rocket.chat/core-typings';
import type { IUsersSessionsModel } from '@rocket.chat/model-typings';

import { BaseRaw } from './BaseRaw';

export class UsersSessionsRaw extends BaseRaw<IUserSession> implements IUsersSessionsModel {
	clearConnectionsFromInstanceId(instanceId: string[]): ReturnType<BaseRaw<IUserSession>['updateMany']> {
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
