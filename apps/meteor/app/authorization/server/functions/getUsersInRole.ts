import { FindCursor, FindOptions } from 'mongodb';
import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

export function getUsersInRole(roleId: IRole['_id'], scope?: string): Promise<FindCursor<IUser>>;

export function getUsersInRole(roleId: IRole['_id'], scope: string | undefined, options: FindOptions<IUser>): Promise<FindCursor<IUser>>;

export function getUsersInRole<P = IUser>(
	roleId: IRole['_id'],
	scope: string | undefined,
	options: FindOptions<P extends IUser ? IUser : P>,
): Promise<FindCursor<P extends IUser ? IUser : P>>;

export function getUsersInRole<P = IUser>(
	roleId: IRole['_id'],
	scope: string | undefined,
	options?: any | undefined,
): Promise<FindCursor<IUser | P>> {
	return Roles.findUsersInRole(roleId, scope, options);
}
