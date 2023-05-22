import { Meteor } from 'meteor/meteor';
import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Roles, Users } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { settings } from '../../../settings/server';
import { hasPermissionAsync } from '../functions/hasPermission';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'authorization:addUserToRole'(roleId: IRole['_id'], username: IUser['username'], scope: string | undefined): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:addUserToRole'(roleId: IRole['_id'], username: IUser['username'], scope) {
		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'access-permissions'))) {
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

			apiDeprecationLogger.warn(`Calling authorization:addUserToRole with role names will be deprecated in future versions of Rocket.Chat`);
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

		const add = await Roles.addUserRoles(user._id, [role._id], scope);

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
	},
});
