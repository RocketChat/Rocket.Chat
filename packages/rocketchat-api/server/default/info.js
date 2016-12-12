RocketChat.API.default.addRoute('info', { authRequired: false }, {
	get: function() {
		return RocketChat.Info;
	}
});
