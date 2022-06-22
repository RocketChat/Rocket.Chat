import type { FindOneOptions, Cursor, UpdateWriteOpResult, WithoutProjection } from 'mongodb';
import type { ISubscription, IRole, IUser, IRoom } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ISubscriptionsModel extends IBaseModel<ISubscription> {
	getBadgeCount(uid: string): Promise<number>;

	findOneByRoomIdAndUserId(rid: string, uid: string, options?: FindOneOptions<ISubscription>): Promise<ISubscription | null>;

	findByUserIdAndRoomIds(userId: string, roomIds: Array<string>, options?: FindOneOptions<ISubscription>): Cursor<ISubscription>;

	findByRoomIdAndNotUserId(roomId: string, userId: string, options?: FindOneOptions<ISubscription>): Cursor<ISubscription>;

	findByLivechatRoomIdAndNotUserId(roomId: string, userId: string, options?: FindOneOptions<ISubscription>): Cursor<ISubscription>;

	countByRoomIdAndUserId(rid: string, uid: string | undefined): Promise<number>;

	isUserInRole(uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']): Promise<ISubscription | null>;

	setAsReadByRoomIdAndUserId(
		rid: string,
		uid: string,
		alert?: boolean,
		options?: FindOneOptions<ISubscription>,
	): ReturnType<IBaseModel<ISubscription>['update']>;

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid: IRoom['_id']): Promise<UpdateWriteOpResult>;

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined): Promise<Cursor<IUser>>;

	findUsersInRoles(
		roles: IRole['_id'][],
		rid: string | undefined,
		options: WithoutProjection<FindOneOptions<IUser>>,
	): Promise<Cursor<IUser>>;

	findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: string | undefined,
		options: FindOneOptions<P extends IUser ? IUser : P>,
	): Promise<Cursor<P>>;

	findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: IRoom['_id'] | undefined,
		options?: FindOneOptions<P extends IUser ? IUser : P>,
	): Promise<Cursor<P>>;

	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid?: IRoom['_id']): Promise<UpdateWriteOpResult>;

	isUserInRoleScope(uid: IUser['_id'], rid?: IRoom['_id']): Promise<boolean>;
}
