import _ from 'underscore';

import { DetailedError } from '../../../lib/utils/DetailedError';
import type { IRole, IUser } from '../../../definition/IUser';
import type { IRoom } from '../../../definition/IRoom';
import { Users, Roles } from '../../../app/models/server/raw';

export const removeUserFromRolesAsync = async (userId: IUser['_id'], roleIds: IRole['_id'][], scope: IRoom['_id']): Promise<boolean> => {
	if (!userId || !roleIds) {
		return false;
	}

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new DetailedError('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.authz.removeUserFromRoles',
		});
	}

	// if (!Array.isArray(roleids)) {
	// 	// TODO: remove this check
	// 	roleIds = [roleIds];
	// }

	const options = {
		projection: {
			_id: 1,
		},
	};

	const existingRoles = await Roles.findAllExceptIds<Pick<IRole, '_id'>>(roleIds, options).toArray();
	const existingRoleIds = _.pluck(existingRoles, '_id');
	const invalidRoleIds = _.difference(roleIds, existingRoleIds);

	if (invalidRoleIds.length) {
		throw new DetailedError('error-invalid-role', 'Invalid role', {
			function: 'RocketChat.authz.removeUserFromRoles',
		});
	}

	await Roles.removeUserRoles(userId, roleIds, scope);
	return true;
};

export const removeUserFromRoles = (...args: Parameters<typeof removeUserFromRolesAsync>): boolean =>
	Promise.await(removeUserFromRolesAsync(...args));
