import { Roles, Permissions } from 'meteor/rocketchat:models';

function atLeastOne(userId, permissions = [], scope) {
	return permissions.some((permissionId) => {
		const permission = Permissions.findOne(permissionId);
		return Roles.isUserInRoles(userId, permission.roles, scope);
	});
}

function all(userId, permissions = [], scope) {
	return permissions.every((permissionId) => {
		const permission = Permissions.findOne(permissionId);
		return Roles.isUserInRoles(userId, permission.roles, scope);
	});
}

function _hasPermission(userId, permissions, scope, strategy) {
	if (!userId) {
		return false;
	}
	return strategy(userId, [].concat(permissions), scope);
}

export const hasAllPermission = RocketChat.memoize((userId, permissions, scope) => _hasPermission(userId, permissions, scope, all));

export const hasPermission = RocketChat.memoize((userId, permissionId, scope) => {
	if (!userId) {
		return false;
	}
	const permission = Permissions.findOne(permissionId);
	return Roles.isUserInRoles(userId, permission.roles, scope);
});

export const hasAtLeastOnePermission = RocketChat.memoize((userId, permissions, scope) => _hasPermission(userId, permissions, scope, atLeastOne));
