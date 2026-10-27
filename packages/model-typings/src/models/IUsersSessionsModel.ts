import type { IUserSession, IUserSessionConnection } from '@rocket.chat/core-typings';
import type { FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IUsersSessionsModel extends IBaseModel<IUserSession> {
	updateConnectionStatusById(uid: string, connectionId: string, status: string): ReturnType<IBaseModel<IUserSession>['updateOne']>;
	removeConnectionsFromInstanceId(instanceId: string): ReturnType<IBaseModel<IUserSession>['updateMany']>;
	removeConnectionByConnectionId(connectionId: string): ReturnType<IBaseModel<IUserSession>['updateMany']>;
	findByInstanceId(instanceId: string): FindCursor<IUserSession>;
	addConnectionById(
		userId: string,
		{ id, instanceId, status }: Pick<IUserSessionConnection, 'id' | 'instanceId' | 'status'>,
	): ReturnType<IBaseModel<IUserSession>['updateOne']>;
	findByOtherInstanceIds<T extends Document = IUserSession, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		instanceIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	removeConnectionsFromOtherInstanceIds(instanceIds: string[]): ReturnType<IBaseModel<IUserSession>['updateMany']>;
}
