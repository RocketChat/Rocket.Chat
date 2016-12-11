RocketChat.API.v1.addRoute('info', { authRequired: false }, {
	get: function() {
		return RocketChat.API.v1.success({
			info: RocketChat.Info
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
