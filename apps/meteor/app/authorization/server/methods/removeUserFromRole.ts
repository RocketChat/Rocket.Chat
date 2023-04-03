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
		'authorization:removeUserFromRole'(roleId: IRole['_id'], username: IUser['username'], scope: undefined): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	async 'authorization:removeUserFromRole'(roleId, username, scope) {
		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'access-permissions'))) {
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

		let role = await Roles.findOneById<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });
		if (!role) {
			role = await Roles.findOneByName<Pick<IRole, '_id'>>(roleId, { projection: { _id: 1 } });
			if (!role) {
				throw new Meteor.Error('error-invalid-role', 'Invalid Role', {
					method: 'authorization:removeUserFromRole',
				});
			}

			apiDeprecationLogger.warn(
				`Calling authorization:removeUserFromRole with role names will be deprecated in future versions of Rocket.Chat`,
			);
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
			const adminCount = Meteor.users
				.find({
					roles: {
						$in: ['admin'],
					},
				})
				.count();

			const userIsAdmin = user.roles?.indexOf('admin') > -1;
			if (adminCount === 1 && userIsAdmin) {
				throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
					method: 'removeUserFromRole',
					action: 'Remove_last_admin',
				});
			}
		}

		const remove = await Roles.removeUserRoles(user._id, [role._id], scope);
		const event = {
			type: 'removed',
			_id: role._id,
			u: {
				_id: user._id,
				username,
			},
			scope,
		};
		if (settings.get('UI_DisplayRoles')) {
			void api.broadcast('user.roleUpdate', event);
		}
		void api.broadcast('federation.userRoleChanged', { ...event, givenByUserId: userId });

		return remove;
	},
});
