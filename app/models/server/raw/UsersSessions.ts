import { BaseRaw } from './BaseRaw';
import { IUserSession } from '../../../../definition/IUserSession';

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
