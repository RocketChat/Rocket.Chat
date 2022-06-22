import type { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IRolesModel extends IBaseModel<IRole> {
	findByUpdatedDate(updatedAfterDate: Date, options?: FindOneOptions<IRole>): Cursor<IRole>;
	addUserRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean>;
	isUserInRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean>;
	removeUserRoles(userId: IUser['_id'], roles: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean>;
	findOneByIdOrName(_idOrName: IRole['_id'] | IRole['name'], options?: undefined): Promise<IRole | null>;

	findOneByIdOrName(_idOrName: IRole['_id'] | IRole['name'], options: WithoutProjection<FindOneOptions<IRole>>): Promise<IRole | null>;

	findOneByIdOrName<P>(_idOrName: IRole['_id'] | IRole['name'], options: FindOneOptions<P extends IRole ? IRole : P>): Promise<P | null>;

	findOneByIdOrName<P>(_idOrName: IRole['_id'] | IRole['name'], options?: any): Promise<IRole | P | null>;
	findOneByName<P = IRole>(name: IRole['name'], options?: any): Promise<IRole | P | null>;
	findInIds<P>(ids: IRole['_id'][], options?: FindOneOptions<IRole>): P extends Pick<IRole, '_id'> ? Cursor<P> : Cursor<IRole>;
	findAllExceptIds<P>(ids: IRole['_id'][], options?: FindOneOptions<IRole>): P extends Pick<IRole, '_id'> ? Cursor<P> : Cursor<IRole>;
	updateById(
		_id: IRole['_id'],
		name: IRole['name'],
		scope: IRole['scope'],
		description?: IRole['description'],
		mandatory2fa?: IRole['mandatory2fa'],
	): Promise<UpdateWriteOpResult>;
	findUsersInRole(roleId: IRole['_id'], scope?: IRoom['_id']): Promise<Cursor<IUser>>;

	findUsersInRole(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options: WithoutProjection<FindOneOptions<IUser>>,
	): Promise<Cursor<IUser>>;

	findUsersInRole<P>(
		roleId: IRole['_id'],
		scope: IRoom['_id'] | undefined,
		options: FindOneOptions<P extends IUser ? IUser : P>,
	): Promise<Cursor<P extends IUser ? IUser : P>>;

	findUsersInRole<P>(roleId: IRole['_id'], scope: IRoom['_id'] | undefined, options?: any | undefined): Promise<Cursor<IUser> | Cursor<P>>;

	createWithRandomId(
		name: IRole['name'],
		scope?: IRole['scope'],
		description?: string,
		protectedRole?: boolean,
		mandatory2fa?: boolean,
	): Promise<InsertOneWriteOpResult<WithId<IRole>>>;

	canAddUserToRole(uid: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id']): Promise<boolean>;
}
