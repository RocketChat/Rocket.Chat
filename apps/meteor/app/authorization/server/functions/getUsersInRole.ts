import { Cursor, FindOneOptions, WithoutProjection } from 'mongodb';
import type { IRole, IUser } from '@rocket.chat/core-typings';

import { Roles } from '../../../models/server/raw';

export function getUsersInRole(roleId: IRole['_id'], scope?: string): Promise<Cursor<IUser>>;

export function getUsersInRole(
	roleId: IRole['_id'],
	scope: string | undefined,
	options: WithoutProjection<FindOneOptions<IUser>>,
): Promise<Cursor<IUser>>;

export function getUsersInRole<P = IUser>(
	roleId: IRole['_id'],
	scope: string | undefined,
	options: FindOneOptions<P extends IUser ? IUser : P>,
): Promise<Cursor<P extends IUser ? IUser : P>>;

export function getUsersInRole<P = IUser>(
	roleId: IRole['_id'],
	scope: string | undefined,
	options?: any | undefined,
): Promise<Cursor<IUser | P>> {
	return Roles.findUsersInRole(roleId, scope, options);
}
