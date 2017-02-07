RocketChat.API.v1.addRoute('info', { authRequired: false }, {
	get: function() {
		if (this.request.headers['x-user-id'] != null && RocketChat.authz.hasRole(this.request.headers['x-user-id'], 'admin')) {
			return {
				info: RocketChat.Info
			}
		}

		return RocketChat.API.v1.success({
			info: {
				"version": RocketChat.Info.version
			}
		});
	}
});

RocketChat.API.v1.addRoute('me', { authRequired: true }, {
	get: function() {
		return RocketChat.API.v1.success(_.pick(this.user, [
			'_id',
			'name',
			'emails',
			'status',
			'statusConnection',
			'username',
			'utcOffset',
			'active',
			'language'
		]));
	}
});
