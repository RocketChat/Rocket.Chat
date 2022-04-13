import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import type { IRole, IUser } from '@rocket.chat/core-typings';

import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { hasPermission } from '../functions/hasPermission';
import { api } from '../../../../server/sdk/api';
import { Roles } from '../../../models/server/raw';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'authorization:removeUserFromRole'(roleId, username, scope) {
		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Access permissions is not allowed', {
				method: 'authorization:removeUserFromRole',
				action: 'Accessing_permissions',
			});
		}

		if (!roleId || !_.isString(roleId) || !username || !_.isString(username)) {
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

		const user = Users.findOneByUsernameIgnoringCase(username, {
			fields: {
				_id: 1,
				roles: 1,
			},
		}) as Pick<IUser, '_id' | 'roles'>;

		if (!user || !user._id) {
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
		if (settings.get('UI_DisplayRoles')) {
			api.broadcast('user.roleUpdate', {
				type: 'removed',
				_id: role._id,
				u: {
					_id: user._id,
					username,
				},
				scope,
			});
		}

		return remove;
	},
});
