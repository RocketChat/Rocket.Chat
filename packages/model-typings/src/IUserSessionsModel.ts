import type { IUserSession } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUserSessionsModel extends IBaseModel<IUserSession> {
	clearConnectionsFromInstanceId(instanceId: string[]): ReturnType<IBaseModel<IUserSession>['updateMany']>;
}
