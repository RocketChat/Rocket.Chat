//Convenience method, almost need to turn it into a middleware of sorts
RocketChat.API.v1.helperMethods.set('getUserFromParams', function _getUserFromParams() {
	const doesntExist = { _doesntExist: true };
	let user;
	const params = this.requestParams();

	if (params.userId && params.userId.trim()) {
		user = RocketChat.models.Users.findOneById(params.userId) || doesntExist;
	} else if (params.username && params.username.trim()) {
		user = RocketChat.models.Users.findOneByUsername(params.username) || doesntExist;
	} else if (params.user && params.user.trim()) {
		user = RocketChat.models.Users.findOneByUsername(params.user) || doesntExist;
	} else {
		throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
	}

	if (user._doesntExist) {
		throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
	}

	return user;
});
