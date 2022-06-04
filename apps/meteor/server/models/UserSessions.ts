import type { IUserSession } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class UsersSessions extends ModelClass<IUserSession> {
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
