RocketChat.API.v1.addRoute('info', { authRequired: false }, {
	get() {
		const user = this.getLoggedInUser();

		if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
			return RocketChat.API.v1.success({
				info: RocketChat.Info
			});
		}

		return RocketChat.API.v1.success({
			info: {
				'version': RocketChat.Info.version
			}
		});
	}
});

RocketChat.API.v1.addRoute('me', { authRequired: true }, {
	get() {
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
