import type { IRole, IUser } from '../../../../definition/IUser';
import type { IRoom } from '../../../../definition/IRoom';
import { Roles } from '../../../models/server/raw';
import { ISubscription } from '../../../../definition/ISubscription';

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

export const hasRole = (...args: Parameters<typeof hasRoleAsync>): boolean => Promise.await(hasRoleAsync(...args));

export const hasAnyRole = (...args: Parameters<typeof hasAnyRoleAsync>): boolean => Promise.await(hasAnyRoleAsync(...args));

export const subscriptionHasRole = (sub: ISubscription, role: IRole['_id']): boolean | undefined => sub.roles && sub.roles.includes(role);
