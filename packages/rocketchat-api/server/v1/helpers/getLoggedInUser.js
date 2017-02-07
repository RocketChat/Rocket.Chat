RocketChat.API.v1.helperMethods.set('getLoggedInUser', function _getLoggedInUser() {
	let user;

	if (this.request.headers['x-user-id'] && this.request.headers['x-auth-token']) {
		user = RocketChat.models.Users.findOneById(this.request.headers['x-user-id']);
	}

	return user;
});
