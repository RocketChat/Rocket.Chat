import { api, ClientSafeError } from '@rocket.chat/core-services';
import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Roles, Users } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { addUserRolesAsync } from '../../lib/roles/addUserRoles';
import { settings } from '../../settings';

export const addUserToRole = async (userId: string, roleId: string, username: IUser['username'], scope?: string): Promise<boolean> => {
	if (!(await hasPermissionAsync(userId, 'access-permissions'))) {
		throw new ClientSafeError('error-action-not-allowed', 'Accessing permissions is not allowed', {
			method: 'authorization:addUserToRole',
			action: 'Accessing_permissions',
		});
	}

	if (!roleId || typeof roleId.valueOf() !== 'string' || !username || typeof username.valueOf() !== 'string') {
		throw new ClientSafeError('error-invalid-arguments', 'Invalid arguments', {
			method: 'authorization:addUserToRole',
		});
	}

	const role = await Roles.findOneById<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });

	if (!role) {
		throw new ClientSafeError('error-invalid-role', 'Invalid Role', {
			method: 'authorization:addUserToRole',
		});
	}

	if (role._id === 'admin' && !(await hasPermissionAsync(userId, 'assign-admin-role'))) {
		throw new ClientSafeError('error-action-not-allowed', 'Assigning admin is not allowed', {
			method: 'authorization:addUserToRole',
			action: 'Assign_admin',
		});
	}

	const user = await Users.findOneByUsernameIgnoringCase(username, {
		projection: {
			_id: 1,
		},
	});

	if (!user?._id) {
		throw new ClientSafeError('error-user-not-found', 'User not found', {
			method: 'authorization:addUserToRole',
		});
	}

	// verify if user can be added to given scope
	if (scope && !(await Roles.canAddUserToRole(user._id, role._id, scope))) {
		throw new ClientSafeError('error-invalid-user', 'User is not part of given room', {
			method: 'authorization:addUserToRole',
		});
	}

	const add = await addUserRolesAsync(user._id, [role._id], scope);

	if (settings.get('UI_DisplayRoles')) {
		void api.broadcast('user.roleUpdate', {
			type: 'added',
			_id: role._id,
			u: {
				_id: user._id,
				username,
			},
			scope,
		});
	}

	return add;
};
