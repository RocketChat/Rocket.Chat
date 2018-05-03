function atLeastOne(userId, permissions = [], scope) {
	return permissions.some((permissionId) => {
		const permission = RocketChat.models.Permissions.findOne(permissionId);
		return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
	});
}

function all(userId, permissions = [], scope) {
	return permissions.every((permissionId) => {
		const permission = RocketChat.models.Permissions.findOne(permissionId);
		return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
	});
}

function hasPermission(userId, permissions, scope, strategy) {
	if (!userId) {
		return false;
	}

	permissions = [].concat(permissions);
	return strategy(userId, permissions, scope);
}

RocketChat.authz.hasAllPermission = function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, all);
};

RocketChat.authz.hasPermission = RocketChat.authz.hasAllPermission;

RocketChat.authz.hasAtLeastOnePermission = function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, atLeastOne);
};
