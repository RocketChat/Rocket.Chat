import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Roles } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Notifications } from '../../../notifications/server';
import { hasPermission } from '../functions/hasPermission';

Meteor.methods({
	'authorization:removeUserFromRole'(roleName, username, scope) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Access permissions is not allowed', {
				method: 'authorization:removeUserFromRole',
				action: 'Accessing_permissions',
			});
		}

		if (!roleName || !_.isString(roleName) || !username || !_.isString(username)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
				method: 'authorization:removeUserFromRole',
			});
		}

		const user = Meteor.users.findOne({
			username,
		}, {
			fields: {
				_id: 1,
				roles: 1,
			},
		});

		if (!user || !user._id) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'authorization:removeUserFromRole',
			});
		}

		// prevent removing last user from admin role
		if (roleName === 'admin') {
			const adminCount = Meteor.users.find({
				roles: {
					$in: ['admin'],
				},
			}).count();

			const userIsAdmin = user.roles.indexOf('admin') > -1;
			if (adminCount === 1 && userIsAdmin) {
				throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
					method: 'removeUserFromRole',
					action: 'Remove_last_admin',
				});
			}
		}

		const remove = Roles.removeUserRoles(user._id, roleName, scope);
		if (settings.get('UI_DisplayRoles')) {
			Notifications.notifyLogged('roles-change', {
				type: 'removed',
				_id: roleName,
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
