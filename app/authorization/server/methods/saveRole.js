import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../models/server';
import { settings } from '../../../settings/server';
import { hasPermission } from '../functions/hasPermission';
import { api } from '../../../../server/sdk/api';

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
