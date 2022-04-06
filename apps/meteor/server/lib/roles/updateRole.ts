import type { IRole } from '@rocket.chat/core-typings';

import { Roles } from '../../../app/models/server/raw';
import { MeteorError } from '../../sdk/errors';
import { isValidRoleScope } from '../../../lib/roles/isValidRoleScope';
import { api } from '../../sdk/api';

type UpdateRoleOptions = {
	broadcastUpdate?: boolean;
};

export const updateRoleAsync = async (
	roleId: IRole['_id'],
	roleData: Omit<IRole, '_id'>,
	options: UpdateRoleOptions = {},
): Promise<IRole> => {
	const role = await Roles.findOneById(roleId);

	if (!role) {
		throw new MeteorError('error-invalid-roleId', 'This role does not exist');
	}

	if (role.protected && ((roleData.name && roleData.name !== role.name) || (roleData.scope && roleData.scope !== role.scope))) {
		throw new MeteorError('error-role-protected', 'Role is protected');
	}

	if (roleData.name) {
		const otherRole = await Roles.findOneByName(roleData.name, { projection: { _id: 1 } });
		if (otherRole && otherRole._id !== role._id) {
			throw new MeteorError('error-duplicate-role-names-not-allowed', 'Role name already exists');
		}
	} else {
		roleData.name = role.name;
	}

	if (roleData.scope) {
		if (!isValidRoleScope(roleData.scope)) {
			throw new MeteorError('error-invalid-scope', 'Invalid scope');
		}
	} else {
		roleData.scope = role.scope;
	}

	await Roles.updateById(roleId, roleData.name, roleData.scope, roleData.description, roleData.mandatory2fa);

	if (options.broadcastUpdate) {
		api.broadcast('user.roleUpdate', {
			type: 'changed',
			_id: roleId,
		});
	}

	const updatedRole = await Roles.findOneById(roleId);
	if (!updatedRole) {
		throw new MeteorError('error-role-not-found', 'Role not found');
	}

	return updatedRole;
};

export const updateRole = (...args: Parameters<typeof updateRoleAsync>): IRole => Promise.await(updateRoleAsync(...args));
