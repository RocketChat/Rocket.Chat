Meteor.methods({
	'authorization:addPermissionToRole'(permission, role) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
				method: 'authorization:addPermissionToRole',
				action: 'Loading...'
			});
		}

		return RocketChat.models.Permissions.addRole(permission, role);
	}
});
