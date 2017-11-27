/* globals ChatPermissions */

function atLeastOne(permissions = [], scope) {
	return permissions.some((permissionId) => {
		const permission = ChatPermissions.findOne(permissionId);
		const roles = (permission && permission.roles) || [];

		return roles.some((roleName) => {
			const role = RocketChat.models.Roles.findOne(roleName);
			const roleScope = role && role.scope;
			const model = RocketChat.models[roleScope];

			return model && model.isUserInRole && model.isUserInRole(Meteor.userId(), roleName, scope);
		});
	});
}

function all(permissions = [], scope) {
	return permissions.every((permissionId) => {
		const permission = ChatPermissions.findOne(permissionId);
		const roles = (permission && permission.roles) || [];

		return roles.some((roleName) => {
			const role = RocketChat.models.Roles.findOne(roleName);
			const roleScope = role && role.scope;
			const model = RocketChat.models[roleScope];

			return model && model.isUserInRole && model.isUserInRole(Meteor.userId(), roleName, scope);
		});
	});
}

function hasPermission(permissions, scope, strategy) {
	const userId = Meteor.userId();
	if (!userId) {
		return false;
	}

	if (!RocketChat.authz.cachedCollection.ready.get()) {
		return false;
	}

	permissions = [].concat(permissions);
	return strategy(permissions, scope);
}

Template.registerHelper('hasPermission', function(permission, scope) {
	return hasPermission(permission, scope, atLeastOne);
});

RocketChat.authz.hasAllPermission = function(permissions, scope) {
	return hasPermission(permissions, scope, all);
};

RocketChat.authz.hasAtLeastOnePermission = function(permissions, scope) {
	return hasPermission(permissions, scope, atLeastOne);
};

