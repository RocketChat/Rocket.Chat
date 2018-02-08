RocketChat.API.v1.addRoute('messages/types', { authRequired: true }, {
	get() {
		const messageTypes = RocketChat.MessageTypes.getTypes();

		return RocketChat.API.v1.success({
			result: messageTypes
		});
	}
});
