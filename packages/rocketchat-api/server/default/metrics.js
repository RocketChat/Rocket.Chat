RocketChat.API.default.addRoute('metrics', { authRequired: false }, {
	get() {
		return {
			headers: { 'Content-Type': 'text/plain' },
			body: RocketChat.promclient.register.metrics()
		};
	}
});
