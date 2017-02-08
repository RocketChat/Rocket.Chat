//Convience method, almost need to turn it into a middleware of sorts
RocketChat.API.v1.helperMethods.set('getUserFromParams', function _getUserFromParams() {
	const doesntExist = { _doesntExist: true };
	let user;

	switch (this.request.method) {
		case 'POST':
		case 'PUT':
			if (this.bodyParams.userId && this.bodyParams.userId.trim()) {
				user = RocketChat.models.Users.findOneById(this.bodyParams.userId) || doesntExist;
			} else if (this.bodyParams.username && this.bodyParams.username.trim()) {
				user = RocketChat.models.Users.findOneByUsername(this.bodyParams.username) || doesntExist;
			} else if (this.bodyParams.user && this.bodyParams.user.trim()) {
				user = RocketChat.models.Users.findOneByUsername(this.bodyParams.user) || doesntExist;
			}
			break;
		default:
			if (this.queryParams.userId && this.queryParams.userId.trim()) {
				user = RocketChat.models.Users.findOneById(this.queryParams.userId) || doesntExist;
			} else if (this.queryParams.username && this.queryParams.username.trim()) {
				user = RocketChat.models.Users.findOneByUsername(this.queryParams.username) || doesntExist;
			} else if (this.queryParams.user && this.queryParams.user.trim()) {
				user = RocketChat.models.Users.findOneByUsername(this.queryParams.user) || doesntExist;
			}
			break;
	}

	if (!user) {
		throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
	} else if (user._doesntExist) {
		throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
	}

	return user;
});
