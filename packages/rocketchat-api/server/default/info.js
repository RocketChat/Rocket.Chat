RocketChat.API.default.addRoute('info', { authRequired: false }, {
	get() {
		const user = this.getLoggedInUser();

		if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
			return RocketChat.API.v1.success({
				info: RocketChat.Info
			});
		}

		return RocketChat.API.v1.success({
			version: RocketChat.Info.version
		});
	}
});
