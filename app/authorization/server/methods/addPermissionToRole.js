import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../../models/server';

import { hasPermission } from '..';

Meteor.methods({
	'authorization:addPermissionToRole'(permission, role) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
				method: 'authorization:addPermissionToRole',
				action: 'Adding_permission',
			});
		}

		return Permissions.addRole(permission, role);
	},
});
