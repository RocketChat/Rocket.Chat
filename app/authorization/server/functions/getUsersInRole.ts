import { Cursor, FindOneOptions, WithoutProjection } from 'mongodb';

import { IRole, IUser } from '../../../../definition/IUser';
import { Roles } from '../../../models/server/raw';

export function getUsersInRole(name: IRole['name'], scope?: string): Promise<Cursor<IUser>>;

export function getUsersInRole(
	name: IRole['name'],
	scope: string | undefined,
	options: WithoutProjection<FindOneOptions<IUser>>,
): Promise<Cursor<IUser>>;

export function getUsersInRole<P = IUser>(
	name: IRole['name'],
	scope: string | undefined,
	options: FindOneOptions<P extends IUser ? IUser : P>,
): Promise<Cursor<P extends IUser ? IUser : P>>;

export function getUsersInRole<P = IUser>(
	name: IRole['name'],
	scope: string | undefined,
	options?: any | undefined,
): Promise<Cursor<IUser | P>> {
	return Roles.findUsersInRole(name, scope, options);
}
