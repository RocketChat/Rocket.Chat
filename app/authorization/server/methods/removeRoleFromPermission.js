import { Meteor } from 'meteor/meteor';
import { Permissions } from '/app/models';
import { hasPermission } from '../functions/hasPermission';

Meteor.methods({
	'authorization:removeRoleFromPermission'(permission, role) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:removeRoleFromPermission',
				action: 'Accessing_permissions',
			});
		}

		return Permissions.removeRole(permission, role);
	},
});
