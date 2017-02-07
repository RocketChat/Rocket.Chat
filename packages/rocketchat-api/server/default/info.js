RocketChat.API.default.addRoute('info', { authRequired: false }, {
	get: function() {
		let user = this.getLoggedInUser();

		if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
			return {
				info: RocketChat.Info
			};
		}

		return RocketChat.API.v1.success({
			info: {
				'version': RocketChat.Info.version
			}
		});
	}
});
