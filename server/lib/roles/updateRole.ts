import type { IRole } from '../../../definition/IRole';
import { Roles } from '../../../app/models/server/raw';
import { DetailedError } from '../../../lib/utils/DetailedError';
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
		throw new DetailedError('error-invalid-roleId', 'This role does not exist');
	}

	if (role.protected && ((roleData.name && roleData.name !== role.name) || (roleData.scope && roleData.scope !== role.scope))) {
		throw new DetailedError('error-role-protected', 'Role is protected');
	}

	if (roleData.name) {
		const otherRole = await Roles.findOneByName(roleData.name, { projection: { _id: 1 } });
		if (otherRole && otherRole._id !== role._id) {
			throw new DetailedError('error-duplicate-role-names-not-allowed', 'Role name already exists');
		}
	} else {
		roleData.name = role.name;
	}

	if (roleData.scope) {
		if (!isValidRoleScope(roleData.scope)) {
			throw new DetailedError('error-invalid-scope', 'Invalid scope');
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

	const newRole = await Roles.findOneById(roleId);
	if (!newRole) {
		throw new DetailedError('error-role-not-found', 'Role not found');
	}

	return newRole;
};

export const updateRole = (...args: Parameters<typeof updateRoleAsync>): IRole => Promise.await(updateRoleAsync(...args));
