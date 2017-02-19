RocketChat.API.default.helperMethods.set('getLoggedInUser', function _getLoggedInUser() {
	let user;

	if (this.request.headers['x-auth-token'] && this.request.headers['x-user-id']) {
		user = RocketChat.models.Users.findOne({
			'_id': this.request.headers['x-user-id'],
			'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(this.request.headers['x-auth-token'])
		});
	}

	return user;
});
