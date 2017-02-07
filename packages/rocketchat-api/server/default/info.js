RocketChat.API.default.addRoute('info', { authRequired: false }, {
	get: function() {
		if (this.request.headers['x-user-id'] != null && RocketChat.authz.hasRole(this.request.headers['x-user-id'], 'admin')) {
			return RocketChat.Info;
		}

		return RocketChat.API.v1.success({
			info: {
				'version': RocketChat.Info.version
			}
		});
	}
});
