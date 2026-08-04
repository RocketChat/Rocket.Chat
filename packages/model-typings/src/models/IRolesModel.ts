import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, CountDocumentsOptions, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IRolesModel extends IBaseModel<IRole> {
	findByUpdatedDate<T extends Document = IRole, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		updatedAfterDate: Date,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	isUserInRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean>;
	findOneByIdOrName<P extends Document = IRole, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_idOrName: IRole['_id'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;
	findOneByName<P = IRole>(name: IRole['name'], options?: any): Promise<IRole | P | null>;
	findInIds<P>(ids: IRole['_id'][], options?: FindOptions<IRole>): P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole>;
	findInIdsOrNames<P>(
		_idsOrNames: IRole['_id'][],
		options?: FindOptions<IRole>,
	): P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole>;
	findByScope<T extends Document = IRole, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		scope: IRole['scope'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	updateById(
		_id: IRole['_id'],
		name: IRole['name'],
		scope: IRole['scope'],
		description?: IRole['description'],
		mandatory2fa?: IRole['mandatory2fa'],
	): Promise<IRole>;
	findUsersInRole(roleId: IRole['_id'], scope?: IRoom['_id']): Promise<FindCursor<IUser>>;

	findUsersInRole(roleId: IRole['_id'], scope: IRoom['_id'] | undefined, options: FindOptions<IUser>): Promise<FindCursor<IUser>>;

	findUsersInRole<P extends Document>(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options: FindOptions<P extends IUser ? IUser : P>,
	): Promise<FindCursor<P extends IUser ? IUser : P>>;

	/** @deprecated function getUsersInRole should be used instead */
	findUsersInRole<P>(roleId: IRole['_id'], scope: IRoom['_id'] | undefined, options?: any): Promise<FindCursor<IUser> | FindCursor<P>>;

	findCustomRoles<T extends Document = IRole, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	createWithRandomId(
		name: IRole['name'],
		scope?: IRole['scope'],
		description?: string,
		protectedRole?: boolean,
		mandatory2fa?: boolean,
	): Promise<IRole>;

	canAddUserToRole(uid: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id']): Promise<boolean>;
	countUsersInRole(roleId: IRole['_id'], scope?: IRoom['_id']): Promise<number>;
	countByScope(scope: IRole['scope'], options?: CountDocumentsOptions): Promise<number>;
	countCustomRoles(options?: CountDocumentsOptions): Promise<number>;
}
