import { RocketChat } from 'meteor/rocketchat:lib';

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

RocketChat.authz.hasPermission = (userId, permissionId, scope) => {
	if (!userId) {
		return false;
	}
	const permission = RocketChat.models.Permissions.findOne(permissionId);
	return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
};

RocketChat.authz.hasAtLeastOnePermission = function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, atLeastOne);
};
