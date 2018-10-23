const checkPermission = (userId, permissionId, scope) => {
	const permission = RocketChat.models.Permissions.findOne(permissionId);
	return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
};

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
	return strategy(userId, [].concat(permissions), scope);
}

RocketChat.authz.hasAllPermission = function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, all);
};

RocketChat.authz.hasPermission = (userId, permission, scope) => {
	if (!userId) {
		return false;
	}
	return checkPermission(userId, permission, scope);
};

RocketChat.authz.hasAtLeastOnePermission = function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, atLeastOne);
};
