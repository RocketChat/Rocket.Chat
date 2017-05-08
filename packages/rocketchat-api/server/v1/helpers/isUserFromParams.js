RocketChat.API.v1.helperMethods.set('isUserFromParams', function _isUserFromParams() {
	return (this.queryParams.userId && this.userId === this.queryParams.userId) ||
		(this.queryParams.username && this.user.username === this.queryParams.username) ||
		(this.queryParams.user && this.user.username === this.queryParams.user);
});
