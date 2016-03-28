RocketChat.models.Users.roleBaseQuery = function(userId) {
	return { _id: userId };
};

RocketChat.models.Users.findUsersInRoles = function(roles, scope, options) {
	roles = [].concat(roles);

	var query = {
		roles: { $in: roles }
	};

	return this.find(query, options);
};
