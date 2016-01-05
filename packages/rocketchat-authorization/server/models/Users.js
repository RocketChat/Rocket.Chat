RocketChat.models.Users.findRolesByUserId = function(userId, options) {
	query = {
		_id: userId
	};

	if ("object" !== typeof options) {
		options = {}
	}

	options.fields = { roles: 1 }

	return this.find(query, options);
};
