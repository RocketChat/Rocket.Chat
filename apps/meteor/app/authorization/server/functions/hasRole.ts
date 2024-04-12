import type { IRole, IUser, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

export const hasAnyRoleAsync = async (
	userId: IUser['_id'],
	roleIds: IRole['_id'][],
	scope?: IRoom['_id'] | undefined,
): Promise<boolean> => {
	if (!Array.isArray(roleIds)) {
		throw new Error('error-invalid-arguments');
	}

	if (!userId || userId === '') {
		return false;
	}

	return Roles.isUserInRoles(userId, roleIds, scope);
};

export const hasRoleAsync = async (userId: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id'] | undefined): Promise<boolean> => {
	if (Array.isArray(roleId)) {
		throw new Error('error-invalid-arguments');
	}

	return hasAnyRoleAsync(userId, [roleId], scope);
};

export const subscriptionHasRole = (sub: ISubscription, role: IRole['_id']): boolean | undefined => sub.roles?.includes(role);
