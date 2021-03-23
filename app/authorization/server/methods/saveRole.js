import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../models/server';
import { settings } from '../../../settings/server';
import { hasPermission } from '../functions/hasPermission';
import { api } from '../../../../server/sdk/api';
import { getRoles } from '../functions/getRoles';

Meteor.methods({
	'authorization:saveRole'(roleData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:saveRole',
				action: 'Accessing_permissions',
			});
		}

		if (!roleData.name) {
			throw new Meteor.Error('error-role-name-required', 'Role name is required', {
				method: 'authorization:saveRole',
			});
		}
		const roles = getRoles();

		if (roles.some((role) => role.name === roleData.name.toLowerCase())) {
			throw new Meteor.Error('error-role-already-present', 'Role is already present', {
				method: 'authorization:saveRole',
			});
		}

		if (['Users', 'Subscriptions'].includes(roleData.scope) === false) {
			roleData.scope = 'Users';
		}

		const update = Roles.createOrUpdate(roleData.name, roleData.scope, roleData.description, false, roleData.mandatory2fa);
		if (settings.get('UI_DisplayRoles')) {
			api.broadcast('user.roleUpdate', {
				type: 'changed',
				_id: roleData.name,
			});
		}
		return update;
	},
});
