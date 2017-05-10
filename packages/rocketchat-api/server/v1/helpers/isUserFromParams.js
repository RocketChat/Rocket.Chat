RocketChat.API.v1.helperMethods.set('isUserFromParams', function _isUserFromParams() {
	let params;

	switch (this.request.method) {
		case 'POST':
		case 'PUT':
			params = this.bodyParams;
			break;
		default:
			params = this.queryParams;
			break;
	}

	return (!params.userId && !params.username && !params.user) ||
		(params.userId && this.userId === params.userId) ||
		(params.username && this.user.username === params.username) ||
		(params.user && this.user.username === params.user);
});
