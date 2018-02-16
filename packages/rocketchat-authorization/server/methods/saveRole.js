Meteor.methods({
	'authorization:saveRole'(roleData) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:saveRole',
				action: 'Accessing_permissions'
			});
		}

		if (!roleData.name) {
			throw new Meteor.Error('error-role-name-required', 'Role name is required', {
				method: 'authorization:saveRole'
			});
		}

		if (['Users', 'Subscriptions'].includes(roleData.scope) === false) {
			roleData.scope = 'Users';
		}

		const update = RocketChat.models.Roles.createOrUpdate(roleData.name, roleData.scope, roleData.description, false, roleData.mandatory2fa);
		if (RocketChat.settings.get('UI_DisplayRoles')) {
			RocketChat.Notifications.notifyLogged('roles-change', {
				type: 'changed',
				_id: roleData.name
			});
		}

		return update;
	}
});
