import type { IUser, IRole, IRoom } from '@rocket.chat/core-typings';

import { Roles } from '../../models/client';

export const hasRole = (userId: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id'], ignoreSubscriptions = false): boolean => {
	if (Array.isArray(roleId)) {
		throw new Error('error-invalid-arguments');
	}

	return Roles.isUserInRoles(userId, [roleId], scope, ignoreSubscriptions);
};

export const hasAnyRole = (userId: IUser['_id'], roleIds: IRole['_id'][], scope?: IRoom['_id'], ignoreSubscriptions = false): boolean => {
	if (!Array.isArray(roleIds)) {
		throw new Error('error-invalid-arguments');
	}

	return Roles.isUserInRoles(userId, roleIds, scope, ignoreSubscriptions);
};
