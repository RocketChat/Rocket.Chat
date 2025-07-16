import { api } from '@rocket.chat/core-services';
import type { IRole, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Roles, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { settings } from '../../../settings/server';
import { hasPermissionAsync } from '../functions/hasPermission';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:addUserToRole'(roleId: IRole['_id'], username: IUser['username'], scope: string | undefined): Promise<boolean>;
	}
}

export const addUserToRole = async (userId: string, roleId: string, username: IUser['username'], scope?: string): Promise<boolean> => {
	if (!(await hasPermissionAsync(userId, 'access-permissions'))) {
		throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
			method: 'authorization:addUserToRole',
			action: 'Accessing_permissions',
		});
	}

	if (!roleId || typeof roleId.valueOf() !== 'string' || !username || typeof username.valueOf() !== 'string') {
		throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
			method: 'authorization:addUserToRole',
		});
	}

	let role = await Roles.findOneById<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });
	if (!role) {
		role = await Roles.findOneByName<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });

		if (!role) {
			throw new Meteor.Error('error-invalid-role', 'Invalid Role', {
				method: 'authorization:addUserToRole',
			});
		}
		methodDeprecationLogger.deprecatedParameterUsage(
			'authorization:addUserToRole',
			'role',
			'7.0.0',
			({ parameter, method, version }) => `Calling ${method} with \`${parameter}\` names is deprecated and will be removed ${version}`,
		);
	}

	if (role._id === 'admin' && !(await hasPermissionAsync(userId, 'assign-admin-role'))) {
		throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
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
		throw new Meteor.Error('error-user-not-found', 'User not found', {
			method: 'authorization:addUserToRole',
		});
	}

	// verify if user can be added to given scope
	if (scope && !(await Roles.canAddUserToRole(user._id, role._id, scope))) {
		throw new Meteor.Error('error-invalid-user', 'User is not part of given room', {
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

Meteor.methods<ServerMethods>({
	async 'authorization:addUserToRole'(roleId: IRole['_id'], username: IUser['username'], scope) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:addUserToRole',
				action: 'Accessing_permissions',
			});
		}

		return addUserToRole(userId, roleId, username, scope);
	},
});
