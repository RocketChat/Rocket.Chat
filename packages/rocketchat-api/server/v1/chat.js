/* global processWebhookMessage */
RocketChat.API.v1.addRoute('chat.postMessage', { authRequired: true }, {
	post: function() {
		try {
			//TODO: Completely rewrite this? Seems too "magical"
			const messageReturn = processWebhookMessage(this.bodyParams, this.user);

			if (!messageReturn) {
				return RocketChat.API.v1.failure('unknown-error');
			}

			return RocketChat.API.v1.success({
				ts: Date.now(),
				channel: messageReturn.channel,
				message: messageReturn.message
			});
		} catch (e) {
			return RocketChat.API.v1.failure(e.error);
		}
	}
});
