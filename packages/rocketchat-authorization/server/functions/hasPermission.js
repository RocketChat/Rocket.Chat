import memoize from 'mem';
const CACHE_TTL = process.env.TEST_MODE ? 0 : 1000;
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

RocketChat.authz.hasAllPermission = memoize(function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, all);
}, { maxAge: CACHE_TTL });

RocketChat.authz.hasPermission = memoize(function(userId, permissionId, scope) {
	if (!userId) {
		return false;
	}
	const permission = RocketChat.models.Permissions.findOne(permissionId);
	return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
}, { maxAge: CACHE_TTL });

RocketChat.authz.hasAtLeastOnePermission = memoize(function(userId, permissions, scope) {
	return hasPermission(userId, permissions, scope, atLeastOne);
}, { maxAge: CACHE_TTL });
