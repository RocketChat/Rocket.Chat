import type { FindCursor, FindOptions } from 'mongodb';
import type { IUserSession, IUserSessionConnection } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IUsersSessionsModel extends IBaseModel<IUserSession> {
	clearConnectionsFromInstanceId(instanceId: string[]): ReturnType<IBaseModel<IUserSession>['updateMany']>;
	updateConnectionStatusById(uid: string, connectionId: string, status: string): ReturnType<IBaseModel<IUserSession>['updateOne']>;
	removeConnectionsFromInstanceId(instanceId: string): ReturnType<IBaseModel<IUserSession>['updateMany']>;
	removeConnectionByConnectionId(connectionId: string): ReturnType<IBaseModel<IUserSession>['updateMany']>;
	findByInstanceId(instanceId: string): FindCursor<IUserSession>;
	addConnectionById(
		userId: string,
		{ id, instanceId, status }: Pick<IUserSessionConnection, 'id' | 'instanceId' | 'status'>,
	): ReturnType<IBaseModel<IUserSession>['updateOne']>;
	findByOtherInstanceIds(instanceIds: string[], options?: FindOptions<IUserSession>): FindCursor<IUserSession>;
	removeConnectionsFromOtherInstanceIds(instanceIds: string[]): ReturnType<IBaseModel<IUserSession>['updateMany']>;
}
