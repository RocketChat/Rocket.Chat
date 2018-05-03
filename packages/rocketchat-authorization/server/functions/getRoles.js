RocketChat.authz.getRoles = function() {
	return RocketChat.models.Roles.find().fetch();
};
