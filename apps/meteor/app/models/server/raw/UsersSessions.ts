import { BaseRaw } from './BaseRaw';
import type { IUserSession } from '@rocket.chat/core-typings';

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
