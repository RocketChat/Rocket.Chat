import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/rocketchat:models';
import { settings } from 'meteor/rocketchat:settings';
import { Notifications } from 'meteor/rocketchat:notifications';
import { hasPermission } from '../functions/hasPermission';

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
			Notifications.notifyLogged('roles-change', {
				type: 'changed',
				_id: roleData.name,
			});
		}

		return update;
	},
});
