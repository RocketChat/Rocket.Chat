import type { IRole, IUser, IRoom } from '@rocket.chat/core-typings';

import { Users, Roles } from '../../../app/models/server/raw';
import { validateRoleList } from './validateRoleList';
import { MeteorError } from '../../sdk/errors';

export const removeUserFromRolesAsync = async (userId: IUser['_id'], roleIds: IRole['_id'][], scope?: IRoom['_id']): Promise<boolean> => {
	if (!userId || !roleIds) {
		return false;
	}

	const user = await Users.findOneById(userId, { projection: { _id: 1 } });
	if (!user) {
		throw new MeteorError('error-invalid-user', 'Invalid user');
	}

	if (!(await validateRoleList(roleIds))) {
		throw new MeteorError('error-invalid-role', 'Invalid role');
	}

	await Roles.removeUserRoles(userId, roleIds, scope);
	return true;
};

export const removeUserFromRoles = (...args: Parameters<typeof removeUserFromRolesAsync>): boolean =>
	Promise.await(removeUserFromRolesAsync(...args));
