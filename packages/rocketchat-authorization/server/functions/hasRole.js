RocketChat.authz.hasRole = function(userId, roleNames, scope) {
	roleNames = [].concat(roleNames);
	return RocketChat.models.Roles.isUserInRoles(userId, roleNames, scope);
};
