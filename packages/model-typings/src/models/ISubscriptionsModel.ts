import type { FindOptions, FindCursor, UpdateResult, DeleteResult, Document, AggregateOptions } from 'mongodb';
import type { ISubscription, IRole, IUser, IRoom, RoomType, SpotlightUser } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ISubscriptionsModel extends IBaseModel<ISubscription> {
	getBadgeCount(uid: string): Promise<number>;

	findOneByRoomIdAndUserId(rid: string, uid: string, options?: FindOptions<ISubscription>): Promise<ISubscription | null>;

	findByUserIdAndRoomIds(userId: string, roomIds: Array<string>, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByRoomId(roomId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByRoomIdAndNotUserId(roomId: string, userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByLivechatRoomIdAndNotUserId(roomId: string, userId: string, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	countByRoomIdAndUserId(rid: string, uid: string | undefined): Promise<number>;

	isUserInRole(uid: IUser['_id'], roleId: IRole['_id'], rid?: IRoom['_id']): Promise<ISubscription | null>;

	setAsReadByRoomIdAndUserId(
		rid: string,
		uid: string,
		alert?: boolean,
		options?: FindOptions<ISubscription>,
	): ReturnType<IBaseModel<ISubscription>['update']>;

	removeRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid: IRoom['_id']): Promise<UpdateResult>;

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined): Promise<FindCursor<IUser>>;

	findUsersInRoles(roles: IRole['_id'][], rid: string | undefined, options: FindOptions<IUser>): Promise<FindCursor<IUser>>;

	findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: string | undefined,
		options: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P>>;

	findUsersInRoles<P = IUser>(
		roles: IRole['_id'][],
		rid: IRoom['_id'] | undefined,
		options?: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P>>;

	addRolesByUserId(uid: IUser['_id'], roles: IRole['_id'][], rid?: IRoom['_id']): Promise<UpdateResult>;

	isUserInRoleScope(uid: IUser['_id'], rid?: IRoom['_id']): Promise<boolean>;

	updateAllRoomTypesByRoomId(roomId: IRoom['_id'], roomType: RoomType): Promise<void>;

	updateAllRoomNamesByRoomId(roomId: IRoom['_id'], name: string, fname: string): Promise<void>;

	findByRolesAndRoomId({ roles, rid }: { roles: string; rid?: string }, options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	findByUserIdAndTypes(userId: string, types: ISubscription['t'][], options?: FindOptions<ISubscription>): FindCursor<ISubscription>;

	removeByRoomId(roomId: string): Promise<DeleteResult>;

	findConnectedUsersExcept(
		userId: string,
		searchTerm: string,
		exceptions: string[],
		searchFields: string[],
		limit: number,
		roomType?: ISubscription['t'],
		{ startsWith, endsWith }?: { startsWith?: string | false; endsWith?: string | false },
		options?: AggregateOptions,
	): Promise<SpotlightUser[]>;

	incUnreadForRoomIdExcludingUserIds(roomId: IRoom['_id'], userIds: IUser['_id'][], inc: number): Promise<UpdateResult | Document>;

	setAlertForRoomIdExcludingUserId(roomId: IRoom['_id'], userId: IUser['_id']): Promise<UpdateResult | Document>;

	setOpenForRoomIdExcludingUserId(roomId: IRoom['_id'], userId: IUser['_id']): Promise<UpdateResult | Document>;
}
