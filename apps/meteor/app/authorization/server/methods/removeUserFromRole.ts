import { api } from '@rocket.chat/core-services';
import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Roles, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { removeUserFromRolesAsync } from '../../../../server/lib/roles/removeUserFromRoles';
import { settings } from '../../../settings/server';
import { hasPermissionAsync } from '../functions/hasPermission';

export const removeUserFromRole = async (userId: string, roleId: string, username: IUser['username'], scope?: string): Promise<boolean> => {
	if (!(await hasPermissionAsync(userId, 'access-permissions'))) {
		throw new Meteor.Error('error-action-not-allowed', 'Access permissions is not allowed', {
			method: 'authorization:removeUserFromRole',
			action: 'Accessing_permissions',
		});
	}

	if (!roleId || typeof roleId.valueOf() !== 'string' || !username || typeof username.valueOf() !== 'string') {
		throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
			method: 'authorization:removeUserFromRole',
		});
	}

	const role = await Roles.findOneById<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });
	if (!role) {
		throw new Meteor.Error('error-invalid-role', 'Invalid Role', {
			method: 'authorization:removeUserFromRole',
		});
	}

	const user = await Users.findOneByUsernameIgnoringCase(username, {
		projection: {
			_id: 1,
			roles: 1,
		},
	});

	if (!user?._id) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'authorization:removeUserFromRole',
		});
	}

	// prevent removing last user from admin role
	if (role._id === 'admin') {
		const adminCount = await Users.countDocuments({
			roles: {
				$in: ['admin'],
			},
		});

		const userIsAdmin = user.roles?.indexOf('admin') > -1;
		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'removeUserFromRole',
				action: 'Remove_last_admin',
			});
		}
	}

	const remove = await removeUserFromRolesAsync(user._id, [role._id], scope);
	const event = {
		type: 'removed',
		_id: role._id,
		u: {
			_id: user._id,
			username,
		},
		scope,
	} as const;
	if (settings.get('UI_DisplayRoles')) {
		void api.broadcast('user.roleUpdate', event);
	}
	void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: userId });

	return remove;
};
