import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, CountDocumentsOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IRolesModel extends IBaseModel<IRole> {
	findByUpdatedDate(updatedAfterDate: Date, options?: FindOptions<IRole>): FindCursor<IRole>;
	isUserInRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean>;
	findOneByIdOrName(_idOrName: IRole['_id'] | IRole['name'], options?: undefined): Promise<IRole | null>;

	findOneByIdOrName(_idOrName: IRole['_id'] | IRole['name'], options: FindOptions<IRole>): Promise<IRole | null>;

	findOneByIdOrName<P extends Document>(
		_idOrName: IRole['_id'] | IRole['name'],
		options: FindOptions<P extends IRole ? IRole : P>,
	): Promise<P | null>;

	findOneByIdOrName<P>(_idOrName: IRole['_id'] | IRole['name'], options?: any): Promise<IRole | P | null>;
	findOneByName<P = IRole>(name: IRole['name'], options?: any): Promise<IRole | P | null>;
	findInIds<P>(ids: IRole['_id'][], options?: FindOptions<IRole>): P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole>;
	findInIdsOrNames<P>(
		_idsOrNames: IRole['_id'][] | IRole['name'][],
		options?: FindOptions<IRole>,
	): P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole>;
	findAllExceptIds<P>(ids: IRole['_id'][], options?: FindOptions<IRole>): P extends Pick<IRole, '_id'> ? FindCursor<P> : FindCursor<IRole>;
	findByScope(scope: IRole['scope'], options?: FindOptions<IRole>): FindCursor<IRole>;
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
	findUsersInRole<P>(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options?: any | undefined,
	): Promise<FindCursor<IUser> | FindCursor<P>>;

	findCustomRoles(options?: FindOptions<IRole>): FindCursor<IRole>;

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
