RocketChat.authz.getUsersInRole = function(roleName, scope, options) {
	return RocketChat.models.Roles.findUsersInRole(roleName, scope, options);
};
