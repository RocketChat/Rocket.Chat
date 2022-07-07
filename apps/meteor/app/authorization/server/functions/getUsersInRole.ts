import { FindCursor, FindOptions } from 'mongodb';
import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Roles, Subscriptions, Users } from '@rocket.chat/models';
import { FindPaginated } from '@rocket.chat/model-typings';
import { compact } from 'lodash';

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
	// TODO move the code from Roles.findUsersInRole to here and change all places to use this function
	return Roles.findUsersInRole(roleId, scope, options);
}

export async function getUsersInRolePaginated(
	roleId: IRole['_id'],
	scope: string | undefined,
	options?: any | undefined,
): Promise<FindPaginated<FindCursor<IUser>>> {
	if (process.env.NODE_ENV === 'development' && (scope === 'Users' || scope === 'Subscriptions')) {
		throw new Error('Roles.findUsersInRole method received a role scope instead of a scope value.');
	}

	const role = await Roles.findOneById<Pick<IRole, '_id' | 'scope'>>(roleId, { projection: { scope: 1 } });
	if (!role) {
		throw new Error('role not found');
	}

	switch (role.scope) {
		case 'Subscriptions':
			const subscriptions = await Subscriptions.findByRolesAndRoomId({ roles: role._id, rid: scope }, { projection: { 'u._id': 1 } })
				.map((subscription) => subscription.u?._id)
				.toArray();

			return Users.findPaginated({ _id: { $in: compact(subscriptions) } }, options || {});
		case 'Users':
		default:
			return Users.findPaginatedUsersInRoles([role._id], options);
	}
}
