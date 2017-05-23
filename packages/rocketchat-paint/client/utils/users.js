Helpers.usernameById = function (userId) {
	var user = Users.findOne(userId);
	return (!!user) ? user.username : '...';
};

