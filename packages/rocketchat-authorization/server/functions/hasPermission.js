import memoize from 'mem';
const CACHE_TTL = { maxAge: process.env.TEST_MODE ? 0 : 1000 };

const findPermission = memoize((permissionId) => RocketChat.models.Permissions.findOne(permissionId), CACHE_TTL);

function atLeastOne(userId, permissions = [], scope) {
	return permissions.some((permissionId) => {
		const permission = findPermission(permissionId);
		return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
	});
}

function all(userId, permissions = [], scope) {
	return permissions.every((permissionId) => {
		const permission = findPermission(permissionId);
		return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
	});
}

function hasPermission(userId, permissions, scope, strategy) {
	if (!userId) {
		return false;
	}
	return strategy(userId, [].concat(permissions), scope);
}

RocketChat.authz.hasAllPermission = memoize(function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, all);
}, CACHE_TTL);

RocketChat.authz.hasPermission = memoize(function(userId, permissionId, scope) {
	if (!userId) {
		return false;
	}
	const permission = findPermission(permissionId);
	return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
}, CACHE_TTL);

RocketChat.authz.hasAtLeastOnePermission = memoize(function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, atLeastOne);
}, CACHE_TTL);
