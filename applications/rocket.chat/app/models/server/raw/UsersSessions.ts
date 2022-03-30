import { IUserSession } from '@rocket.chat/core-typingsSession';

import { BaseRaw } from './BaseRaw';

export class UsersSessionsRaw extends BaseRaw<IUserSession> {
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
